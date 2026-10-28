# HeyGema jewelry stories

Short animated true stories about jewelry for @trygema: 30 to 40 seconds, 1080 x 1920, three new ones a day.

- `stories/` one JSON file per story. How to write one: [WRITING.md](WRITING.md). Check with `python3 scripts/check.py stories/*.json`.
- `src/` the video, made with Remotion: scenes in `src/scenes/`, people in `src/people/`, captions and frame in `src/Frame.tsx`.
- `scripts/voice.py` reads each line aloud (Chatterbox, MIT), checks the take with Whisper and times the captions. Voices in `voices.json`.
- `scripts/render.mjs` makes the MP4 and evens out the sound. `scripts/music.py` and `scripts/sfx.py` make the music and sounds from scratch.
- Everything lives on the `stories` branch of this repo (main holds other videos). `.github/workflows/make.yml` makes every new story and publishes it as a release named after the story.
- `scripts/post.py` runs at the end of each make run and books every finished video in Zernio for Instagram, TikTok
  and YouTube, three a day at the times in `schedule.json` (UTC). `posts.json` lists what's booked and when.
  Each run also records in `posts.json` how the posts that were due went out (a failed one fails the run once).
  It needs the `ZERNIO_API_KEY` repository secret; `"paused": true` in `schedule.json` stops new bookings.
- `.github/workflows/samples.yml` makes the stories in `samples.json` in several voices, to compare them.

Every voice is a made-up voice; none copies a real person. No keys live in this repository.
