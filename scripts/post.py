"""Books every finished video through Zernio: the stories on Instagram, TikTok and YouTube, the render lessons on
YouTube only.

Runs at the end of every "Make videos" run. A video is finished when its release exists. Each finished
video that isn't booked yet goes to the next free time of its series in schedule.json (UTC: "times" and
"platforms" for the stories, "series" -> "lesson" for the lessons), after the last one of that series booked
and at least 30 minutes from now, in number order; they're booked soonest first, so if the plan's post limit stops
a run, the posts due next went in. Zernio holds the post and publishes it at that time, so nothing has to run then. posts.json keeps what was booked: id -> at, zernio_id, platforms.

Videos listed in schedule.json "now" post the moment they're made instead (one already booked for later comes off
Zernio and posts right away).
A remade story that is booked but not posted yet comes off Zernio and is booked again at the same time
with the new video. Each run also asks Zernio how the posts that were due went out and keeps that in
posts.json (status, and each platform's link or error); a post that failed anywhere fails the run once.
A platform that refused a post over a limit (YouTube's daily upload limit, Zernio's rate limit) gets the video again,
alone, booked for after the limit lifts, up to three tries and at most RETRY_PER_DAY a day: posts.json keeps the
latest under "retry". A
video that can't post now because the account is rate limited is booked for when the limit lifts.
Without ZERNIO_API_KEY, or with "paused": true in schedule.json, nothing is booked or checked.

  python3 scripts/post.py [--remade "001-cullinan ..."] [--dry-run]
"""
import argparse
import datetime as dt
import glob
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, "posts.json")
LEAD = dt.timedelta(minutes=30)
DONE = {"published", "partial", "failed", "cancelled"}
RETRY_PER_DAY = 4  # re-posts after a limit, per UTC day: YouTube's daily upload limit counts every upload
UTC = dt.timezone.utc


def iso(t):
    return t.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse(s):
    return dt.datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)


def next_slot(after, times):
    """The first posting time strictly after `after`."""
    day = after.date()
    for _ in range(3):
        for hm in sorted(times):
            h, m = map(int, hm.split(":"))
            t = dt.datetime(day.year, day.month, day.day, h, m, tzinfo=UTC)
            if t > after:
                return t
        day += dt.timedelta(days=1)
    raise ValueError("schedule.json has no posting times")


def lifts(at, text):
    """When a platform that refused a post at `at` over a limit takes posts again (10 minutes to spare), or None
    when the refusal wasn't about a limit."""
    if not re.search(r"limit", text, re.I):
        return None
    if m := re.search(r"rateLimitedUntil\W+(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)", text):
        return parse(m.group(1) + "Z") + dt.timedelta(minutes=10)
    if m := re.search(r"wait (\d+) minutes", text):
        return at + dt.timedelta(minutes=int(m.group(1)) + 10)
    if m := re.search(r"wait (\d+)h (\d+)m", text):
        return at + dt.timedelta(hours=int(m.group(1)), minutes=int(m.group(2)) + 10)
    return at + dt.timedelta(hours=24, minutes=10)


