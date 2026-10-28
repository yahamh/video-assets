# Original background music for one story: a dark, pulsing bed (low synth pulse, soft ticks, a few piano notes
# in a minor key, swells into each new bar). Each seed picks its own key, chords, tempo and melody.
# Usage: python3 scripts/music.py OUT.wav SECONDS SEED
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
out_path, dur, seed = sys.argv[1], float(sys.argv[2]), int(sys.argv[3])
rng = np.random.default_rng(seed)

root = int(rng.choice([45, 50, 52, 48, 43]))  # A, D, E, C, G (low)
progs = [[0, 8, 3, 10], [0, 5, 8, 7], [0, 8, 5, 7], [0, 3, 8, 10], [0, 10, 8, 7]]
prog = progs[int(rng.integers(len(progs)))]
bpm = float(rng.uniform(96, 108))
beat = 60 / bpm
bar = 4 * beat


def m(n):
    return 440 * 2 ** ((n - 69) / 12)


def lp(x, f):
    return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)


def chord(deg):
    third = 3 if deg in (0, 5) else 4
    return [root + deg, root + deg + third, root + deg + 7]


def pulse(f, length, amp, cutoff):
    t = np.arange(int(length * SR)) / SR
    saw = 2 * ((f * t) % 1) - 1 + 0.5 * (2 * ((f * 1.007 * t) % 1) - 1)
    env = np.exp(-t * 9) * (1 - np.exp(-t * 400))
    return amp * lp(saw, cutoff) * env


def piano(f, amp):
    t = np.arange(int(3.0 * SR)) / SR
    env = np.exp(-t * 1.6) * (1 - np.exp(-t * 300))
    w = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 5)
    return amp * w * env


def tick(amp):
    n = rng.normal(size=int(0.05 * SR)) * np.exp(-np.arange(int(0.05 * SR)) / SR * 90)
    return amp * sosfilt(butter(2, 6000, btype="high", fs=SR, output="sos"), n)


def sub(f, length, amp):
    t = np.arange(int(length * SR)) / SR
    return amp * np.sin(2 * np.pi * f * t) * np.minimum(1, t / (length * 0.6)) * np.minimum(1, (length - t) / 0.15)


def kick(amp):
    t = np.arange(int(0.4 * SR)) / SR
    f = 110 * np.exp(-t * 25) + 45
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


N = int((dur + 4) * SR)
out = np.zeros(N)


def add(x, at):
    s = max(0, int(at * SR))
    if s >= N:
        return
    e = min(N, s + len(x))
    out[s:e] += x[: e - s]


motif = rng.choice([0, 1, 2, 3], size=4)
i, t0 = 0, 0.0
while t0 < dur + 2:
    ch = chord(prog[i % 4])
    for k in range(8):
        cutoff = 500 + 900 * (k / 8) + (300 if i % 4 == 3 else 0)
        add(pulse(m(ch[0]), beat / 2 + 0.05, 0.22, cutoff), t0 + k * beat / 2)
        add(tick(0.05 if k % 2 else 0.025), t0 + k * beat / 2)
    if i >= 1:
        add(kick(0.35), t0)
        add(kick(0.25), t0 + 2 * beat)
    tones = [ch[0] + 24, ch[1] + 24, ch[2] + 24, ch[0] + 36]
    for k in range(2):
        add(piano(m(tones[int(motif[(i * 2 + k) % 4])]), 0.12), t0 + k * 2 * beat + rng.normal(0, 0.004))
    add(sub(m(ch[0] - 12), bar, 0.18), t0)
    i += 1
    t0 += bar

ir_t = np.arange(int(2.0 * SR)) / SR
ir = rng.normal(size=len(ir_t)) * np.exp(-ir_t * 3)
ir[0] = 10
wet = fftconvolve(out, ir)[:N]
wet /= np.max(np.abs(wet))
mix = 0.7 * out / np.max(np.abs(out)) + 0.35 * wet
mix = mix[: int(dur * SR)]
fade = int(1.5 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
mix /= np.max(np.abs(mix)) * 1.12
st = np.stack([mix, np.roll(mix, 300)], 1)
wavfile.write(out_path, SR, (st * 32767).astype(np.int16))
print(f"{out_path}: {dur:.1f}s, root {root}, chords {prog}, {bpm:.0f} bpm")
