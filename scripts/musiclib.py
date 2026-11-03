# Original music for the stories and the render lessons (ali, 3 Nov 2026: "the music is not harmonious, use a wider
# range of sounds, don't always use the same sound").
#
# Everything is built from a key and a chord progression, so nothing can clash: every chord is stacked from the notes of
# the scale, every melody note is a note of the scale, and the notes that land on a strong beat are notes of the chord
# under them. Ten styles (music box, guitar, lo-fi keys, bossa, strings and piano, synth, ukulele, harp, pizzicato, marimba
# pop) each have their own instruments, tempo, rhythm and drums, and the style, the key and the chords change from one
# video to the next. The same plan also tells the caption sounds which notes belong (scripts/tones.py).
#
# Usage (the Make videos workflow): python3 scripts/music.py OUT.wav SECONDS SEED [bright]
import json
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
PI2 = 2 * np.pi


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def T(sec):
    return np.arange(int(sec * SR)) / SR


def _f(x, kind, f):
    f = [min(v, SR / 2 - 200) for v in (f if isinstance(f, (list, tuple)) else [f])]
    return sosfilt(butter(2, f if len(f) > 1 else f[0], btype=kind, fs=SR, output="sos"), x)


def lp(x, f):
    return _f(x, "low", f)


def hp(x, f):
    return _f(x, "high", f)


def bp(x, lo, hi):
    return _f(x, "band", [lo, hi])


# --------------------------------------------------------------------------------------------------------- scales

MODES = {
    "major": [0, 2, 4, 5, 7, 9, 11],
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "mixolydian": [0, 2, 4, 5, 7, 9, 10],
    "lydian": [0, 2, 4, 6, 7, 9, 11],
}

# Four bars of chords, as degrees of the scale (0 is the first note of the key, 4 the fifth, and so on).
PROGS = {
    "major": [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 5, 4], [0, 2, 3, 4], [3, 0, 4, 5], [0, 4, 3, 0], [0, 5, 1, 4]],
    "minor": [[0, 5, 2, 6], [0, 3, 6, 2], [0, 6, 5, 6], [0, 4, 5, 3], [0, 3, 4, 0], [5, 6, 0, 0], [0, 2, 6, 3]],
    "mixolydian": [[0, 6, 3, 0], [0, 3, 6, 3], [0, 4, 3, 0]],
    "dorian": [[0, 3, 0, 3], [0, 6, 3, 0], [0, 1, 3, 0]],
    "lydian": [[0, 1, 0, 1], [0, 1, 4, 0], [0, 4, 1, 0]],
}
JAZZ = [[0, 5, 1, 4], [1, 4, 0, 5], [0, 2, 1, 4]]  # I vi ii V, ii V I vi, I iii ii V


