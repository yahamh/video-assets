#!/usr/bin/env python3
"""Throwaway, read only: pulls what Zernio knows about how our videos did (post analytics with retention curves,
YouTube retention, comments) into analysis/*.json so it can be read from the cloud. Posts nothing, changes nothing."""
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

KEY = os.environ.get("ZERNIO_API_KEY", "")
URL = (os.environ.get("ZERNIO_API_URL") or "https://zernio.com/api/v1").rstrip("/")
OUT = "analysis"
os.makedirs(OUT, exist_ok=True)
log = []


def call(path, params=None):
    q = ("?" + urllib.parse.urlencode(params)) if params else ""
    for attempt in range(3):
        req = urllib.request.Request(URL + path + q)
        req.add_header("Authorization", f"Bearer {KEY}")
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            body = e.read()[:400].decode(errors="replace")
            if e.code == 429:
                time.sleep(20)
                continue
            if e.code in (202, 500, 502, 503) and attempt < 2:
                time.sleep(6)
                continue
            return {"_error": e.code, "_body": body}
        except Exception as e:  # network
            if attempt == 2:
                return {"_error": "net", "_body": str(e)[:300]}
            time.sleep(5)
    return {"_error": "gave up"}


def save(name, obj):
    with open(os.path.join(OUT, name), "w") as f:
        json.dump(obj, f, separators=(",", ":"))
    print(f"saved {name} ({os.path.getsize(os.path.join(OUT, name))} bytes)")


def h(x):
    return hashlib.sha256(str(x).encode()).hexdigest()[:8]


def scrub(o):
    """Commenters' names and pictures never leave Zernio: keep a short hash of who it was and any yes/no flags."""
    if isinstance(o, list):
        return [scrub(x) for x in o]
    if isinstance(o, dict):
        r = {}
        for k, v in o.items():
            if k in ("from", "author", "user", "commenter", "sender"):
                r[k] = {"id": h(json.dumps(v, sort_keys=True)),
                        **{kk: vv for kk, vv in (v.items() if isinstance(v, dict) else []) if isinstance(vv, bool)}}
            elif k in ("username", "authorName", "authorUsername", "picture", "avatar", "profilePicture", "profileUrl",
                       "fromName", "name", "displayName", "userName"):
                r[k] = h(v)
            else:
                r[k] = scrub(v)
        return r
    return o


if not KEY:
    print("::error::no ZERNIO_API_KEY")
    sys.exit(1)

# 1. accounts and profiles
acc = call("/accounts")
save("accounts.json", acc)
prof = call("/profiles")
save("profiles.json", prof)
print("accounts:", json.dumps(acc)[:600])
print("profiles:", json.dumps(prof)[:400])

# 2. post analytics, every page, with retention curves
rows, page = [], 1
while page <= 20:
    got = call("/analytics", {"limit": 100, "page": page, "fromDate": "2026-10-01", "view": "full",
                              "sortBy": "date", "order": "desc"})
    if "_error" in got:
        print("analytics page", page, got)
        break
    ps = got.get("posts") or []
    if page == 1:
        print("overview:", json.dumps(got.get("overview")), "pagination:", json.dumps(got.get("pagination")))
    for p in ps:
        if isinstance(p.get("content"), str):
            p["content"] = p["content"][:240]
        p.pop("thumbnailUrl", None)
    rows += ps
    pg = got.get("pagination") or {}
    print(f"analytics page {page}: {len(ps)} posts")
    if len(ps) < 100 or pg.get("hasMore") is False:
        break
    page += 1
    time.sleep(0.5)
save("analytics.json", rows)
print("posts with analytics:", len(rows))

# 3. other analytics routes, raw
extra = {}
for name, path, params in [
    ("best-time", "/analytics/best-time", {}),
    ("format-breakdown", "/analytics/format-breakdown", {}),
    ("content-decay", "/analytics/content-decay", {}),
    ("daily-metrics", "/analytics/daily-metrics", {"fromDate": "2026-10-20"}),
    ("posting-frequency", "/analytics/posting-frequency", {}),
    ("dashboard", "/analytics/dashboard", {}),
]:
    extra[name] = call(path, params)
    print(name, json.dumps(extra[name])[:300])
    time.sleep(0.4)
ids = []
for a in (acc.get("accounts") if isinstance(acc, dict) else acc) or []:
    if isinstance(a, dict):
        ids.append(a.get("_id") or a.get("id") or a.get("accountId"))
ids = [i for i in ids if i][:25]
if ids:
    extra["follower-stats"] = call("/accounts/follower-stats", {"accountIds": ",".join(ids), "fromDate": "2026-10-15"})
    print("follower-stats", json.dumps(extra["follower-stats"])[:300])
save("extra.json", extra)

# 4. YouTube retention for each of our videos that went out
posts = json.load(open("posts.json"))
yt = {}
n = 0
for sid, p in sorted(posts.items(), key=lambda kv: kv[1].get("at", ""), reverse=True):
    u = (p.get("out") or {}).get("youtube") or ""
    m = re.search(r"v=([\w-]{6,})", u)
    if not m or n >= 110:
        continue
    vid = m.group(1)
    r = call("/analytics/youtube/video-retention", {"videoId": vid})
    yt[sid] = {"videoId": vid, "retention": r}
    n += 1
    if n <= 2:
        print("yt retention sample", sid, json.dumps(r)[:700])
    time.sleep(1.2)
save("youtube-retention.json", yt)
errs = sum(1 for v in yt.values() if isinstance(v["retention"], dict) and "_error" in v["retention"])
print(f"youtube retention: {n} videos, {errs} errors")
if errs:
    first = next(v for v in yt.values() if isinstance(v["retention"], dict) and "_error" in v["retention"])
    print("first error:", json.dumps(first)[:400])
yd = {}
for sid in list(yt)[:12]:
    yd[sid] = call("/analytics/youtube/daily-views", {"videoId": yt[sid]["videoId"]})
    time.sleep(1.2)
save("youtube-daily.json", yd)

# 5. comments
com = {"index": [], "threads": {}}
cursor, pages = None, 0
while pages < 15:
    params = {"limit": 100, "sortBy": "date", "sortOrder": "desc"}
    if cursor:
        params["cursor"] = cursor
    got = call("/inbox/comments", params)
    if "_error" in got:
        print("inbox/comments", json.dumps(got)[:500])
        com["error"] = got
        break
    data = got.get("data") or got.get("comments") or got.get("posts") or []
    if pages == 0:
        print("inbox/comments keys:", list(got.keys()), "first row:", json.dumps(data[:1])[:600], "meta:", json.dumps(got.get("meta"))[:300])
    com["index"] += scrub(data)
    pg = got.get("pagination") or {}
    pages += 1
    if not pg.get("hasMore") or not pg.get("nextCursor"):
        break
    cursor = pg["nextCursor"]
    time.sleep(0.5)
print("comment rows (posts with comments):", len(com["index"]))
threads = 0
for row in com["index"]:
    if threads >= 120:
        break
    if not isinstance(row, dict) or not (row.get("commentCount") or 0):
        continue
    pid, aid = row.get("id"), row.get("accountId")
    got = call(f"/inbox/comments/{pid}", {"accountId": aid} if aid else None)
    com["threads"][pid] = scrub(got)
    threads += 1
    if threads == 1:
        print("first thread:", json.dumps(com["threads"][pid])[:800])
    time.sleep(0.4)
save("comments.json", com)
print("comment threads read:", threads)
print("done")
