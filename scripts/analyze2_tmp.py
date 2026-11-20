#!/usr/bin/env python3
"""Throwaway, read only (second pass): YouTube retention per video (needs the account id), plus account level insights."""
import json, os, sys, time, urllib.error, urllib.parse, urllib.request
KEY = os.environ.get("ZERNIO_API_KEY", "")
URL = (os.environ.get("ZERNIO_API_URL") or "https://zernio.com/api/v1").rstrip("/")
OUT = "analysis2"
os.makedirs(OUT, exist_ok=True)


def call(path, params=None):
    q = ("?" + urllib.parse.urlencode(params)) if params else ""
    for attempt in range(3):
        req = urllib.request.Request(URL + path + q)
        req.add_header("Authorization", f"Bearer {KEY}")
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            body = e.read()[:500].decode(errors="replace")
            if e.code == 429:
                time.sleep(30)
                continue
            if e.code in (202, 500, 502, 503) and attempt < 2:
                time.sleep(6)
                continue
            return {"_error": e.code, "_body": body}
        except Exception as e:
            if attempt == 2:
                return {"_error": "net", "_body": str(e)[:300]}
            time.sleep(5)


def save(name, obj):
    with open(os.path.join(OUT, name), "w") as f:
        json.dump(obj, f, separators=(",", ":"))
    print(f"saved {name} ({os.path.getsize(os.path.join(OUT, name))} bytes)", flush=True)


acc = json.load(open("analysis/accounts.json"))["accounts"]
ids = {a["platform"]: a["_id"] for a in acc}
print("accounts:", ids)

# account level insights, raw (what the platforms say about who watches)
acct = {}
for name, path, params in [
    ("ig-insights", "/analytics/instagram/account-insights", {"accountId": ids["instagram"]}),
    ("ig-insights-reach", "/analytics/instagram/account-insights", {"accountId": ids["instagram"], "metrics": "reach,views,follower_count"}),
    ("tt-insights", "/analytics/tiktok/account-insights", {"accountId": ids["tiktok"]}),
    ("yt-daily-account", "/analytics/youtube/daily-views", {"accountId": ids["youtube"]}),
    ("yt-demographics", "/analytics/youtube/demographics", {"accountId": ids["youtube"]}),
    ("fb-insights", "/analytics/facebook/page-insights", {"accountId": ids["facebook"]}),
]:
    acct[name] = call(path, params)
    print(name, json.dumps(acct[name])[:700], flush=True)
    time.sleep(1.5)
save("account-insights.json", acct)

# YouTube retention for the videos with the most views
A = json.load(open("analysis/analytics.json"))
yt = []
for r in A:
    for pl in r.get("platforms", []):
        if pl["platform"] == "youtube" and pl.get("platformPostId"):
            yt.append(((pl.get("analytics") or {}).get("views") or 0, pl["platformPostId"], r.get("content", "")[:50]))
yt.sort(reverse=True)
print(len(yt), "youtube videos; top views", yt[:3])
out = {}
for views, vid, text in yt[:100]:
    r = call("/analytics/youtube/video-retention", {"videoId": vid, "accountId": ids["youtube"]})
    out[vid] = {"views": views, "text": text, "retention": r}
    if len(out) <= 2:
        print("sample", vid, json.dumps(r)[:900], flush=True)
    time.sleep(1.5)
save("youtube-retention.json", out)
errs = [v for v in out.values() if isinstance(v["retention"], dict) and "_error" in v["retention"]]
print(f"retention: {len(out)} videos, {len(errs)} errors", flush=True)
if errs:
    print("first error:", json.dumps(errs[0])[:400])
print("done")