def degree_midi(root, mode, deg):
    """The note `deg` steps up the scale from `root` (deg may be above 6: the next octave)."""
    sc = MODES[mode]
    return root + sc[deg % 7] + 12 * (deg // 7)


def chord_notes(root, mode, deg, ext):
    """A chord stacked in thirds from scale degree `deg`: triad, seventh or ninth, root first."""
    steps = {"triad": (0, 2, 4), "seventh": (0, 2, 4, 6), "ninth": (0, 2, 4, 6, 8)}[ext]
    return [degree_midi(root, mode, deg + s) for s in steps]


def voice(notes, prev, lo=52, hi=70):
    """The inversion of a chord (in octaves lo..hi) that moves least from the last one, so chords glide."""
    pcs = sorted({n % 12 for n in notes})
    cands = []
    for base in range(lo - 12, hi):
        for inv in range(len(pcs)):
            vs = []
            cur = base
            for k in range(len(pcs)):
                pc = pcs[(inv + k) % len(pcs)]
                n = cur + ((pc - cur) % 12)
                vs.append(n)
                cur = n + 1
            if min(vs) >= lo and max(vs) <= hi:
                cands.append(vs)
    if not cands:
        return list(notes)
    if prev is None:
        return min(cands, key=lambda v: abs(np.mean(v) - 60))
    return min(cands, key=lambda v: sum(abs(a - b) for a, b in zip(sorted(v), sorted(prev))) + abs(len(v) - len(prev)) * 6)


# ------------------------------------------------------------------------------------------------------ instruments
# Each takes a frequency and gives back a mono note (peak about 1).


def partials(f, dur, parts, atk=0.002, trem=None):
    t = T(dur)
    x = np.zeros(len(t))
    for ratio, amp, dec in parts:
        if f * ratio > 15000:
            continue
        x += amp * np.sin(PI2 * f * ratio * t) * np.exp(-t * dec)
    x *= np.minimum(1, t / atk)
    if trem:
        x *= 1 + trem[1] * np.sin(PI2 * trem[0] * t)
    return x


def _noise(rng, dur):
    return rng.normal(size=int(dur * SR))


def inst_guitar(f, dur=1.8, rng=None):
    parts = [(n, a, 2.0 + 1.1 * n) for n, a in enumerate([1, .62, .42, .3, .2, .14, .1, .07], 1)]
    x = partials(f, dur, parts, 0.002)
    if rng is not None:
        c = hp(_noise(rng, 0.012), 2500) * np.exp(-T(0.012) * 300) * 0.5
        x[: len(c)] += c
    return lp(x, 5200)


def inst_nylon(f, dur=1.8, rng=None):
    parts = [(n, a, 2.4 + 1.5 * n) for n, a in enumerate([1, .5, .22, .1, .05], 1)]
    return lp(partials(f, dur, parts, 0.003), 3800)


def inst_uke(f, dur=0.9, rng=None):
    parts = [(n, a, 4.2 + 2.0 * n) for n, a in enumerate([1, .55, .3, .16, .08], 1)]
    return lp(partials(f, dur, parts, 0.002), 4500)


def inst_harp(f, dur=2.4, rng=None):
    parts = [(n, a, 1.2 + 0.7 * n) for n, a in enumerate([1, .55, .3, .2, .12, .08], 1)]
    return lp(partials(f, dur, parts, 0.003), 6000)


def inst_pizz(f, dur=0.5, rng=None):
    parts = [(n, a, 9 + 4 * n) for n, a in enumerate([1, .5, .3, .15], 1)]
    return partials(f, dur, parts, 0.001)


def inst_upright(f, dur=1.2, rng=None):
    parts = [(n, a, 3.0 + 1.8 * n) for n, a in enumerate([1, .6, .3, .15], 1)]
    x = partials(f, dur, parts, 0.005)
    if rng is not None:
        k = lp(_noise(rng, 0.03), 400) * np.exp(-T(0.03) * 120) * 0.6
        x[: len(k)] += k
    return x


def inst_sub(f, dur=1.0, rng=None):
    t = T(dur)
    x = np.sin(PI2 * f * t) + 0.3 * np.sin(PI2 * 2 * f * t)
    return x * np.minimum(1, t / 0.012) * np.minimum(1, np.maximum(0, (dur - t)) / 0.06)


def inst_bassynth(f, dur=0.4, rng=None):
    t = T(dur)
    x = sum(np.sin(PI2 * f * k * t) / k for k in range(1, 6))
    return lp(x, 520) * np.exp(-t * 6) * np.minimum(1, t / 0.004)


def inst_marimba(f, dur=1.2, rng=None):
    return partials(f, dur, [(1, 1, 7), (4, 0.25, 25)], 0.0012)


def inst_xylo(f, dur=0.6, rng=None):
    return partials(f, dur, [(1, 1, 12), (3, 0.3, 30), (6, 0.1, 50)], 0.001)


def inst_vibes(f, dur=2.0, rng=None):
    return partials(f, dur, [(1, 1, 2.4), (4, 0.18, 6)], 0.002, trem=(5.2, 0.15))


def inst_glock(f, dur=1.6, rng=None):
    return partials(f, dur, [(1, 1, 3.5), (2.76, 0.3, 9)], 0.0005)


def inst_celesta(f, dur=2.0, rng=None):
    return partials(f, dur, [(1, 1, 3.0), (2, 0.35, 5), (4.1, 0.12, 12)], 0.001)


def inst_musicbox(f, dur=1.6, rng=None):
    return partials(f, dur, [(1, 1, 2.8), (3, 0.2, 6), (5.2, 0.08, 10)], 0.0008)


def inst_kalimba(f, dur=1.4, rng=None):
    return partials(f, dur, [(1, 1, 5), (5.4, 0.12, 18), (8.9, 0.05, 26)], 0.001)


def inst_glass(f, dur=1.5, rng=None):
    return partials(f, dur, [(1, 1, 3.2), (2.4, 0.25, 7), (5.95, 0.08, 14)], 0.001)


def inst_rhodes(f, dur=2.2, rng=None):
    t = T(dur)
    index = 1.8 * np.exp(-t * 3.2) + 0.25
    x = np.sin(PI2 * f * t + index * np.sin(PI2 * f * t)) * np.exp(-t * 1.7)
    x += 0.06 * np.sin(PI2 * f * 14 * t) * np.exp(-t * 16)
    x *= 1 + 0.12 * np.sin(PI2 * 4.6 * t)
    return x * np.minimum(1, t / 0.004)


def inst_piano(f, dur=2.6, rng=None):
    t = T(dur)
    x = np.zeros(len(t))
    for n in range(1, 8):
        fn = f * n * np.sqrt(1 + 0.0004 * n * n)
        if fn > 12000:
            break
        a = 1 / n ** 0.95
        d = 1.1 + 0.8 * n
        x += a * (np.sin(PI2 * fn * t) + 0.6 * np.sin(PI2 * fn * 1.0007 * t)) * np.exp(-t * d)
    x *= np.minimum(1, t / 0.003)
    if rng is not None:
        h = lp(_noise(rng, 0.02), 1200) * np.exp(-T(0.02) * 160) * 0.5
        x[: len(h)] += h
    return x


def inst_flute(f, dur=1.0, rng=None):
    t = T(dur)
    vib = 1 + 0.004 * np.sin(PI2 * 5.3 * t) * np.minimum(1, t / 0.25)
    ph = PI2 * np.cumsum(f * vib) / SR
    x = np.sin(ph) + 0.12 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)
    if rng is not None:
        x += 0.05 * bp(_noise(rng, dur), f, min(f * 4, 12000))
    return x * np.minimum(1, t / 0.07) * np.minimum(1, np.maximum(0, dur - t) / 0.12)


