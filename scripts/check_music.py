# Checks the music engine (scripts/musiclib.py) without listening: for every style and many seeds,
#  1. every note of every chord is a note of the key's scale,
#  2. every melody note is a note of the scale, and the notes on strong beats are notes of the chord under them,
#  3. the styles and keys change from one video to the next (no two videos in a row share a style or a key),
#  4. in the sound itself (drums left out) at least 90% of the pitched energy sits on notes of the scale.
# Usage: python3 scripts/check_music.py [seeds]   (default 60; the sound check renders each style once)
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import musiclib as M

seeds = int(sys.argv[1]) if len(sys.argv) > 1 else 60
bad = 0


def fail(msg):
    global bad
    bad += 1
    print("FAIL", msg)


for seed in list(range(1, seeds + 1)) + list(range(501, 501 + seeds // 3)):
    for style in (M.LESSON_STYLES if seed >= 500 else M.STORY_STYLES):
        plan = M.make_plan(seed, True, style=style)
        st = M.STYLES[style]
        scale = {(plan["key_pc"] + s) % 12 for s in M.MODES[plan["mode"]]}
        for c in plan["chords"]:
            if any(n % 12 not in scale for n in c["notes"]):
                fail(f"{style} seed {seed}: chord {c} leaves the scale")
        rng = np.random.default_rng(seed)
        for ly in st["layers"]:
            if ly["t"] != "mel":
                continue
            strong = (0, 2) if plan["beats"] == 4 else (0,)
            for b, beat, ln, m in M.melody_phrase(plan, ly["rh"], ly["lo"], ly["hi"], rng):
                if m % 12 not in scale:
                    fail(f"{style} seed {seed}: melody note {m} is not in the scale")
                chord = {n % 12 for n in plan["chords"][b % 4]["notes"]}
                if beat in strong and m % 12 not in chord:
                    fail(f"{style} seed {seed}: strong-beat note {m} is not in the chord")
                if not ly["lo"] <= m <= ly["hi"]:
                    fail(f"{style} seed {seed}: note {m} out of range")

prev = None
for n in range(1, 41):
    p = M.make_plan(n, True)
    if prev and (p["style"] == prev["style"] or p["key_pc"] == prev["key_pc"]):
        fail(f"stories {n - 1} and {n} share a style or a key")
    prev = p
prev = None
for n in range(1, 21):
    p = M.make_plan(500 + n, True)
    if prev and (p["style"] == prev["style"] or p["key_pc"] == prev["key_pc"]):
        fail(f"lessons {n - 1} and {n} share a style or a key")
    prev = p

for style in M.STORY_STYLES:
    plan = M.make_plan(40, True, style=style)
    x = M.render(plan, 20, skip=("drum", "chimes"))[:, 0]
    seg = x[2 * M.SR:]
    spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2
    fr = np.fft.rfftfreq(len(seg), 1 / M.SR)
    sel = (fr > 80) & (fr < 2200)
    pc = np.round(12 * np.log2(fr[sel] / 440) + 69).astype(int) % 12
    # energy within 40 cents of a note, by pitch class
    cents = 12 * np.log2(fr[sel] / 440) % 1
    near = np.minimum(cents, 1 - cents) < 0.4
    e = np.zeros(12)
    np.add.at(e, pc[near], spec[sel][near])
    scale = {(plan["key_pc"] + s) % 12 for s in M.MODES[plan["mode"]]}
    share = sum(e[k] for k in scale) / e.sum()
    print(f"{style:14s} key {plan['key_pc']:2d} {plan['mode']:10s} {plan['bpm']:5.1f} bpm  {share * 100:5.1f}% of the pitched sound is in the scale")
    if share < 0.90:
        fail(f"{style}: only {share * 100:.1f}% of the pitched sound is in the scale")
print("music engine: all good" if not bad else f"{bad} problems")
sys.exit(1 if bad else 0)