class Zernio:
    def __init__(self, key, url):
        self.key, self.url = key, url.rstrip("/")

    def call(self, method, path, body=None, headers=None):
        for attempt in range(3):
            req = urllib.request.Request(self.url + path, method=method,
                                         data=None if body is None else json.dumps(body).encode())
            req.add_header("Authorization", f"Bearer {self.key}")
            req.add_header("Content-Type", "application/json")
            for k, v in (headers or {}).items():
                req.add_header(k, v)
            try:
                with urllib.request.urlopen(req, timeout=120) as r:
                    return json.loads(r.read() or b"{}")
            except urllib.error.HTTPError as e:
                text = e.read()[:500].decode(errors="replace")
                if e.code < 500 or attempt == 2:
                    raise RuntimeError(f"Zernio said {e.code} to {method} {path}: {text}") from None
            except (urllib.error.URLError, TimeoutError):
                if attempt == 2:
                    raise
            time.sleep(10 * (attempt + 1))

    def upload(self, path):
        """Puts the video in Zernio's storage and returns its public URL."""
        name = os.path.basename(path)
        got = self.call("POST", "/media/presign",
                        {"filename": name, "contentType": "video/mp4", "size": os.path.getsize(path)})
        with open(path, "rb") as f:
            data = f.read()
        for attempt in range(3):
            req = urllib.request.Request(got["uploadUrl"], data=data, method="PUT")
            req.add_header("Content-Type", "video/mp4")  # storage, not the API: no Authorization header
            try:
                with urllib.request.urlopen(req, timeout=600):
                    return got["publicUrl"]
            except (urllib.error.URLError, TimeoutError):
                if attempt == 2:
                    raise
                time.sleep(10 * (attempt + 1))

    def accounts(self, wanted, known):
        """The account to post to on each wanted platform. The id in schedule.json wins while it's connected;
        otherwise the platform's only connected account. A platform with none, or several unknown ones, is left out."""
        data = self.call("GET", "/accounts")
        live = {}
        for a in data.get("accounts", []) if isinstance(data, dict) else data:
            if a.get("isActive") is not False:
                live.setdefault(a.get("platform"), []).append(a.get("_id") or a.get("id"))
        use = {}
        for p in wanted:
            ids = live.get(p) or []
            if known.get(p) in ids:
                use[p] = known[p]
            elif len(ids) == 1:
                use[p] = ids[0]
            elif ids:
                print(f"::warning::{p}: {len(ids)} accounts in Zernio and none is the one in schedule.json; skipped")
            else:
                print(f"::warning::{p} isn't connected in Zernio; skipped")
        return use


def check(z, posts, now):
    """Asks Zernio how each post that was due went out and records it once Zernio has finished with it.
    Returns the ids of the posts that failed anywhere."""
    bad = []
    for sid, p in posts.items():
        r = p.get("retry")
        if r and r.get("status") not in DONE and parse(r["at"]) <= now - dt.timedelta(minutes=20):
            try:
                post = (lambda g: g.get("post") or g)(z.call("GET", f"/posts/{r['zernio_id']}"))
            except RuntimeError as e:
                print(f"::warning::couldn't ask Zernio about the second try of {sid}: {e}")
                post = {}
            if post.get("status") in DONE:
                r["status"] = post["status"]
                for e in post.get("platforms") or []:
                    name = e.get("platform") or "?"
                    ok = e.get("status") in ("published", "success")
                    err = e.get("errorMessage") or e.get("error") or e.get("status")
                    p.setdefault("out", {})[name] = (e.get("platformPostUrl") or "published") if ok else f"{e.get('status')}: {err}"[:300]
                if all(str(v).startswith("http") or v == "published" for v in p["out"].values()):
                    p["status"] = "published"
                print(f"{sid}, second try ({r['at']}): {r['status']}; " + ", ".join(f"{k} {v}" for k, v in p["out"].items()))
        # a published post whose link Zernio didn't have yet (TikTok can lag) is asked about again for two days
        no_link = p.get("status") == "published" and any(not str(v).startswith("http") for v in (p.get("out") or {}).values())
        if no_link and parse(p["at"]) > now - dt.timedelta(days=2):
            try:
                post = (lambda g: g.get("post") or g)(z.call("GET", f"/posts/{p['zernio_id']}"))
                for e in post.get("platforms") or []:
                    if e.get("platformPostUrl"):
                        p["out"][e.get("platform") or "?"] = e["platformPostUrl"]
            except RuntimeError as e:
                print(f"::warning::couldn't ask Zernio about {sid}: {e}")
            continue
        if p.get("status") in DONE or parse(p["at"]) > now - dt.timedelta(minutes=20):
            continue
        try:
            got = z.call("GET", f"/posts/{p['zernio_id']}")
        except RuntimeError as e:
            print(f"::warning::couldn't ask Zernio about {sid}: {e}")
            continue
        post = got.get("post") or got
        status, out, wrong = post.get("status") or "unknown", {}, []
        for e in post.get("platforms") or []:
            name = e.get("platform") or "?"
            out[name] = e.get("platformPostUrl") or e.get("status") or ""
            if status in ("partial", "failed", "cancelled") and e.get("status") not in ("published", "success"):
                err = e.get("errorMessage") or e.get("error") or e.get("errorDetails") or e.get("status")
                out[name] = f"{e.get('status')}: {err}"[:300]
                wrong.append(name)
        if status not in DONE:
            if parse(p["at"]) < now - dt.timedelta(hours=6):
                print(f"::warning::{sid} was due at {p['at']} and is still '{status}' in Zernio")
            continue
        p["status"], p["out"] = status, out
        print(f"{sid} ({p['at']}): {status}; " + ", ".join(f"{k} {v}" for k, v in out.items()))
        if status != "published" or wrong:
            print(f"::error::{sid} didn't go out everywhere: {status}, {', '.join(wrong) or 'see Zernio'}")
            bad.append(sid)
    return bad