def inst_whistle(f, dur=0.9, rng=None):
    t = T(dur)
    vib = 1 + 0.006 * np.sin(PI2 * 5.8 * t) * np.minimum(1, t / 0.2)
    ph = PI2 * np.cumsum(f * vib) / SR
    x = np.sin(ph) + 0.04 * np.sin(2 * ph)
    if rng is not None:
        x += 0.025 * hp(_noise(rng, dur), 3000)
    return x * np.minimum(1, t / 0.05) * np.minimum(1, np.maximum(0, dur - t) / 0.1)


def inst_lead(f, dur=0.8, rng=None):
    t = T(dur)
    vib = 1 + 0.003 * np.sin(PI2 * 5.5 * t) * np.minimum(1, t / 0.3)
    ph = PI2 * np.cumsum(f * vib) / SR
    x = np.sin(ph) + 0.35 * np.sin(2 * ph) * np.exp(-t * 2) + 0.15 * np.sin(3 * ph)
    return x * np.minimum(1, t / 0.01) * np.minimum(1, np.maximum(0, dur - t) / 0.1)


def inst_synth(f, dur=0.35, rng=None):
    parts = [(k, 1 / k, 4 + 2.2 * k) for k in range(1, 11)]
    x = partials(f, dur, parts, 0.002) + partials(f * 1.004, dur, parts, 0.002)
    return lp(x, 3800) * 0.6


def inst_timpani(f, dur=1.4, rng=None):
    t = T(dur)
    fr = f * (1 + 0.6 * np.exp(-t * 25))
    return np.sin(PI2 * np.cumsum(fr) / SR) * np.exp(-t * 4.5) * np.minimum(1, t / 0.004)


INSTRUMENTS = {
    "guitar": inst_guitar, "nylon": inst_nylon, "uke": inst_uke, "harp": inst_harp, "pizz": inst_pizz,
    "upright": inst_upright, "sub": inst_sub, "bassynth": inst_bassynth, "marimba": inst_marimba, "xylo": inst_xylo,
    "vibes": inst_vibes, "glock": inst_glock, "celesta": inst_celesta, "musicbox": inst_musicbox,
    "kalimba": inst_kalimba, "glass": inst_glass, "rhodes": inst_rhodes, "piano": inst_piano, "flute": inst_flute,
    "whistle": inst_whistle, "lead": inst_lead, "synth": inst_synth, "timpani": inst_timpani,
}


def pad_chord(notes, dur, kind, rng=None):
    """A slow, soft chord: strings (detuned saws), warm (sines) or glass (sines with a bell on top)."""
    t = T(dur)
    x = np.zeros(len(t))
    for m in notes:
        f = hz(m)
        if kind == "strings":
            for det in (-0.005, 0.005):
                x += sum(np.sin(PI2 * f * (1 + det) * k * t) / k for k in range(1, 9) if f * k < 3000)
        elif kind == "glass":
            x += np.sin(PI2 * f * t) + 0.3 * np.sin(PI2 * f * 2 * t) + 0.08 * np.sin(PI2 * f * 3.01 * t)
        else:
            x += np.sin(PI2 * f * t) + 0.3 * np.sin(PI2 * f * 1.003 * t) + 0.1 * np.sin(PI2 * f * 2 * t)
    x = lp(x, {"strings": 1700, "glass": 2600, "warm": 1300}[kind])
    return x * np.minimum(1, t / 0.5) * np.minimum(1, np.maximum(0, dur - t) / 0.5) / max(1, len(notes))


# --------------------------------------------------------------------------------------------------------- drums


def d_kick(rng, f0=50, amp=1.0):
    t = T(0.4)
    f = 100 * np.exp(-t * 25) + f0
    return amp * np.sin(PI2 * np.cumsum(f) / SR) * np.exp(-t * 9)


def d_snare(rng, amp=1.0):
    t = T(0.3)
    n = bp(_noise(rng, 0.3), 1200, 8000) * np.exp(-t * 20)
    return amp * (0.7 * n + 0.5 * np.sin(PI2 * 190 * t) * np.exp(-t * 28))


