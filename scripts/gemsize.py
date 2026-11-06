"""Makes one gem size Short ("How big is a 1 carat oval?"): builds its spec from gemsize/numbers.json, reads the lines aloud
with Kokoro's af_heart (the tutorial voice), and writes the voiced spec the GemSize composition renders.

Usage (needs kokoro-onnx, soundfile, pyloudnorm; the model files from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0 in $KOKORO_MODEL, default /tmp/kokoro-model):
  python3 scripts/gemsize.py oval --out out/gs-01-oval.json [--hook B] [--no-voice]
  node scripts/render.mjs out/gs-01-oval.json out/gs-01-oval.mp4 GemSize
Then uploads/gs-01-oval.mp4 and uploads/gs-01-oval.json (the spec's "post" part and a hook) go to the stories branch: post.py books
it on YouTube from schedule.json series "gemsize". Every number on screen and in the voice comes from numbers.json.

Rules from the brief (/mnt/project-files/seo/gem-size/video-brief-shorts.md): the voice never mentions the gem sizer, no
dashes, no exclamation marks, no prices; "Estimates for a well-cut stone." in the description.
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE, SPEED = "af_heart", 1.0
PAD_S = 0.3
SITE = "https://www.heygema.com/en/gem-size"

# order from the brief (how strongly each phrase showed in autocomplete on 5 Nov), the name as said and written, the picture
# on the fourth beat (the length to width ratio, or the depth that hides weight), how the voice says the name
SHAPES = [
    ("oval", "oval", "ratio", "oval"),
    ("round", "round", "depth", "round"),
    ("emerald", "emerald cut", "ratio", "emerald cut"),
    ("princess", "princess", "depth", "princess"),
    ("marquise", "marquise", "ratio", "markeez"),
    ("pear", "pear", "ratio", "pear"),
    ("cushion", "cushion", "ratio", "cushion"),
    ("radiant", "radiant", "ratio", "radiant"),
    ("asscher", "Asscher", "depth", "Asher"),
    ("heart", "heart", "depth", "heart"),
    ("trillion", "trillion", "depth", "trillion"),
    ("baguette", "baguette", "ratio", "baguette"),
]
NO_ARTICLE_HOOK = {"emerald", "asscher"}  # "1 carat emerald cut, how big?" (7 words or fewer)

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def words(n):
    n = int(n)
    if n < 20:
        return ONES[n]
    return TENS[n // 10] + (f"-{ONES[n % 10]}" if n % 10 else "")


def spoken_mm(x):
    """8.0 -> "eight", 5.5 -> "five point five", 10.4 -> "ten point four"."""
    whole, frac = f"{x:.1f}".split(".")
    return words(whole) + ("" if frac == "0" else f" point {words(frac)}")


def build(key, hook="A"):
    data = json.loads((ROOT / "gemsize" / "numbers.json").read_text())
    shape = data["shapes"][key]
    n, (_, name, kind, said) = next((i + 1, s) for i, s in enumerate(SHAPES) if s[0] == key)
    d1, d2, d3 = shape["1ct"], shape["2ct"], shape["3ct"]
    fmt = lambda x: f"{x:.1f}"
    round_ = key == "round"
    length, width = fmt(d1["length_mm"]), fmt(d1["width_mm"])
    longer = shape["double_the_carat_longer_by_mm"]
    if hook == "B":
        hook_text, hook_say, gold = f"Twice the carat. Only {fmt(longer)} mm longer.", f"Twice the carat. Only {spoken_mm(longer)} millimeters longer.", [fmt(longer)]
        hook_lines = ["Twice the carat.", f"Only {fmt(longer)} mm longer."]
    elif key in NO_ARTICLE_HOOK:
        hook_text, hook_say, gold = f"1 carat {name}, how big?", f"One carat {said}, how big?", [name.split()[0]]
        hook_lines = ["1 carat", f"{name},", "how big?"]
    else:
        hook_text, hook_say, gold = f"How big is a 1 carat {name}?", f"How big is a one carat {said}?", [name.split()[0]]
        hook_lines = ["How big is a", f"1 carat {name}?"]
    if key == "asscher":
        gold = ["Asscher"]
    answer_say = (
        f"A one carat {said} measures about {spoken_mm(d1['length_mm'])} millimeters across."
        if round_
        else f"A one carat {said} measures about {spoken_mm(d1['length_mm'])} by {spoken_mm(d1['width_mm'])} millimeters."
    )
    why = (
        "The same weight can still look different, because the length to width ratio changes."
        if kind == "ratio"
        else "The same weight can still look different, because a deep cut hides weight under the face."
    )
    lines = [
        {"key": "hook", "text": hook_text, "say": hook_say},
        {"key": "stones", "text": "Next to a 2 carat and a 3 carat, at the same scale.", "say": "Next to a two carat and a three carat, at the same scale."},
        {
            "key": "finger",
            "text": f"On a size 6 finger, a 2 carat {name} covers {d2['finger_share_pct']}% of the width.",
            "say": f"On a size six finger, a two carat {said} covers {words(d2['finger_share_pct'])} percent of the width.",
        },
        {"key": "why", "text": why, "say": why},
        {"key": "answer", "text": f"A 1 carat {name} measures about {length} {'mm across' if round_ else f'by {width} millimeters'}.", "say": answer_say},
    ]
    sid = f"gs-{n:02d}-{key}"
    url = f"{SITE}/{key}-diamond-size-chart?utm_source=youtube&utm_medium=shorts&utm_campaign=gem_size_shorts"
    tag = re.sub(r"[^a-z]", "", name.lower())
    short = {
        "id": sid,
        "number": n,
        "series": "gemsize",
        "shape": key,
        "label": name,
        "kind": kind,
        "hookVariant": hook,
        "hook": {"text": hook_text, "lines": hook_lines, "gold": gold},
        "dims": {"1ct": d1, "2ct": d2, "3ct": d3},
        "fingerMm": data["finger_size_6_mm"],
        "answer": {"length": length, "width": width, "same": round_},
        "lines": lines,
        "music": f"music-gemsize-{n:02d}.wav",
        "post": {
            "youtube_title": f"How big is a 1 carat {name}?" if key != "asscher" else "How big is a 1 carat Asscher cut?",
            "caption": (
                f"A 1 carat {name} measures about {length} {'millimeters across' if round_ else f'by {width} millimeters'}. "
                f"A 2 carat {name} covers {d2['finger_share_pct']}% of the width of a size 6 finger.\n\n"
                f"{name[0].upper() + name[1:]} diamond size chart: {url}\n\nEstimates for a well-cut stone."
            ),
            "hashtags": ["#shorts", "#diamondsize", "#1caratdiamond", f"#{tag}diamond", "#engagementring"],
        },
    }
    return short


def read_aloud(short, out_dir, model_dir):
    import numpy as np
    import pyloudnorm
    import soundfile as sf
    from kokoro_onnx import Kokoro

    k = Kokoro(f"{model_dir}/kokoro-v1.0.onnx", f"{model_dir}/voices-v1.0.bin")
    out_dir.mkdir(parents=True, exist_ok=True)
    for speed in (SPEED, 1.05, 1.1):
        total = 0.0
        for i, line in enumerate(short["lines"]):
            wav, sr = k.create(line["say"], voice=VOICE, speed=speed, lang="en-us")
            loud = np.where(np.abs(wav) > 0.01)[0]
            wav = wav[max(loud[0] - int(0.03 * sr), 0) : loud[-1] + int(0.12 * sr)]
            meter = pyloudnorm.Meter(sr, block_size=min(0.4, len(wav) / sr * 0.9))
            wav = pyloudnorm.normalize.loudness(wav, meter.integrated_loudness(wav), -18.0)
            peak = np.abs(wav).max()
            wav = wav * (0.84 / peak) if peak > 0.84 else wav
            path = out_dir / f"{i + 1:02d}.wav"
            sf.write(path, wav.astype(np.float32), sr)
            line["audio"] = str(path.relative_to(ROOT / "public"))
            line["seconds"] = round(len(wav) / sr, 3)
            total += len(wav) / sr + PAD_S
        total += 1.5 - PAD_S  # the hold on the answer
        print(f"voice speed {speed}: {total:.1f} s")
        if total <= 23.4:
            break
    short["voice"] = f"kokoro {VOICE} {speed}"
    short["seconds"] = round(total, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("shape", choices=[s[0] for s in SHAPES])
    ap.add_argument("--out", required=True)
    ap.add_argument("--hook", default="A", choices=["A", "B"])
    ap.add_argument("--no-voice", action="store_true")
    args = ap.parse_args()
    short = build(args.shape, args.hook)
    if not args.no_voice:
        read_aloud(short, ROOT / "public" / "voice" / short["id"] / VOICE, os.environ.get("KOKORO_MODEL", "/tmp/kokoro-model"))
    for line in short["lines"]:
        text = line["text"] + " " + line["say"]
        if re.search(r"[—–!]|\bAI\b|sizer", text):
            sys.exit(f"{short['id']}: a dash, an exclamation mark, AI or the gem sizer is in the words: {text!r}")
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(short, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
