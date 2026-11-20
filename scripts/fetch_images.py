#!/usr/bin/env python3
"""Finds real pictures of a story's subject, checks each one's license, and saves the usable ones for a look.

Run on a GitHub runner (the cloud sessions can't reach Wikimedia or the Met). Reads images-request.json:
  {"queries": [{"key": "034-diana", "commons": ["Diana engagement ring", ...], "met": ["sapphire ring"], "files": ["File:X.jpg"]}]}
and writes images-out/<key>/<n>.jpg plus images-out/candidates.json (license, author, credit, page for each).

License classes: "pd" (public domain, CC0, Met Open Access: no credit needed), "by" (CC BY: the credit must be shown),
"sa" (CC BY-SA: kept apart, never used without ali's word). Anything else (NC, ND, fair use, unknown) is dropped.
Read only: nothing is posted anywhere."""
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

UA = "HeyGemaStories/1.0 (https://github.com/yahamh/video-assets; picture search for jewelry history videos)"
OUT = "images-out"
os.makedirs(OUT, exist_ok=True)


def get(url, binary=False, tries=4):
    for i in range(tries):
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
                return data if binary else json.loads(data)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and i < tries - 1:
                time.sleep(8 * (i + 1))
                continue
            print("  http", e.code, url[:120])
            return None
        except Exception as e:
            if i == tries - 1:
                print("  error", str(e)[:100], url[:120])
                return None
            time.sleep(4)
    return None


def strip(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def classify(meta):
    lic = strip((meta.get("LicenseShortName") or {}).get("value", "")).lower()
    terms = strip((meta.get("UsageTerms") or {}).get("value", "")).lower()
    nonfree = strip((meta.get("NonFree") or {}).get("value", "")).lower() in ("true", "1")
    if nonfree:
        return None, lic
    if re.search(r"(^|\b)(public domain|pd[- ]|pd$|cc0|no restrictions|cc zero)", lic) or lic.startswith("pd"):
        return "pd", lic
    if re.match(r"cc by (\d|-)", lic) and not re.search(r"-(sa|nc|nd)", lic) and "nc" not in lic.split()[-2:]:
        return "by", lic
    if re.match(r"cc by-sa", lic) or lic.startswith("gfdl"):
        return "sa", lic
    return None, lic or terms


def commons_info(titles):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1400, "titles": "|".join(titles)})
    return get("https://commons.wikimedia.org/w/api.php?" + q)


def commons_search(term, limit=18):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "generator": "search", "gsrsearch": term + " filetype:bitmap", "gsrnamespace": 6, "gsrlimit": limit,
                                "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1400})
    return get("https://commons.wikimedia.org/w/api.php?" + q)


def from_commons(res, out, seen):
    pages = ((res or {}).get("query") or {}).get("pages") or {}
    for p in sorted(pages.values(), key=lambda p: p.get("index", 99)):
        ii = (p.get("imageinfo") or [None])[0]
        if not ii or ii.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
            continue
        if min(ii.get("width", 0), ii.get("height", 0)) < 700 or max(ii.get("width", 0), ii.get("height", 0)) < 1000:
            continue
        cls, lic = classify(ii.get("extmetadata") or {})
        if not cls or p["title"] in seen:
            continue
        m = ii.get("extmetadata") or {}
        seen.add(p["title"])
        out.append({
            "source": "commons", "title": p["title"], "page": ii.get("descriptionshorturl") or "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(p["title"].replace(" ", "_")),
            "license": strip((m.get("LicenseShortName") or {}).get("value", "")), "cls": cls,
            "artist": strip((m.get("Artist") or {}).get("value", ""))[:120], "credit": strip((m.get("Credit") or {}).get("value", ""))[:160],
            "desc": strip((m.get("ImageDescription") or {}).get("value", ""))[:240], "date": strip((m.get("DateTimeOriginal") or {}).get("value", ""))[:40],
            "restrictions": strip((m.get("Restrictions") or {}).get("value", ""))[:80],
            "w": ii.get("width"), "h": ii.get("height"), "url": ii.get("thumburl") or ii.get("url"),
        })


def from_met(term, out, seen):
    q = urllib.parse.urlencode({"hasImages": "true", "isPublicDomain": "true", "q": term})
    res = get("https://collectionapi.metmuseum.org/public/collection/v1/search?" + q)
    for oid in ((res or {}).get("objectIDs") or [])[:5]:
        o = get(f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{oid}")
        if not o or not o.get("isPublicDomain") or not o.get("primaryImage"):
            continue
        t = "met:" + str(oid)
        if t in seen:
            continue
        seen.add(t)
        out.append({"source": "met", "title": o.get("title", ""), "page": o.get("objectURL", ""), "license": "CC0 (Met Open Access)", "cls": "pd",
                    "artist": strip(o.get("artistDisplayName", "")) or strip(o.get("culture", "")), "credit": strip(o.get("creditLine", ""))[:160],
                    "desc": strip(f'{o.get("objectName", "")}, {o.get("medium", "")}')[:240], "date": o.get("objectDate", ""), "restrictions": "",
                    "w": None, "h": None, "url": o.get("primaryImage")})
        time.sleep(0.3)


def save(cand, path):
    data = get(cand["url"], binary=True)
    if not data or len(data) < 5000:
        return False
    tmp = path + ".src"
    open(tmp, "wb").write(data)
    try:
        from PIL import Image, ImageFile
        ImageFile.LOAD_TRUNCATED_IMAGES = True
        im = Image.open(tmp).convert("RGB")
        cand["w"], cand["h"] = im.size
        im.thumbnail((1400, 1400))
        im.save(path, "JPEG", quality=88)
    except Exception as e:
        print("  could not read the picture:", str(e)[:80])
        return False
    finally:
        os.remove(tmp)
    return True


req = json.load(open("images-request.json"))
allc = {}
for q in req["queries"]:
    key = q["key"]
    print("==", key)
    cands, seen = [], set()
    if q.get("files"):
        from_commons(commons_info(q["files"]), cands, seen)
    for term in q.get("commons", []):
        from_commons(commons_search(term), cands, seen)
        time.sleep(1)
    for term in q.get("met", []):
        from_met(term, cands, seen)
    cands.sort(key=lambda c: {"pd": 0, "by": 1, "sa": 2}[c["cls"]])
    keep = [c for c in cands if c["cls"] != "sa"][:int(q.get("max", 8))] + [c for c in cands if c["cls"] == "sa"][:3]
    os.makedirs(os.path.join(OUT, key), exist_ok=True)
    done = []
    for i, c in enumerate(keep):
        f = os.path.join(OUT, key, f"{i}.jpg")
        if save(c, f):
            c["file"] = f
            done.append(c)
            print(f"  {i} {c['cls']:2} {c['license'][:22]:22} {c['title'][:70]}")
        time.sleep(1.2)
    allc[key] = done
    json.dump(allc, open(os.path.join(OUT, "candidates.json"), "w"), indent=1)
json.dump(allc, open(os.path.join(OUT, "candidates.json"), "w"), indent=1)
print("done", sum(len(v) for v in allc.values()), "pictures")