def d_rim(rng, amp=1.0):
    t = T(0.12)
    return amp * (bp(_noise(rng, 0.12), 1500, 6000) * np.exp(-t * 60) + 0.6 * np.sin(PI2 * 480 * t) * np.exp(-t * 55))


def d_hat(rng, amp=1.0, open_=False):
    dur = 0.25 if open_ else 0.06
    return amp * hp(_noise(rng, dur), 7000) * np.exp(-T(dur) * (22 if open_ else 80))


def d_shaker(rng, amp=1.0):
    t = T(0.07)
    return amp * hp(_noise(rng, 0.07), 6500) * np.exp(-t * 70) * np.minimum(1, t / 0.012)


def d_tamb(rng, amp=1.0):
    t = T(0.25)
    x = bp(_noise(rng, 0.25), 5000, 11000) * np.exp(-t * 22)
    x += 0.5 * bp(_noise(rng, 0.25), 3000, 6000) * np.exp(-t * 40)
    return amp * x


def d_clap(rng, amp=1.0):
    x = np.zeros(int(0.3 * SR))
    for off in (0, 0.011, 0.022):
        n = bp(_noise(rng, 0.2), 900, 3200) * np.exp(-T(0.2) * 60)
        s = int(off * SR)
        x[s: s + len(n)] += n[: len(x) - s]
    x += 0.5 * bp(_noise(rng, 0.3), 900, 3200) * np.exp(-T(0.3) * 14)
    return amp * x


def d_wood(rng, amp=1.0, f=900):
    t = T(0.12)
    return amp * (np.sin(PI2 * f * t) * np.exp(-t * 55) + 0.3 * np.sin(PI2 * f * 2.3 * t) * np.exp(-t * 90))


def d_sweep(rng, amp=1.0):
    """A brush stroke: soft noise that swells and fades."""
    t = T(0.4)
    return amp * bp(_noise(rng, 0.4), 2000, 9000) * np.sin(np.pi * t / 0.4) ** 2 * 0.5


# ------------------------------------------------------------------------------------------------------- the styles
# Beat positions are in beats from the start of the bar. A note pattern is (beat, chord note number, octaves up):
# note number 0 is the lowest note of the chord, 1 the next, and a number past the top wraps into the next octave.

STORY_STYLES = [
    "marimba_pop", "music_box", "folk_guitar", "lofi_keys", "bossa", "strings_piano", "synth_arp", "ukulele", "harp_dream", "pizzicato",
]
LESSON_STYLES = ["lofi_keys", "bossa", "strings_piano", "harp_dream", "synth_arp"]

EIGHTHS = [(k * 0.5, 0) for k in range(8)]

