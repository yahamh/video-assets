#!/usr/bin/env bash
# Makes one gem size Short end to end and leaves it in uploads/ ready to push: scripts/gemsize_make.sh oval [A|B]
# Needs the Kokoro venv (KOKORO_PY, default /tmp/kokoro/bin/python with kokoro-onnx, soundfile, pyloudnorm, scipy), the model
# files in $KOKORO_MODEL (default /tmp/kokoro-model), ffmpeg, node_modules, and REMOTION_CHROME for the headless shell.
# See gemsize/README.md.
set -euo pipefail
shape=$1; hook=${2:-A}
py=${KOKORO_PY:-/tmp/kokoro/bin/python}
mkdir -p out uploads
"$py" scripts/gemsize.py "$shape" --hook "$hook" --out "out/gs-$shape.json"
id=$(jq -r .id "out/gs-$shape.json"); n=$(jq -r .number "out/gs-$shape.json")
"$py" scripts/music.py "public/music-gemsize-$(printf %02d "$n").wav" 28 $((700 + n)) bright
node scripts/render.mjs "out/gs-$shape.json" "uploads/$id.mp4" GemSize
jq '{id, number, title: .post.youtube_title, hookVariant, hook: {text: .hook.text}, post}' "out/gs-$shape.json" > "uploads/$id.json"
echo "uploads/$id.mp4 and uploads/$id.json are ready"
