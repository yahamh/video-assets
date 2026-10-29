"""Voice for a story: reads each line aloud, checks it was read right, and notes when each caption word is said.

Usage: python scripts/voice.py stories/001-cullinan.json [--voice NAME] [--out PATH]

The voices are in voices.json. Lines are read in groups, a sentence or two at a time, the way a person reads
on: a line that doesn't end a sentence, or has SHORT words or fewer, joins the line before it, and lines join until
a group has about GROUP_MIN words. Read one line at a time, every line starts on the same pitch and the story
sounds like a list. Each group's `say` (or `text`) is read with Chatterbox (MIT), then transcribed with
faster-whisper; a group that comes back garbled, too fast or too slow is read again with another seed, up to
TRIES times, and the best take is kept. The take is cut into its lines at the quietest moment between them, so
the lines play back to back exactly as they were read. The pieces go to public/voice/<story>/<voice>/NN.wav and
the story JSON gets each line's audio, seconds, pad (0 inside a group) and words (caption word timings, in seconds
from the line's start). A line that ends a sentence gets PAD_S of quiet after it, wherever it falls. Every line is
then slowed or sped up by the same amount (pitch kept): slowed when the reading runs faster than MAX_WPS or the
story comes out shorter than MIN_S, sped up when it runs past MAX_S.
A script with "length": [min, max] (seconds) uses those limits instead, e.g. [0, 9999] to keep the
reading's own pace (voiceovers in voiceovers/, cut to the voice afterwards).
"""
import argparse
import difflib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
TRIES = 4
MIN_SCORE = 0.8  # share of words whisper must hear as written
RATE = (1.6, 4.6)  # words a second a take must fall within
MIN_S, MAX_S = 31.0, 39.5  # shortest and longest a story may run, end card included (ali: 30 to 40 s)
END_S, PAD_S = 2.0, 0.25  # must match src/story.ts
MAX_WPS = 3.8  # read faster than this and it sounds rushed (voice A read 4.3 a second in whole sentences)
MIN_TEMPO, MAX_TEMPO = 0.9, 1.15
LUFS = -18.0
SHORT = 3  # lines this short always join the line before
GROUP_MIN, GROUP_MAX = 12, 28  # words a group gathers before it may end, and the most it takes on


def words_of(text):
    return [w for w in text.split() if re.search(r"\w", w)]


def norm(w):
    return re.sub(r"[^\w]", "", w.lower().replace("’", "'").replace("'", ""))


def score(heard, *wanted):
    h = [norm(w) for w in heard]
    return max(difflib.SequenceMatcher(None, h, [norm(w) for w in words_of(x)]).ratio() for x in wanted)


def transfer(src, times, dst):
    """Carries word times from one wording to another (heard words to `say`, `say` to caption).
    Matching words take their time; a run that differs ("3,106" against "three thousand, one hundred
    and six") shares the span of the run it replaces. Words left without a time get None."""
    sm = difflib.SequenceMatcher(None, [norm(w) for w in src], [norm(w) for w in dst], autojunk=False)
    out = [None] * len(dst)
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op == "equal":
            for k in range(b1 - b0):
                out[b0 + k] = times[a0 + k]
        elif op == "replace":
            span = [t for t in times[a0:a1] if t]
            if not span:
                continue
            a, b = span[0][0], span[-1][1]
            weight = [len(norm(w)) + 1 for w in dst[b0:b1]]
            at = a
            for k, wt in enumerate(weight):
                d = (b - a) * wt / sum(weight)
                out[b0 + k] = (at, at + d)
                at += d
    return out


def fill(times, total):
    """Gives words without a time the gap between their neighbours."""
    n = len(times)
    i = 0
    while i < n:
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < n and times[j] is None:
            j += 1
        a = times[i - 1][1] if i > 0 else 0.05
        b = times[j][0] if j < n else total
        if b <= a:
            b = a + 0.15 * (j - i)
        step = (b - a) / (j - i)
        for k in range(i, j):
            times[k] = (a + step * (k - i), a + step * (k - i + 1))
        i = j
    return times


def rms10(wav, sr):
    """Loudness of each 10 ms of the take."""
    frame = int(0.01 * sr)
    n = len(wav) // frame
    return frame, np.sqrt(np.mean(wav[: n * frame].reshape(n, frame) ** 2, axis=1) + 1e-12)


def bounds(wav, sr, before=0.03, after=0.09):
    """Where the voice starts and stops, keeping a breath of room (samples)."""
    frame, rms = rms10(wav, sr)
    loud = np.where(rms > rms.max() * 10 ** (-38 / 20))[0] if len(rms) else []
    if not len(loud):
        return 0, len(wav)
    return max(0, loud[0] * frame - int(before * sr)), min(len(wav), (loud[-1] + 1) * frame + int(after * sr))


def trim(wav, sr):
    """Cuts the silence around the voice."""
    a, b = bounds(wav, sr)
    return wav[a:b]