def payload(story, url, slot, accounts, intro=""):  # slot None: post right away; intro: a first line for the series
    post = story["post"]
    text = (intro.strip() + "\n\n" if intro.strip() else "") + post["caption"].strip() + "\n\n" + " ".join(post["hashtags"])
    title = post.get("youtube_title") or story["hook"]["text"]
    platforms = []
    for name, account in accounts.items():
        entry = {"platform": name, "accountId": account}
        if name == "youtube":
            entry["platformSpecificData"] = {"title": title[:100], "visibility": "public", "madeForKids": False,
                                             "containsSyntheticMedia": False, "categoryId": "27"}  # Education
        platforms.append(entry)
    body = {"content": text, "mediaItems": [{"url": url, "type": "video"}], "platforms": platforms}
    body.update({"publishNow": True} if slot is None else {"scheduledFor": iso(slot), "timezone": "UTC"})
    if "tiktok" in accounts:
        body["tiktokSettings"] = {"privacy_level": "PUBLIC_TO_EVERYONE", "allow_comment": True, "allow_duet": True,
                                  "allow_stitch": True, "content_preview_confirmed": True,
                                  "express_consent_given": True}
    return body


def series_of(sid):
    return "lesson" if sid.startswith("lesson-") else "story"


def plan(sched, series):
    """The posting times and platforms of a series: schedule.json's own for the stories, "series" overrides others."""
    own = (sched.get("series") or {}).get(series) or {}
    return own.get("times") or sched["times"], own.get("platforms") or sched["platforms"]


def save(posts):
    with open(POSTS, "w") as f:
        json.dump(dict(sorted(posts.items())), f, indent=2)
        f.write("\n")


