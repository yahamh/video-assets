"""Prepares the gem size Shorts' artwork: copies the stone and finger SVGs from gemsize/source/ into public/gemsize/ without
their C2PA block, and writes public/gemsize/manifest.json (each stone's size, its centre and its outline).

Usage: python3 scripts/gemsize_assets.py SOURCE_DIR   (SOURCE_DIR holds stones/ and finger-size-6/, from the gem size
thread's video-assets folder; numbers.json is gemsize/numbers.json)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1])
out = ROOT / "public" / "gemsize"
out.mkdir(parents=True, exist_ok=True)
manifest = {}
strip = lambda s: re.sub(r"<metadata>.*?</metadata>", "", s, flags=re.S)
for f in sorted((src / "finger-size-6").glob("*.svg")):
    (out / f"finger-{f.name}").write_text(strip(f.read_text()))
for f in sorted((src / "stones").glob("*.svg")):
    s = strip(f.read_text())
    vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    cx, cy = (float(x) for x in re.search(r'<g transform="translate\(([\d.]+) ([\d.]+)\)"', s).groups())
    outline = re.search(r'<g transform="translate\([\d. ]+\)"><path d="([^"]+)"', s).group(1)
    inner = re.sub(r"^<svg[^>]*>|</svg>\s*$", "", s.strip())
    manifest[f.stem] = {"w": vb[2], "h": vb[3], "cx": cx, "cy": cy, "outline": outline, "inner": inner}
    (out / f"stone-{f.name}").write_text(s)
(out / "manifest.json").write_text(json.dumps(manifest))
print(f"{len(manifest)} stones, {len(list(out.glob('finger-*.svg')))} fingers -> {out}")
