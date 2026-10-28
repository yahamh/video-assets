# HeyGema jewelry stories

Short animated true stories about jewelry for @trygema: 30 to 40 seconds, 1080 x 1920, three new ones a day.

- `stories/` one JSON file per story. How to write one: [WRITING.md](WRITING.md). Check with `python3 scripts/check.py stories/*.json`.
- `src/` the video, made with Remotion: scenes in `src/scenes/`, people in `src/people/`, captions and frame in `src/Frame.tsx`.
- `scripts/voice.py` reads each line aloud (Chatterbox, MIT), checks the take with Whisper and times the captions. Voices in `voices.json`.
- `scripts/render.mjs` makes the MP4 and evens out the sound. `scripts/music.py` and `scripts/sfx.py` make the music and sounds from scratch.
- `.github/workflows/make.yml` makes every new story and publishes it as a release named after the story.
- `.github/workflows/samples.yml` makes the stories in `samples.json` in several voices, to compare them.

Every voice is a made-up voice; none copies a real person. No keys live in this repository.
