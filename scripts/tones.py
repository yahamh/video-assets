# The sounds that have a pitch, made in the key and chords of one story's music (ali, 3 Nov 2026), so they can't clash:
#  - the caption notes (one soft note as each group of caption words comes up), played on the style's own instrument,
#    only notes of the chord that is playing,
#  - a bell on the chord's note, for the hits that used to be one fixed bell,
#  - a shimmer of little bells on the notes of the key.
# Usage: python3 scripts/tones.py stories/026-x.json public/tones   -> writes public/tones/<id>/*.wav and prints a plan
# (JSON) the video reads; prints "null" when the story has the old music (the dark and low-poly stories), which keeps
# the old sounds.
import json
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve

sys.path.insert(0, os.path.dirname(__file__))
import musiclib as M

SR = M.SR


def save(path, x, peak=0.6):
    if x.ndim == 1:
        x = np.stack([x, np.roll(x, 30)], 1)
    x = x.copy()
    fade = int(0.02 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


def verb(x, rng, sec=1.6, decay=3.0, wet=0.3):
    t = M.T(sec)
    ir = M.lp(rng.normal(size=len(t)) * np.exp(-t * decay), 6000)
    y = fftconvolve(x, ir)[: len(x) + len(t)]
    y = y / (np.max(np.abs(y)) + 1e-9)
    d = np.concatenate([x / (np.max(np.abs(x)) + 1e-9), np.zeros(len(y) - len(x))])
    return (1 - wet) * d + wet * y


def main(story_path, out_root):
    story = json.load(open(story_path))
    lesson = story.get("series") == "lesson"
    if not story.get("music") or not (lesson or story["number"] >= 14):
        print("null")
        return
    seed = story["number"] + (500 if lesson else 0)
    plan = M.make_plan(seed, True)
    rng = np.random.default_rng(seed * 31 + 5)
    sid = story["id"]
    out = os.path.join(out_root, sid)
    os.makedirs(out, exist_ok=True)

    # caption notes: the chord's notes in the singing range, for each chord of the progression
    prog = []
    for c in plan["chords"]:
        pcs = sorted({n % 12 for n in c["notes"]})
        prog.append([m for m in range(62, 90) if m % 12 in pcs])
    fn = M.INSTRUMENTS[plan["cap"]]
    for m in sorted({m for notes in prog for m in notes}):
        try:
            x = fn(M.hz(m), 1.0, rng)
        except TypeError:
            x = fn(M.hz(m))
        save(os.path.join(out, f"n{m}.wav"), verb(x, rng, 0.9, 5.0, 0.2))

    # a bell on each chord's root: root, fifth and octaves
    roots = sorted({c["root_pc"] for c in plan["chords"]})
    for pc in roots:
        r = 72 + ((pc - 72) % 12)
        t = M.T(3.0)
        x = np.zeros(len(t))
        for m, amp in ((r + 12, 1.0), (r + 19, 0.5), (r, 0.55), (r + 24, 0.25)):
            f = M.hz(m)
            for ratio, pa, dec in ((1, 1, 1.4), (2.0, 0.35, 2.5), (2.76, 0.25, 4), (5.4, 0.08, 7)):
                if f * ratio < 15000:
                    x += amp * pa * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
        x *= np.minimum(1, t / 0.003)
        save(os.path.join(out, f"bell-{pc}.wav"), verb(x, rng, 2.0, 2.2, 0.35))

    # a shimmer of little bells, only on the notes of the key's pentatonic scale
    pent = [0, 2, 4, 7, 9] if plan["mode"] in ("major", "lydian", "mixolydian") else [0, 3, 5, 7, 10]
    pool = [m for m in range(96, 113) if (m - plan["key_pc"]) % 12 in pent]
    d = 2.4
    x = np.zeros(int(d * SR))
    for _ in range(14):
        at = rng.uniform(0, 0.7)
        f = M.hz(int(rng.choice(pool)))
        tt = M.T(1.2)
        tone = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 8)) * np.exp(-tt * 5) * np.minimum(1, tt / 0.003)
        s = int(at * SR)
        x[s: s + len(tone)] += tone[: len(x) - s] * rng.uniform(0.4, 1.0)
    save(os.path.join(out, "shimmer.wav"), verb(M.hp(x, 1200), rng, 1.5, 3.0, 0.45), 0.6)

    print(json.dumps({
        "dir": f"tones/{sid}", "style": plan["style"], "cap": plan["cap"], "bar": plan["bar"], "beats": plan["beats"],
        "bpm": plan["bpm"], "key": plan["key_pc"], "mode": plan["mode"], "prog": prog, "roots": [c["root_pc"] for c in plan["chords"]],
    }))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