def output(**kw):
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            for k, v in kw.items():
                f.write(f"{k}={v}\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--remade", default="")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    with open(os.path.join(ROOT, "schedule.json")) as f:
        sched = json.load(f)
    if sched.get("paused"):
        print("Posting is paused in schedule.json; nothing booked.")
        return 0
    key = os.environ.get("ZERNIO_API_KEY", "")
    if not key and not args.dry_run:
        print("::notice::No ZERNIO_API_KEY secret yet, so no video is booked.")
        return 0
    z = Zernio(key, os.environ.get("ZERNIO_API_URL") or "https://zernio.com/api/v1")
    posts = json.load(open(POSTS)) if os.path.exists(POSTS) else {}
    now = dt.datetime.now(UTC)
    if not args.dry_run:  # the plan and how much of its post limit is used, for the run log
        try:
            print("Zernio usage:", json.dumps(z.call("GET", "/usage"))[:600])
        except Exception as e:
            print(f"Couldn't read Zernio usage ({e})")
    bad = [] if args.dry_run else check(z, posts, now)
    if bad or any(p.get("status") for p in posts.values()):
        save(posts)

    # A remade video that hasn't gone out yet replaces the booked one, at the same time.
    keep_slot = {}
    for sid in args.remade.split():
        old = posts.get(sid)
        if not old:
            continue
        if parse(old["at"]) <= now + dt.timedelta(minutes=10):
            print(f"::warning::{sid} was already posted at {old['at']}; the new video isn't posted again")
            continue
        if args.dry_run:
            print(f"Would take {sid} off Zernio and book it again at {old['at']}")
        else:
            try:
                z.call("DELETE", f"/posts/{old['zernio_id']}")
            except RuntimeError as e:
                if " 404 " not in str(e):
                    print(f"::warning::couldn't take the old {sid} off Zernio, so it stays as booked: {e}")
                    continue
        keep_slot[sid] = parse(old["at"])
        del posts[sid]
        save(posts)

    # A video put in "now" after it was booked for later comes off Zernio and posts right away instead.
    for sid in sched.get("now", []):
        old = posts.get(sid)
        if not old or old.get("status") or parse(old["at"]) <= now + dt.timedelta(minutes=10):
            continue
        if args.dry_run:
            print(f"Would take {sid} off Zernio ({old['at']}) and post it now")
            continue
        try:
            z.call("DELETE", f"/posts/{old['zernio_id']}")
        except RuntimeError as e:
            if " 404 " not in str(e):
                print(f"::warning::couldn't take {sid} off Zernio, so it stays booked for {old['at']}: {e}")
                continue
        print(f"Took {sid} off Zernio ({old['at']}); it posts now")
        del posts[sid]
        save(posts)

    made = set(subprocess.run(["gh", "release", "list", "--limit", "2000", "--json", "tagName", "--jq",
                               ".[].tagName"], check=True, capture_output=True, text=True).stdout.split())
    stories = []
    for f in glob.glob(os.path.join(ROOT, "stories", "*.json")) + glob.glob(os.path.join(ROOT, "lessons", "*.json")):
        s = json.load(open(f))
        if s["id"] in made and s["id"] not in posts:
            stories.append(s)
    stories.sort(key=lambda s: (series_of(s["id"]), s["number"]))
    if not stories:
        print("Every finished video is booked.")

    wanted = sorted({p for series in ("story", "lesson") for p in plan(sched, series)[1]})
    every = z.accounts(wanted, sched.get("accounts", {})) if not args.dry_run \
        else {p: sched.get("accounts", {}).get(p) or "dry-run" for p in wanted}
    if not every:
        print("::error::no account to post to is connected in Zernio")
        return 1
    # each series books after its own last post
    lasts = {}
    for sid, p in list(posts.items()) + [(sid, {"at": iso(t)}) for sid, t in keep_slot.items()]:
        lasts[series_of(sid)] = max(lasts.get(series_of(sid), now + LEAD), parse(p["at"]))
    # Every video gets its time first (each series after its own last post), then they're booked soonest first, so
    # when the plan's post limit cuts a run short, the posts that did go in are the next ones due across the series.
    queue = []
    for s in stories:
        sid, series = s["id"], series_of(s["id"])
        times, platforms = plan(sched, series)
        accounts = {p: a for p, a in every.items() if p in platforms}
        if not accounts:
            print(f"::warning::{sid}: none of {', '.join(platforms)} is connected in Zernio; not booked")
            continue
        slot, right_away = keep_slot.get(sid), sid in sched.get("now", [])
        if right_away:
            slot = None
        elif slot is None or slot <= now + LEAD:
            slot = lasts[series] = next_slot(max(lasts.get(series, now + LEAD), now + LEAD), times)
        queue.append((slot or now, s, series, slot, accounts))
    queue.sort(key=lambda q: (q[0], q[1]["id"]))
    booked, failed = [], int(bool(bad))
    run = os.environ.get("GITHUB_RUN_ID") or int(now.timestamp())  # a retry in this run is the same post, a later run isn't
    def book(s, series, slot, accounts, tmp, tag=""):
        """Uploads a video and books it in Zernio; returns the Zernio post id and the time it posts."""
        sid = s["id"]
        subprocess.run(["gh", "release", "download", sid, "-p", f"{sid}.mp4", "-D", tmp, "--clobber"], check=True)
        path = os.path.join(tmp, f"{sid}.mp4")
        with open(path, "rb") as f:
            digest = hashlib.sha256(f.read()).hexdigest()[:16]
        url = z.upload(path)
        intro = ((sched.get("series") or {}).get(series) or {}).get("intro", "")
        for attempt in range(2):
            body = payload(s, url, slot, accounts, intro)
            try:
                res = z.call("POST", "/posts", body, {"Idempotency-Key": f"story-{sid}{tag}-{digest}-{run}-{attempt}"})
                made_post = res.get("post") or res
                return made_post.get("_id") or made_post.get("id") or "", slot
            except RuntimeError as e:
                # The same post already went in (a retry Zernio had taken): it's this one.
                if " 409 " in str(e) and (zid := re.search(r'"existingPostId"\s*:\s*"([0-9a-f]+)"', str(e))):
                    return zid.group(1), slot
                # An account that's rate limited right now: book it for when the limit lifts.
                lift = lifts(dt.datetime.now(UTC), str(e)) if " 429 " in str(e) else None
                if attempt or not lift:
                    raise
                print(f"{sid}: {', '.join(accounts)} is rate limited; booking it for {iso(lift)}")
                slot = max(lift, slot or lift)

    with tempfile.TemporaryDirectory() as tmp:
        # Platforms that refused a post over a limit get it once more, alone, after the limit lifts.
        retried = {}
        for p in posts.values():
            if p.get("retry"):
                day = p["retry"]["at"][:10]
                retried[day] = retried.get(day, 0) + 1
        found = {}
        for f in glob.glob(os.path.join(ROOT, "stories", "*.json")) + glob.glob(os.path.join(ROOT, "lessons", "*.json")):
            found[os.path.basename(f)[:-5]] = f
        todo = []
        for sid, p in posts.items():
            r = p.get("retry") or {}
            if r and (r.get("status") not in DONE or r.get("tries", 1) >= 3):
                continue
            if p.get("status") not in ("partial", "failed") or sid not in found:
                continue
            at = parse(r.get("at") or p["at"])
            refused = {k: lifts(at, str(v)) for k, v in (p.get("out") or {}).items() if not str(v).startswith("http") and v != "published"}
            if refused and all(refused.values()):
                todo.append((series_of(sid) != "lesson", p["at"], sid, max(refused.values()), sorted(refused), r.get("tries", 0) + 1))
        todo.sort()  # lessons first (YouTube is their only home), then the oldest
        last = now + LEAD
        for _, _, sid, lift, names, tries in todo:
            when = max(lift, last, now + LEAD)
            while retried.get(iso(when)[:10], 0) >= RETRY_PER_DAY:
                when = dt.datetime.combine(when.date() + dt.timedelta(days=1), dt.time(13, 10), UTC)
            accounts = {k: a for k, a in every.items() if k in names}
            if not accounts:
                continue
            if args.dry_run:
                print(f"Would post {sid} again on {', '.join(accounts)} at {iso(when)}")
                continue
            try:
                s = json.load(open(found[sid]))
                zid, when = book(s, series_of(sid), when, accounts, tmp, "-again")
                posts[sid]["retry"] = {"at": iso(when), "zernio_id": zid, "platforms": list(accounts), "tries": tries}
                save(posts)
                retried[iso(when)[:10]] = retried.get(iso(when)[:10], 0) + 1
                last = when + dt.timedelta(minutes=20)
                print(f"Booked {sid} again on {', '.join(accounts)} for {iso(when)} (Zernio post {zid})")
            except Exception as e:
                print(f"::error::{sid} wasn't booked again: {e}")
                failed = 1

        for _, s, series, slot, accounts in queue:
            sid = s["id"]
            when = "now" if slot is None else iso(slot)
            if args.dry_run:
                print(f"Would book {sid} for {when} on {', '.join(accounts)}")
                continue
            try:
                zid, slot = book(s, series, slot, accounts, tmp)
                when = "now" if slot is None else iso(slot)
                posts[sid] = {"at": iso(slot or dt.datetime.now(UTC)), "zernio_id": zid, "platforms": list(accounts)}
                save(posts)
                booked.append(sid)
                print(f"Booked {sid} for {when} on {', '.join(accounts)} (Zernio post {zid})")
            except Exception as e:  # one video failing mustn't stop the others; it's tried again next run
                print(f"::error::{sid} wasn't booked: {e}")
                failed = 1
                if " 403 " in str(e) or " 402 " in str(e):  # the plan's post limit: the rest would fail the same way
                    print("::error::Zernio refused the post (plan limit?); the rest wait for the next run")
                    break
    # Posts that went out right away: wait for Zernio to finish them, so posts.json gets their links in this run.
    waiting = [sid for sid in booked if sid in sched.get("now", []) and parse(posts[sid]["at"]) <= dt.datetime.now(UTC)]
    for _ in range(40):
        if not waiting:
            break
        time.sleep(30)
        failed |= int(bool(check(z, posts, dt.datetime.now(UTC) + dt.timedelta(minutes=21))))
        save(posts)
        waiting = [sid for sid in waiting if posts[sid].get("status") not in DONE]
    for sid in waiting:
        print(f"::warning::{sid} wasn't done in Zernio after 20 minutes; the next run records it")
    output(booked=" ".join(booked))
    return failed


if __name__ == "__main__":
    sys.exit(main())
