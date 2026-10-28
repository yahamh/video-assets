#!/usr/bin/env bash
# Makes any reference voice in voices.json that isn't in voices/ yet, from Kokoro's made-up voices (see make_ref.py).
# Kokoro needs numpy 2 and Chatterbox numpy 1, so Kokoro gets its own venv.
set -euo pipefail
declare -A KOKORO=([voices/ref-jack.wav]=am_onyx)
todo=()
for ref in "${!KOKORO[@]}"; do [ -f "$ref" ] || todo+=("$ref"); done
[ ${#todo[@]} -eq 0 ] && exit 0
python -m venv /tmp/kokoro
/tmp/kokoro/bin/pip install -q kokoro-onnx==0.4.9 soundfile==0.14.0
mkdir -p /tmp/kokoro-model
base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
curl -sSfL -o /tmp/kokoro-model/kokoro-v1.0.onnx "$base/kokoro-v1.0.onnx"
curl -sSfL -o /tmp/kokoro-model/voices-v1.0.bin "$base/voices-v1.0.bin"
for ref in "${todo[@]}"; do /tmp/kokoro/bin/python scripts/make_ref.py /tmp/kokoro-model "${KOKORO[$ref]}" "$ref"; done
