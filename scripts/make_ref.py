"""Makes a reference voice for Chatterbox from one of Kokoro's made-up voices (Apache-2.0), so no real person's voice is copied.

Usage: python scripts/make_ref.py MODEL_DIR KOKORO_VOICE OUT.wav [SPEED]
MODEL_DIR holds kokoro-v1.0.onnx and voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
"""
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

model, voice, out = sys.argv[1:4]
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 0.95
TEXT = (
    "The stone sat in a plain wooden box for three weeks. Nobody in the shop knew what it was worth. "
    "Then one morning, an old man walked in, looked at it once, and asked the price."
)
k = Kokoro(f"{model}/kokoro-v1.0.onnx", f"{model}/voices-v1.0.bin")
audio, sr = k.create(TEXT, voice=voice, speed=speed, lang="en-gb" if voice.startswith("b") else "en-us")
loud = np.where(np.abs(audio) > 0.01)[0]
audio = audio[max(loud[0] - int(0.05 * sr), 0) : loud[-1] + int(0.2 * sr)]
sf.write(out, (audio / np.abs(audio).max() * 0.8).astype(np.float32), sr)
print(f"{out}: {len(audio) / sr:.1f} s")