STYLES = {
    "marimba_pop": dict(
        beats=4, bpm=(100, 114), modes=["major", "mixolydian"], ext="triad", rev=(1.6, 0.25), cap="marimba",
        layers=[
            dict(t="pad", kind="strings", gain=0.05),
            dict(t="bass", inst="sub", pat=[(0, "r", 3.6)], gain=0.15),
            dict(t="arp", inst="marimba", pat=[(0, 0, 0), (.5, 1, 0), (1, 2, 0), (1.5, 1, 1), (2, 2, 0), (2.5, 1, 0), (3, 0, 1), (3.5, 2, 0)], gain=0.16, pan=-0.2),
            dict(t="mel", inst="glock", rh=[[(0, 1), (1, 1), (2, 1), (3, 1)], [(0, 1.5), (1.5, .5), (2, 1), (3, 1)], [(0, 1), (1, .5), (1.5, .5), (2, 2)]], lo=79, hi=96, gain=0.09, start=2, pan=0.25),
            dict(t="drum", kick=[0, 2], shaker=[k * .5 for k in range(8)], start=1, gain=1.0),
        ]),
    "music_box": dict(
        beats=3, bpm=(86, 98), modes=["major", "lydian"], ext="triad", rev=(2.4, 0.4), cap="musicbox",
        layers=[
            dict(t="pad", kind="glass", gain=0.05),
            dict(t="bass", inst="nylon", pat=[(0, "r", 2.5)], gain=0.12),
            dict(t="arp", inst="celesta", pat=[(0, 0, 1), (1, 1, 1), (2, 2, 1), (1.5, 1, 2)], gain=0.12, pan=-0.2),
            dict(t="mel", inst="musicbox", rh=[[(0, 2), (2, 1)], [(0, 1), (1, 1), (2, 1)], [(0, 1.5), (1.5, .5), (2, 1)], [(0, 3)]], lo=76, hi=93, gain=0.11, start=2, pan=0.25),
            dict(t="chimes", inst="glock", lo=88, hi=100, per_bar=0.5, gain=0.04),
        ]),
    "folk_guitar": dict(
        beats=4, bpm=(92, 106), modes=["major", "mixolydian"], ext="triad", rev=(1.2, 0.15), cap="kalimba",
        layers=[
            dict(t="arp", inst="nylon", pat=[(0, 0, 0), (1, 2, 0), (1.5, 1, 1), (2, 0, 1), (3, 2, 0), (3.5, 1, 1)], gain=0.18, pan=-0.25),
            dict(t="bass", inst="upright", pat=[(0, "r", 1.8), (2, "5", 1.8)], gain=0.16),
            dict(t="mel", inst="whistle", rh=[[(0, 1.5), (1.5, .5), (2, 2)], [(0, 1), (1, 1), (2, 2)], [(0, 2), (2, 1), (3, 1)]], lo=72, hi=86, gain=0.1, start=2, pan=0.2),
            dict(t="drum", tamb=[1, 3], shaker=[k * .5 for k in range(8)], start=1, gain=0.8),
        ]),
    "lofi_keys": dict(
        beats=4, bpm=(72, 84), modes=["minor", "dorian", "major"], ext="seventh", swing=0.16, rev=(1.4, 0.2), cap="rhodes",
        layers=[
            dict(t="stab", inst="rhodes", beats=[0, 2.5], dur=2.0, gain=0.13, pan=-0.15),
            dict(t="bass", inst="sub", pat=[(0, "r", 1.7), (2.5, "5", 1.3)], gain=0.15),
            dict(t="mel", inst="vibes", rh=[[(0, 1.5), (2, 1), (3.5, .5)], [(0.5, 1), (2, 2)], [(0, 1), (1.5, 1.5), (3, 1)]], lo=72, hi=88, gain=0.09, start=2, pan=0.25),
            dict(t="drum", kick=[0, 2.5], rim=[1, 3], hat=[k * .5 for k in range(8)], crackle=True, start=1, gain=0.85),
        ]),
    "bossa": dict(
        beats=4, bpm=(108, 120), modes=["major"], ext="seventh", jazz=True, rev=(1.3, 0.18), cap="vibes",
        layers=[
            dict(t="stab", inst="nylon", beats=[0, 1.5, 2, 3.5], dur=1.0, gain=0.15, pan=-0.2, strum=0.018),
            dict(t="bass", inst="upright", pat=[(0, "r", 1.2), (1.5, "5", .9), (3, "r", .9)], gain=0.17),
            dict(t="mel", inst="vibes", rh=[[(0, 1.5), (1.5, 1.5), (3, 1)], [(0.5, 1), (2, 1.5), (3.5, .5)], [(0, 1), (1, 1), (2, 2)]], lo=74, hi=90, gain=0.1, start=2, pan=0.25),
            dict(t="drum", rim=[0, 1.5, 3], shaker=[k * .5 for k in range(8)], start=0, gain=0.9),
        ]),
    "strings_piano": dict(
        beats=4, bpm=(66, 78), modes=["minor", "major"], ext="triad", rev=(2.4, 0.35), cap="piano",
        layers=[
            dict(t="pad", kind="strings", gain=0.09),
            dict(t="bass", inst="sub", pat=[(0, "r", 3.8)], gain=0.13),
            dict(t="arp", inst="piano", pat=[(0, 0, 0), (.5, 1, 0), (1, 2, 0), (1.5, 1, 0), (2, 0, 1), (2.5, 2, 0), (3, 1, 0), (3.5, 0, 1)], gain=0.1, pan=-0.15),
            dict(t="mel", inst="piano", rh=[[(0, 2), (2, 1), (3, 1)], [(0, 1), (1, 1), (2, 2)], [(0, 3), (3, 1)]], lo=72, hi=89, gain=0.14, start=2, pan=0.2),
            dict(t="drum", boom=[0], start=4, gain=1.0),
        ]),
    "synth_arp": dict(
        beats=4, bpm=(108, 120), modes=["minor", "major", "dorian"], ext="triad", rev=(1.2, 0.2), cap="glass",
        layers=[
            dict(t="pad", kind="strings", gain=0.04),
            dict(t="arp", inst="synth", pat=[(k * .25, [0, 1, 2, 1][k % 4], 1 if k % 8 >= 4 else 0) for k in range(16)], gain=0.085, pan=-0.2),
            dict(t="bass", inst="bassynth", pat=[(k * .5, "r", .4) for k in range(8)], gain=0.13),
            dict(t="mel", inst="lead", rh=[[(0, 1.5), (1.5, 1.5), (3, 1)], [(0, 2), (2, 1), (3, 1)], [(0, 1), (1, 1), (2, 2)]], lo=76, hi=90, gain=0.08, start=4, pan=0.25),
            dict(t="drum", kick=[0, 1, 2, 3], clap=[1, 3], hat=[.5, 1.5, 2.5, 3.5], start=1, gain=0.9),
        ]),
    "ukulele": dict(
        beats=4, bpm=(100, 114), modes=["major"], ext="triad", rev=(1.0, 0.12), cap="uke",
        layers=[
            dict(t="stab", inst="uke", beats=[0, 1, 1.5, 2.5, 3, 3.5], dur=0.6, gain=0.14, pan=-0.2, strum=0.014),
            dict(t="bass", inst="upright", pat=[(0, "r", .8), (1, "5", .8), (2, "r", .8), (3, "5", .8)], gain=0.15),
            dict(t="mel", inst="whistle", rh=[[(0, 1.5), (1.5, .5), (2, 2)], [(0, 1), (1, 1), (2, 1), (3, 1)], [(0, 2), (2, 1.5), (3.5, .5)]], lo=72, hi=88, gain=0.1, start=2, pan=0.25),
            dict(t="drum", clap=[1, 3], shaker=[k * .5 for k in range(8)], start=1, gain=0.8),
            dict(t="chimes", inst="glock", lo=88, hi=100, per_bar=0.5, gain=0.04),
        ]),
    "harp_dream": dict(
        beats=4, bpm=(66, 80), modes=["major", "lydian"], ext="triad", rev=(2.8, 0.45), cap="harp",
        layers=[
            dict(t="pad", kind="strings", gain=0.07),
            dict(t="arp", inst="harp", pat=[(0, 0, 0), (.5, 1, 0), (1, 2, 0), (1.5, 0, 1), (2, 1, 1), (2.5, 2, 1), (3, 1, 1), (3.5, 0, 1)], gain=0.14, pan=-0.2),
            dict(t="mel", inst="flute", rh=[[(0, 3), (3, 1)], [(0, 2), (2, 2)], [(0, 1.5), (1.5, 1.5), (3, 1)]], lo=72, hi=86, gain=0.1, start=2, pan=0.2),
            dict(t="chimes", inst="glock", lo=88, hi=102, per_bar=1.0, gain=0.05),
        ]),
    "pizzicato": dict(
        beats=4, bpm=(112, 124), modes=["major"], ext="triad", rev=(0.9, 0.1), cap="xylo",
        layers=[
            dict(t="arp", inst="pizz", pat=[(0, 0, 0), (.5, 2, 0), (1, 1, 0), (1.5, 2, 0), (2, 0, 0), (2.5, 2, 0), (3, 1, 0), (3.5, 2, 0)], gain=0.16, pan=-0.2),
            dict(t="bass", inst="pizz", pat=[(0, "r", .5), (2, "5", .5)], gain=0.2),
            dict(t="mel", inst="xylo", rh=[[(0, .5), (.5, .5), (1, 1), (2, 2)], [(0, 1), (1, .5), (1.5, .5), (2, 1), (3, 1)], [(0.5, .5), (1, 1), (2, 1), (3, 1)]], lo=79, hi=95, gain=0.1, start=2, pan=0.25),
            dict(t="drum", wood=[1, 3], shaker=[k * .5 for k in range(8)], start=1, gain=0.8),
        ]),
}


