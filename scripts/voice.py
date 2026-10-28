"""Voice for a story: reads each line aloud, checks it was read right, and notes when each caption word is said.

Usage: python scripts/voice.py stories/001-cullinan.json [--voice NAME] [--out PATH]

The voices are in voices.json. Each line's `say` (or its `text`) is read with Chatterbox (MIT), then
transcribed with faster-whisper. A line that comes back garbled, too fast or too slow is read again with
another seed, up to TRIES times, and the best take is kept. The takes go to public/voice/<story>/<voice>/NN.wav
and the story JSON gets each line's audio, seconds and words (caption word timings, in seconds from the line's start).
If the whole story runs past MAX_S, every line is sped up by the same amount (pitch kept) to fit.
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
MAX_S = 39.5  # longest a story may run, end card included
END_S, PAD_S = 2.0, 0.18  # must match src/story.ts
MAX_TEMPO = 1.15
LUFS = -18.0


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


def trim(wav, sr, before=0.03, after=0.09):
    """Cuts the silence around the voice, keeping a breath of room."""
    frame = int(0.01 * sr)
    n = len(wav) // frame
    if n == 0:
        return wav
    rms = np.sqrt(np.mean(wav[: n * frame].reshape(n, frame) ** 2, axis=1) + 1e-12)
    loud = np.where(rms > rms.max() * 10 ** (-38 / 20))[0]
    if not len(loud):
        return wav
    a = max(0, loud[0] * frame - int(before * sr))
    b = min(len(wav), (loud[-1] + 1) * frame + int(after * sr))
    return wav[a:b]


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
    """Speeds a take up without changing its pitch (ffmpeg rubberband, else atempo)."""
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
    takes = []
    for i, line in enumerate(story["lines"]):
        say = line.get("say") or line["text"]
        path = out_dir / f"{i + 1:02d}.wav"
        best = None
        for k in range(TRIES):
            wav = trim(reader.read(say, args.seed + 1000 * k + i), reader.sr)
            wav = loudness(wav, reader.sr)
            sf.write(path, wav, reader.sr)
            heard, times = ear.hear(path)
            secs = len(wav) / reader.sr
            rate = len(words_of(say)) / max(secs, 0.1)
            s = score(heard, say, line["text"])
            ok = s >= MIN_SCORE and RATE[0] <= rate <= RATE[1]
            print(f"line {i + 1:2d} take {k + 1}: heard {s:.2f}, {rate:.1f} words/s, {secs:.2f} s {'ok' if ok else 'again'}", flush=True)
            if best is None or (ok, s) > (best["ok"], best["score"]):
                best = {"ok": ok, "score": s, "wav": wav, "heard": heard, "times": times}
            if ok:
                break
        if not best["ok"]:
            print(f"line {i + 1}: no clean take, keeping the best ({best['score']:.2f}): {say!r} heard {' '.join(best['heard'])!r}", file=sys.stderr)
        sf.write(path, best["wav"], reader.sr)
        takes.append((line, say, path, best))

    # Fit the story into MAX_S by speeding every line up the same amount.
    speak = sum(len(t[3]["wav"]) / reader.sr for t in takes)
    fixed = sum(PAD_S + (t[0].get("hold") or 0) for t in takes) + END_S
    tempo = voice.get("tempo", 1.0)
    if speak / tempo + fixed > MAX_S:
        tempo = min(MAX_TEMPO, speak / (MAX_S - fixed))
    print(f"voice {speak:.1f} s, tempo {tempo:.3f}, story {speak / tempo + fixed:.1f} s")

    for line, say, path, best in takes:
        if abs(tempo - 1) > 0.005:
            stretch(path, tempo)
        info = sf.info(path)
        secs = info.frames / info.samplerate
        heard_times = [(a / tempo, b / tempo) for a, b in best["times"]]
        say_w = words_of(say)
        cap_w = line["text"].split()
        on_say = fill(transfer(best["heard"], heard_times, say_w), secs)
        on_cap = fill(transfer(say_w, on_say, cap_w), secs)
        line["audio"] = str(path.relative_to(ROOT / "public"))
        line["seconds"] = round(secs, 3)
        line["words"] = [{"w": w, "a": round(a, 3), "b": round(b, 3)} for w, (a, b) in zip(cap_w, on_cap)]
    story["voice"] = name
    out = Path(args.out) if args.out else story_path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(story, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