def groups_of(says):
    """Splits the lines into groups read in one go (lists of line numbers)."""
    out = []
    for i, say in enumerate(says):
        if out:
            g = out[-1]
            n = sum(len(words_of(says[j])) for j in g)
            ends = re.search(r"[.!?][\"')\]]*$", says[g[-1]].strip())
            m = len(words_of(say))
            if not ends or m <= SHORT or (n < GROUP_MIN and n + m <= GROUP_MAX):
                g.append(i)
                continue
        out.append([i])
    return out


def split(wav, sr, heard, times, says):
    """Cuts a group's take into its lines. Finds where whisper heard each line's first word and cuts at the end
    of the quiet between it and the word before, so the pause stays with the line before and the next scene comes
    in with the next word. Gives back (piece, say words, their times from the piece's
    start, None where unknown) per line, or None when a line's first word wasn't heard."""
    words = [words_of(x) for x in says]
    at = transfer(heard, times, [w for ws in words for w in ws])
    frame, rms = rms10(wav, sr)
    cuts, k = [0], len(words[0])
    for ws in words[1:]:
        first = at[k]
        if first is None:
            return None
        before = next((t[1] for t in reversed(at[:k]) if t), first[0] - 0.3)
        lo = max(cuts[-1] // frame + 1, int(min(before, first[0] - 0.05) / 0.01))
        hi = min(len(rms), max(lo + 1, int((first[0] + 0.05) / 0.01)))
        if lo >= hi:
            return None
        q = rms[lo:hi]
        cuts.append((lo + int(np.where(q <= q.min() * 1.5 + 1e-6)[0][-1])) * frame)  # late in the pause
        k += len(ws)
    cuts.append(len(wav))
    out, k = [], 0
    for j, ws in enumerate(words):
        t0 = cuts[j] / sr
        tj = [(max(0.0, float(t[0]) - t0), max(0.0, float(t[1]) - t0)) if t else None for t in at[k : k + len(ws)]]
        out.append((wav[cuts[j] : cuts[j + 1]], ws, tj))
        k += len(ws)
    return out


def loudness(wav, sr):
    import pyloudnorm

    meter = pyloudnorm.Meter(sr, block_size=min(0.4, len(wav) / sr * 0.9))
    try:
        wav = pyloudnorm.normalize.loudness(wav, meter.integrated_loudness(wav), LUFS)
    except ValueError:
        pass
    peak = np.abs(wav).max()
    return wav * (0.84 / peak) if peak > 0.84 else wav


def stretch(path, tempo):
    """Speeds a take up or slows it down without changing its pitch (ffmpeg rubberband, else atempo)."""
    tmp = path.with_suffix(".tmp.wav")
    for f in (f"rubberband=tempo={tempo:.4f}", f"atempo={tempo:.4f}"):
        r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(path), "-af", f, str(tmp)], capture_output=True)
        if r.returncode == 0:
            tmp.replace(path)
            return
    raise RuntimeError(r.stderr.decode())


class Reader:
    def __init__(self, voice):
        import torch

        self.torch = torch
        self.v = voice
        torch.set_num_threads(os.cpu_count() or 4)
        if voice["engine"] == "turbo":
            from chatterbox.tts_turbo import ChatterboxTurboTTS as Model
        else:
            from chatterbox.tts import ChatterboxTTS as Model
        self.model = Model.from_pretrained(device="cpu")
        self.sr = self.model.sr
        self.ref = str(ROOT / voice["ref"]) if voice.get("ref") else None
        if self.ref:
            kw = {} if voice["engine"] == "turbo" else {"exaggeration": voice.get("exaggeration", 0.5)}
            self.model.prepare_conditionals(self.ref, **kw)

    def read(self, text, seed):
        self.torch.manual_seed(seed)
        v = self.v
        if v["engine"] == "turbo":
            wav = self.model.generate(text, temperature=v.get("temperature", 0.8), top_p=v.get("top_p", 0.95))
        else:
            wav = self.model.generate(
                text,
                exaggeration=v.get("exaggeration", 0.5),
                cfg_weight=v.get("cfg", 0.5),
                temperature=v.get("temperature", 0.8),
            )
        return wav.squeeze(0).numpy().astype(np.float32)