# ------------------------------------------------------------------------------------------------------------ plan


def seed_parts(seed):
    """(story number, is a lesson) from the seed the workflow gives: a story's number, a lesson's number plus 500."""
    return (seed - 500, True) if seed >= 500 else (seed, False)


def make_plan(seed, bright=True, style=None):
    """Everything about the music that other tools need to know: its style, key, tempo and chords.
    Deterministic from the seed (a story's number, plus 500 for a lesson)."""
    number, lesson = seed_parts(seed)
    rng = np.random.default_rng(seed * 7919 + 13)
    styles = LESSON_STYLES if lesson else STORY_STYLES
    name = style or (styles[(number * 2 + 1) % len(styles)] if lesson else styles[(number * 3) % len(styles)])
    st = STYLES[name]
    pc = (number * 7 + (3 if lesson else 0)) % 12  # a fifth up from the last video's key
    mode = str(rng.choice(st["modes"]))
    bank = JAZZ if st.get("jazz") else PROGS[mode]
    prog = bank[int(rng.integers(len(bank)))]
    bpm = float(rng.uniform(*st["bpm"]))
    root = 48 + ((pc - 48) % 12)  # the key's note, octave 3
    chords, prev = [], None
    for deg in prog:
        v = voice(chord_notes(root, mode, deg, st["ext"]), prev)
        chords.append({"deg": deg, "root_pc": int((root + MODES[mode][deg % 7]) % 12), "notes": [int(n) for n in v]})
        prev = v
    return {
        "style": name, "seed": seed, "key_pc": pc, "mode": mode, "bpm": round(bpm, 2), "beats": st["beats"],
        "bar": round(st["beats"] * 60 / bpm, 4), "ext": st["ext"], "cap": st["cap"], "chords": chords, "root": root,
    }


# ----------------------------------------------------------------------------------------------------------- render


