#!/usr/bin/env python3
"""Throwaway, read only (third pass): account level numbers that show clicks to our site and TikTok's own view counts."""
import json, os, time, urllib.error, urllib.parse, urllib.request
KEY = os.environ.get("ZERNIO_API_KEY", "")
URL = (os.environ.get("ZERNIO_API_URL") or "https://zernio.com/api/v1").rstrip("/")
OUT = "analysis3"
os.makedirs(OUT, exist_ok=True)


def call(path, params=None):
    q = ("?" + urllib.parse.urlencode(params)) if params else ""
    req = urllib.request.Request(URL + path + q)
    req.add_header("Authorization", f"Bearer {KEY}")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_body": e.read()[:500].decode(errors="replace")}
    except Exception as e:
        return {"_error": "net", "_body": str(e)[:300]}


acc = json.load(open("analysis/accounts.json"))["accounts"]
ids = {a["platform"]: a["_id"] for a in acc}
out = {}
for name, path, params in [
    ("ig-clicks", "/analytics/instagram/account-insights", {"accountId": ids["instagram"], "metrics": "profile_links_taps,website_clicks,profile_views,follows_and_unfollows,shares,saves,comments,likes,reach,views"}),
    ("ig-clicks-daily", "/analytics/instagram/account-insights", {"accountId": ids["instagram"], "metrics": "views,reach,profile_links_taps", "metricType": "time_series"}),
    ("tt-views", "/analytics/tiktok/account-insights", {"accountId": ids["tiktok"], "metrics": "video_views,likes,comments,shares,profile_views"}),
    ("tt-views-daily", "/analytics/tiktok/account-insights", {"accountId": ids["tiktok"], "metrics": "video_views,profile_views", "metricType": "time_series"}),
    ("fb-daily", "/analytics/facebook/page-insights", {"accountId": ids["facebook"], "metricType": "time_series"}),
]:
    out[name] = call(path, params)
    print(name, json.dumps(out[name])[:1500], flush=True)
    time.sleep(1)
with open(os.path.join(OUT, "account3.json"), "w") as f:
    json.dump(out, f, separators=(",", ":"))
print("done")
