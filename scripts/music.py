# Original background music for one story: a dark, pulsing bed (low synth pulse, soft ticks, a few piano notes
# in a minor key, swells into each new bar). Each seed picks its own key, chords, tempo and melody.
# With "bright" (the paper look, ali 30 Oct 2026) it is light and playful instead: a major key, marimba arpeggios,
# a little bell tune, a soft pad and a shaker.
# Usage: python3 scripts/music.py OUT.wav SECONDS SEED [bright]
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
out_path, dur, seed = sys.argv[1], float(sys.argv[2]), int(sys.argv[3])
bright = len(sys.argv) > 4 and sys.argv[4] == "bright"
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



def marimba(f, amp):
    t = np.arange(int(1.2 * SR)) / SR
    env = np.exp(-t * 7) * (1 - np.exp(-t * 900))
    return amp * env * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 25))


def glock(f, amp):
    t = np.arange(int(1.6 * SR)) / SR
    env = np.exp(-t * 3.5) * (1 - np.exp(-t * 2000))
    return amp * env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 9))


def pad(fs, length, amp):
    t = np.arange(int(length * SR)) / SR
    w = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 1.003 * t) for f in fs)
    return amp * lp(w, 1800) * np.minimum(1, t / 0.4) * np.minimum(1, (length - t) / 0.4)


def shaker(amp):
    n = rng.normal(size=int(0.06 * SR)) * np.exp(-np.arange(int(0.06 * SR)) / SR * 70)
    return amp * sosfilt(butter(2, 7000, btype="high", fs=SR, output="sos"), n)


if bright:
    root = int(rng.choice([60, 62, 65, 67, 57]))  # C, D, F, G, A
    prog = [[0, 7, 9, 5], [0, 5, 9, 7], [0, 9, 5, 7], [0, 4, 5, 7], [5, 7, 0, 9]][int(rng.integers(5))]
    bpm = float(rng.uniform(100, 114))
    beat = 60 / bpm
    bar = 4 * beat
    tune = rng.choice([0, 2, 4, 7, 9, 12], size=8)
    i, t0 = 0, 0.0
    while t0 < dur + 2:
        deg = prog[i % 4]
        minor = deg in (9, 2, 4)
        ch = [root + deg, root + deg + (3 if minor else 4), root + deg + 7]
        arp = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]]
        for k in range(8):
            add(marimba(m(arp[k]), 0.16 if k % 2 == 0 else 0.11), t0 + k * beat / 2 + rng.normal(0, 0.003))
            add(shaker(0.035 if k % 2 else 0.02), t0 + k * beat / 2)
        add(pad([m(ch[0] - 12), m(ch[1] - 12), m(ch[2] - 12)], bar + 0.3, 0.05), t0)
        add(sub(m(ch[0] - 24), bar, 0.14), t0)
        if i >= 1:
            add(kick(0.18), t0)
            add(kick(0.12), t0 + 2 * beat)
        if i % 2 == 1:
            for k in range(4):
                add(glock(m(root + 24 + int(tune[(i * 2 + k) % 8])), 0.07), t0 + k * beat + rng.normal(0, 0.004))
        i += 1
        t0 += bar

motif = rng.choice([0, 1, 2, 3], size=4)
i, t0 = 0, 0.0
while not bright and t0 < dur + 2:
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
print(f"{out_path}: {dur:.1f}s, {'bright, ' if bright else ''}root {root}, chords {prog}, {bpm:.0f} bpm")
