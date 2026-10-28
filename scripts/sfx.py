# Makes the sound effects the stories use, from scratch, so nothing needs a licence.
# Usage: python3 scripts/sfx.py public/sfx
import os
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt, sosfiltfilt

SR = 44100
rng = np.random.default_rng(11)
out_dir = sys.argv[1]
os.makedirs(out_dir, exist_ok=True)


def T(sec):
    return np.arange(int(sec * SR)) / SR


def noise(sec):
    return rng.normal(size=int(sec * SR))


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f):
    return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)


def sweep_bp(x, f0, f1, q=3.0, blocks=200):
    """Band-pass whose centre moves from f0 to f1 (log), block by block."""
    out = np.zeros_like(x)
    n = len(x)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    for i in range(blocks):
        u = i / (blocks - 1)
        fc = f0 * (f1 / f0) ** u
        lo, hi = max(30, fc / (1 + 1 / q)), min(SR / 2 - 100, fc * (1 + 1 / q))
        a, b = max(0, edges[i] - 2048), edges[i + 1]
        seg = sosfiltfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x[a:b])
        out[edges[i]:b] = seg[edges[i] - a:]
    return out


def verb(x, sec=1.6, decay=3.0, wet=0.35):
    ir = rng.normal(size=int(sec * SR)) * np.exp(-T(sec) * decay)
    ir = lp(ir, 6000)
    y = fftconvolve(x, ir)[: len(x) + int(sec * SR)]
    y = y / (np.max(np.abs(y)) + 1e-9)
    dry = np.concatenate([x / (np.max(np.abs(x)) + 1e-9), np.zeros(len(y) - len(x))])
    return (1 - wet) * dry + wet * y


def stereo(x, pan=None, width=0.0):
    if pan is None:
        pan = np.zeros(len(x))
    l = x * np.sqrt(np.clip(0.5 - pan / 2, 0, 1))
    r = x * np.sqrt(np.clip(0.5 + pan / 2, 0, 1))
    if width:
        r = np.roll(r, int(width * SR))
    return np.stack([l, r], 1)


def save(name, x, peak=0.89):
    if x.ndim == 1:
        x = stereo(x, width=0.0004)
    fade = int(0.01 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(os.path.join(out_dir, f"{name}.wav"), SR, (x * 32767).astype(np.int16))


def env(sec, attack, release_shape):
    t = T(sec)
    return np.minimum(1, t / attack) * release_shape(t)


# whoosh: noise swept up then down, panning across
d = 0.7
t = T(d)
shape = np.exp(-((t - 0.38) / 0.16) ** 2)
x = sweep_bp(noise(d), 300, 4000, q=2.5) * shape
x += 0.4 * sweep_bp(noise(d), 120, 900, q=2) * shape
save("whoosh", stereo(x, pan=np.linspace(-0.7, 0.7, len(x))), 0.8)

# whoosh2: shorter, falling
d = 0.55
t = T(d)
shape = np.exp(-((t - 0.3) / 0.12) ** 2)
x = sweep_bp(noise(d), 5000, 400, q=2.5) * shape
save("whoosh2", stereo(x, pan=np.linspace(0.6, -0.6, len(x))), 0.8)

# impact: a short sub drop with a thud and a hit of noise
d = 1.6
t = T(d)
f = 90 * np.exp(-t * 3) + 34
x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
x += 0.6 * lp(noise(d), 400) * np.exp(-t * 18)
x += 0.25 * bp(noise(d), 1500, 5000) * np.exp(-t * 60)
save("impact", verb(x, 1.4, 3.5, 0.25))

# boom: deeper and longer, for a big reveal
d = 3.0
t = T(d)
f = 60 * np.exp(-t * 1.5) + 28
x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.4) * np.minimum(1, t / 0.01)
x += 0.5 * lp(noise(d), 200) * np.exp(-t * 2.5)
save("boom", verb(x, 2.5, 2.0, 0.3))

# riser: rising tone and noise, swelling
d = 1.6
t = T(d)
f = 180 * (6 ** (t / d))
x = 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t))
x += sweep_bp(noise(d), 400, 6000, q=2)
x *= (t / d) ** 2
save("riser", verb(x, 0.8, 4, 0.2), 0.7)