class Ear:
    def __init__(self):
        from faster_whisper import WhisperModel

        self.model = WhisperModel(os.environ.get("WHISPER_MODEL", "small.en"), device="cpu", compute_type="int8")

    def hear(self, path):
        segs, _ = self.model.transcribe(
            str(path), language="en", word_timestamps=True, beam_size=5, condition_on_previous_text=False, vad_filter=False
        )
        words = [w for s in segs for w in (s.words or [])]
        return [w.word.strip() for w in words], [(float(w.start), float(w.end)) for w in words]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("story")
    ap.add_argument("--voice", default=None, help="a name from voices.json (default: the story's, else voices.json's default)")
    ap.add_argument("--out", default=None, help="where to write the voiced story JSON (default: over the story)")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    story_path = Path(args.story)
    story = json.loads(story_path.read_text())
    voices = json.loads((ROOT / "voices.json").read_text())
    name = args.voice or story.get("voice") or voices["default"]
    voice = voices["voices"][name]
    out_dir = ROOT / "public" / "voice" / story["id"] / name
    out_dir.mkdir(parents=True, exist_ok=True)

    reader, ear = Reader(voice), Ear()
    lines = story["lines"]
    says = [l.get("say") or l["text"] for l in lines]
    takes = []
    for g in groups_of(says):
        say = " ".join(says[i] for i in g)
        text = " ".join(lines[i]["text"] for i in g)
        name_g = f"line {g[0] + 1:2d}" if len(g) == 1 else f"lines {g[0] + 1}-{g[-1] + 1}"
        tmp = out_dir / f"group-{g[0] + 1:02d}.wav"
        best = None
        for k in range(TRIES):
            wav = loudness(trim(reader.read(say, args.seed + 1000 * k + g[0]), reader.sr), reader.sr)
            sf.write(tmp, wav, reader.sr)
            heard, times = ear.hear(tmp)
            secs = len(wav) / reader.sr
            rate = len(words_of(say)) / max(secs, 0.1)
            s = score(heard, say, text)
            pieces = split(wav, reader.sr, heard, times, [says[i] for i in g]) if len(g) > 1 else [(wav, heard, times)]
            ok = pieces is not None and s >= MIN_SCORE and RATE[0] <= rate <= RATE[1]
            print(f"{name_g} take {k + 1}: heard {s:.2f}, {rate:.1f} words/s, {secs:.2f} s {'ok' if ok else 'again'}", flush=True)
            if pieces is None:
                continue
            miss = max(RATE[0] - rate, rate - RATE[1], 0.0)  # how far outside the allowed speed
            if best is None or (ok, s, -miss) > (best["ok"], best["score"], -best["miss"]):
                best = {"ok": ok, "score": s, "miss": miss, "pieces": pieces, "heard": heard}
            if ok:
                break
        tmp.unlink(missing_ok=True)
        if best is None:
            sys.exit(f"{name_g}: no take could be cut into its lines: {say!r}")
        if not best["ok"]:
            print(f"{name_g}: no clean take, keeping the best ({best['score']:.2f}): {say!r} heard {' '.join(best['heard'])!r}", file=sys.stderr)
        for j, (i, (piece, heard_w, heard_t)) in enumerate(zip(g, best["pieces"])):
            path = out_dir / f"{i + 1:02d}.wav"
            sf.write(path, piece, reader.sr)
            ends = re.search(r"[.!?][\"')\]]*$", says[i].strip())
            pad = PAD_S if ends or j == len(g) - 1 else 0.0
            takes.append((lines[i], says[i], path, len(piece) / reader.sr, pad, heard_w, heard_t))

    # Slow a rushed reading or a short story down, or speed a long one up, every line by the same amount.
    speak = sum(t[3] for t in takes)
    fixed = sum(t[4] + (t[0].get("hold") or 0) for t in takes) + END_S
    tempo = voice.get("tempo", 1.0)
    rate = sum(len(words_of(t[1])) for t in takes) / max(speak, 0.1)
    min_s, max_s = story.get("length") or (MIN_S, MAX_S)
    tempo = min(tempo, max(MIN_TEMPO, MAX_WPS / rate))
    if speak / tempo + fixed < min_s:
        tempo = max(MIN_TEMPO, min(tempo, speak / (min_s - fixed)))
    if speak / tempo + fixed > max_s:
        tempo = min(MAX_TEMPO, speak / (max_s - fixed))
    print(f"voice {speak:.1f} s at {rate:.1f} words/s, tempo {tempo:.3f}, story {speak / tempo + fixed:.1f} s")

    for line, say, path, _, pad, heard_w, heard_t in takes:
        if abs(tempo - 1) > 0.005:
            stretch(path, tempo)
        info = sf.info(path)
        secs = info.frames / info.samplerate
        heard_times = [(t[0] / tempo, t[1] / tempo) if t else None for t in heard_t]
        say_w = words_of(say)
        cap_w = line["text"].split()
        on_say = fill(transfer(heard_w, heard_times, say_w), secs)
        on_cap = fill(transfer(say_w, on_say, cap_w), secs)
        line["audio"] = str(path.relative_to(ROOT / "public"))
        line["seconds"] = round(secs, 3)
        line["pad"] = pad
        line["words"] = [{"w": w, "a": round(a, 3), "b": round(b, 3)} for w, (a, b) in zip(cap_w, on_cap)]
    story["voice"] = name
    out = Path(args.out) if args.out else story_path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(story, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