class Mix:
    def __init__(self, seconds):
        self.n = int((seconds + 4) * SR)
        self.out = np.zeros((self.n, 2))

    def add(self, x, at, gain=1.0, pan=0.0):
        s = int(at * SR)
        if s >= self.n or s < 0:
            return
        e = min(self.n, s + len(x))
        l = np.sqrt(0.5 - pan / 2)
        r = np.sqrt(0.5 + pan / 2)
        self.out[s:e, 0] += x[: e - s] * gain * l * 1.41
        self.out[s:e, 1] += x[: e - s] * gain * r * 1.41


def melody_phrase(plan, rh, lo, hi, rng, bars=4):
    """Four bars of melody: each bar takes one of the rhythms; notes on a strong beat are notes of that bar's chord, the
    ones between step along the scale. Returns (bar, beat, length, midi)."""
    mode, root = plan["mode"], plan["root"]
    scale = sorted({degree_midi(root, mode, d) + 12 * o for d in range(7) for o in range(-2, 4) if lo <= degree_midi(root, mode, d) + 12 * o <= hi})
    out = []
    cur = scale[len(scale) // 2]
    direction = 1
    strong = (0, 2) if plan["beats"] == 4 else (0,)
    pats = [rh[int(rng.integers(len(rh)))] for _ in range(bars)]
    for b in range(bars):
        chord = plan["chords"][b % len(plan["chords"])]
        cpcs = {n % 12 for n in chord["notes"]}
        tones = [m for m in scale if m % 12 in cpcs]
        for beat, ln in pats[b]:
            last = b == bars - 1 and (beat, ln) == pats[b][-1]
            if beat in strong or last:
                pool = sorted(tones, key=lambda m: abs(m - (cur + direction * 2)))
                nxt = pool[0] if pool[0] != cur or rng.random() < 0.3 else pool[1]
            else:
                i = scale.index(cur) if cur in scale else min(range(len(scale)), key=lambda k: abs(scale[k] - cur))
                step = int(rng.choice([1, 1, 1, 2, 0]))
                if rng.random() < 0.25:
                    direction = -direction
                i = min(len(scale) - 1, max(0, i + direction * step))
                nxt = scale[i]
            if nxt >= hi - 1:
                direction = -1
            elif nxt <= lo + 1:
                direction = 1
            out.append((b, beat, ln, nxt))
            cur = nxt
    return out


def render(plan, dur, seed=None, skip=()):
    """The music as a stereo float array (SR), `dur` seconds long."""
    st = STYLES[plan["style"]]
    rng = np.random.default_rng((plan["seed"] if seed is None else seed) * 104729 + 7)
    beat = 60 / plan["bpm"]
    nb = plan["beats"]
    bar = nb * beat
    swing = st.get("swing", 0.0)
    mix = Mix(dur)
    cache = {}

    def note(inst, midi, ln, vel=1.0):
        key = (inst, int(midi), round(ln, 2))
        if key not in cache:
            fn = INSTRUMENTS[inst]
            try:
                cache[key] = fn(hz(midi), max(ln, 0.15), rng)
            except TypeError:
                cache[key] = fn(hz(midi))
        return cache[key] * vel

    def when(bar_i, b):
        sw = swing * beat if abs((b % 1) - 0.5) < 1e-6 else 0.0
        return bar_i * bar + b * beat + sw + rng.normal(0, 0.003)

    nbars = int((dur + 2) / bar) + 2
    chords = plan["chords"]
    cp = len(chords)
    kick_f = 40 + ((plan["key_pc"] - 40) % 12)

    # melody phrases are made once and repeated, with the second pass in the same chords
    phrases = {}
    for li, ly in enumerate(st["layers"]):
        if ly["t"] == "mel":
            phrases[li] = melody_phrase(plan, ly["rh"], ly["lo"], ly["hi"], rng)

    for bi in range(nbars):
        ch = chords[bi % cp]
        notes = ch["notes"]
        broot = 36 + ((ch["root_pc"] - 36) % 12)
        for li, ly in enumerate(st["layers"]):
            if bi < ly.get("start", 0) or ly["t"] in skip:
                continue
            kind = ly["t"]
            g = ly["gain"]
            if kind == "pad":
                mix.add(pad_chord(notes, bar + 0.6, ly["kind"], rng), bi * bar, g)
            elif kind == "arp":
                for k, (b, ni, octs) in enumerate(ly["pat"]):
                    m = notes[ni % len(notes)] + 12 * (ni // len(notes)) + 12 * octs
                    ln = 0.5 if ly["inst"] in ("pizz", "synth") else 1.4
                    mix.add(note(ly["inst"], m, ln), when(bi, b), g * (1.0 if (b * 2) % 2 == 0 else 0.72), ly.get("pan", 0))
            elif kind == "stab":
                for b in ly["beats"]:
                    for j, m in enumerate(notes):
                        mix.add(note(ly["inst"], m, ly["dur"]), when(bi, b) + j * ly.get("strum", 0.0), g, ly.get("pan", 0))
            elif kind == "bass":
                for b, which, ln in ly["pat"]:
                    m = broot + (7 if which == "5" else 12 if which == "8" else 0)
                    mix.add(note(ly["inst"], m, ln * beat * 0.95 + 0.1), when(bi, b), g)
            elif kind == "mel":
                ph = phrases[li]
                for (pb, b, ln, m) in ph:
                    if pb == bi % 4:  # the same four bars again and again, so the tune can be remembered
                        mix.add(note(ly["inst"], m, ln * beat + 0.2), when(bi, b), g, ly.get("pan", 0))
            elif kind == "drum":
                dg = ly.get("gain", 1.0)
                for b in ly.get("kick", []):
                    mix.add(d_kick(rng, kick_f), when(bi, b), 0.2 * dg)
                for b in ly.get("snare", []):
                    mix.add(d_snare(rng), when(bi, b), 0.12 * dg)
                for b in ly.get("rim", []):
                    mix.add(d_rim(rng), when(bi, b), 0.1 * dg, 0.15)
                for b in ly.get("clap", []):
                    mix.add(d_clap(rng), when(bi, b), 0.1 * dg, 0.1)
                for k, b in enumerate(ly.get("hat", [])):
                    mix.add(d_hat(rng), when(bi, b), (0.04 if k % 2 else 0.028) * dg, 0.3)
                for k, b in enumerate(ly.get("shaker", [])):
                    mix.add(d_shaker(rng), when(bi, b), (0.04 if k % 2 else 0.022) * dg, 0.3)
                for b in ly.get("tamb", []):
                    mix.add(d_tamb(rng), when(bi, b), 0.05 * dg, 0.3)
                for b in ly.get("wood", []):
                    mix.add(d_wood(rng, 1.0, hz(81 + ((ch["root_pc"] - 81) % 12))), when(bi, b), 0.1 * dg, -0.2)
                for b in ly.get("boom", []):
                    mix.add(inst_timpani(hz(36 + ((ch["root_pc"] - 36) % 12))), when(bi, b), 0.16 * dg)
                if ly.get("crackle"):
                    c = np.zeros(int(bar * SR))
                    for _ in range(int(bar * 9)):
                        c[int(rng.integers(len(c)))] = rng.normal() * 0.6
                    mix.add(hp(lp(c, 7000), 800), bi * bar, 0.05 * dg)
            elif kind == "chimes":
                scale = [degree_midi(plan["root"], plan["mode"], d) + 12 * o for d in (0, 1, 2, 4, 5) for o in range(2, 5)]
                scale = [m for m in scale if ly["lo"] <= m <= ly["hi"]]
                if rng.random() < ly["per_bar"] and scale:
                    cpcs = {n % 12 for n in notes}
                    pool = [m for m in scale if m % 12 in cpcs] or scale
                    mix.add(note(ly["inst"], int(rng.choice(pool)), 1.6), bi * bar + rng.uniform(0.3, 0.9) * bar, g, rng.uniform(-0.5, 0.5))

    out = mix.out
    # a room around it
    sec, wet = st["rev"]
    irt = T(sec)
    irs = []
    for _ in range(2):
        ir = lp(rng.normal(size=len(irt)) * np.exp(-irt * (5.5 / sec)), 6500)
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    out = out[: int((dur + 2) * SR)]
    w = np.stack([fftconvolve(out[:, 0], irs[0])[: len(out)], fftconvolve(out[:, 1], irs[1])[: len(out)]], 1)
    mixed = (1 - wet) * out + wet * w * (np.sqrt(np.mean(out ** 2) + 1e-12) / (np.sqrt(np.mean(w ** 2)) + 1e-12))
    mixed = mixed[: int(dur * SR)]
    fade = int(1.5 * SR)
    mixed[-fade:] *= np.linspace(1, 0, fade)[:, None]
    mixed[: int(0.04 * SR)] *= np.linspace(0, 1, int(0.04 * SR))[:, None]
    # the same loudness for every style (so one isn't louder under the voice), then a soft ceiling
    rms = np.sqrt(np.mean(mixed ** 2) + 1e-12)
    mixed = mixed * (0.15 / rms)
    mixed = np.tanh(mixed * 1.15) / 1.15
    return mixed / max(1.0, np.max(np.abs(mixed)) / 0.95)


def write_wav(path, stereo):
    wavfile.write(path, SR, (np.clip(stereo, -1, 1) * 32767).astype(np.int16))


if __name__ == "__main__":
    out_path, dur, seed = sys.argv[1], float(sys.argv[2]), int(sys.argv[3])
    plan = make_plan(seed, True)
    write_wav(out_path, render(plan, dur))
    print(f"{out_path}: {dur:.1f}s, {plan['style']}, key {plan['key_pc']} {plan['mode']}, {plan['bpm']:.0f} bpm, chords {[c['deg'] for c in plan['chords']]}")