# shimmer: little bells in a cluster
d = 2.4
x = np.zeros(int(d * SR))
notes = [2093, 2349, 2637, 3136, 3520, 4186, 4699, 5274]
for i in range(14):
    at = rng.uniform(0, 0.7)
    fr = rng.choice(notes) * (1 + rng.normal(0, 0.002))
    tt = T(1.2)
    tone = (np.sin(2 * np.pi * fr * tt) + 0.3 * np.sin(2 * np.pi * fr * 2.76 * tt) * np.exp(-tt * 8)) * np.exp(-tt * 5) * np.minimum(1, tt / 0.003)
    s = int(at * SR)
    x[s:s + len(tone)] += tone[: len(x) - s] * rng.uniform(0.4, 1.0)
x = hp(x, 1200)
save("shimmer", stereo(verb(x, 1.5, 3, 0.45), width=0.0009), 0.6)

# stamp: a rubber stamp hitting paper on a desk
d = 0.6
t = T(d)
x = np.sin(2 * np.pi * 110 * t) * np.exp(-t * 30)
x += 0.8 * bp(noise(d), 800, 3500) * np.exp(-t * 70)
x += 0.4 * np.sin(2 * np.pi * 420 * t) * np.exp(-t * 45)
save("stamp", verb(x, 0.4, 9, 0.12))

# horn: a distant steamship horn
d = 2.8
t = T(d)
vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * t)
saw = lambda fr: 2 * ((np.cumsum(fr * vib) / SR) % 1) - 1
x = saw(np.full(len(t), 98.0)) + 0.7 * saw(np.full(len(t), 147.0))
x = lp(x, 700) * np.minimum(1, t / 0.25) * np.minimum(1, np.maximum(0, (2.2 - t)) / 0.5)
save("horn", verb(x, 2.2, 1.8, 0.5), 0.75)

# waves: sea swell
d = 4.0
t = T(d)
swell = 0.55 + 0.45 * np.sin(2 * np.pi * 0.45 * t - 1.2) ** 2
x = lp(noise(d), 900) * swell + 0.3 * bp(noise(d), 2000, 6000) * swell**3
x *= np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.8)
save("waves", stereo(x, width=0.003), 0.55)

# crack: a sharp split with a glassy ring
d = 1.0
t = T(d)
x = np.zeros(len(t))
for i in range(6):
    s = int(rng.uniform(0, 0.05) * SR)
    burst = bp(noise(0.03), 2000, 9000) * np.exp(-T(0.03) * 150)
    x[s:s + len(burst)] += burst * rng.uniform(0.5, 1)
for fr in (3100, 4630, 6020):
    x += 0.15 * np.sin(2 * np.pi * fr * t) * np.exp(-t * 14)
x += 0.6 * np.sin(2 * np.pi * 70 * t) * np.exp(-t * 20)
save("crack", verb(x, 0.8, 5, 0.2))

# heartbeat: three beats, lub-dub
d = 2.8
x = np.zeros(int(d * SR))
for b in range(3):
    for k, (off, amp) in enumerate(((0, 1.0), (0.26, 0.7))):
        tt = T(0.35)
        beat = (np.sin(2 * np.pi * 52 * tt) + 0.4 * lp(rng.normal(size=len(tt)), 150)) * np.exp(-tt * 16) * amp
        s = int((b * 0.9 + off) * SR)
        x[s:s + len(beat)] += beat
save("heartbeat", lp(x, 220))

# creak: an old lid opening, then a knock
d = 0.9
t = T(d)
fr = 340 + 120 * np.sin(2 * np.pi * 2.2 * t) + 40 * rng.normal(size=len(t)).cumsum() / np.sqrt(len(t))
grain = (np.sin(2 * np.pi * 61 * t) > 0.2).astype(float) * 0.6 + 0.4
x = (2 * ((np.cumsum(fr) / SR) % 1) - 1) * grain
x = bp(x, 250, 2500) * np.minimum(1, t / 0.05) * np.exp(-np.maximum(0, t - 0.55) * 20)
knock = np.zeros(len(t))
s = int(0.62 * SR)
kk = np.sin(2 * np.pi * 160 * T(0.2)) * np.exp(-T(0.2) * 35)
knock[s:s + len(kk)] = kk
save("creak", verb(0.5 * x + knock, 0.5, 8, 0.15), 0.7)

# steps: footsteps on stone
d = 2.2
x = np.zeros(int(d * SR))
for i in range(4):
    tt = T(0.18)
    step = (0.8 * lp(rng.normal(size=len(tt)), 1800) * np.exp(-tt * 45) + np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 40)) * (0.8 + 0.2 * (i % 2))
    s = int((0.05 + i * 0.48) * SR)
    x[s:s + len(step)] += step
save("steps", verb(x, 0.9, 4, 0.3), 0.7)

print("made", len(os.listdir(out_dir)), "sounds in", out_dir)
