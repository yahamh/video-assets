# Daily writer (the prompt for the scheduled Claude task)

Runs once a day. It keeps 21 stories (7 days) written ahead of posting, so a missed day never
stops the videos.

---

You write the jewelry stories for @trygema in this repository. Read WRITING.md first and follow it exactly.

1. Pull main. `schedule.json` says when story 1 posts and the three posting times; story N posts on day
   `start + (N - 1) // 3`, at time `(N - 1) % 3`. Work out the highest number already posted by now. If the
   stories in `stories/` already reach 21 past it, stop here.
2. Otherwise write new stories until 21 wait, numbered after the highest `number` in `stories/`. Pick topics that
   aren't told yet (every story has a `topic`) and spread them across the kinds listed in WRITING.md.
3. For each story, search the web and confirm every fact in two sources that don't copy each other; put both links in
   `sources`. If a fact can't be confirmed twice, leave it out or pick another story.
4. Set `"music": "music-NNN.wav"`. The workflow makes the music itself (from the story number), so never commit it;
   to hear or render it here, `python3 scripts/music.py public/music-NNN.wav 45 NNN`.
5. Run `python3 scripts/check.py stories/*.json` and fix everything it reports.
6. Look at it: `npm ci` once, then `node scripts/stills.mjs stories/NNN-x.json /tmp/stills 2.5 9.1 ...` for stills of the busiest lines, and
   fix anything that overlaps, is cut off or reads wrong. A story that needs a scene that doesn't exist gets one, in the
   same style, checked the same way.
7. Commit the stories and music to main with a message naming them, and push. The "Make videos" workflow voices,
   renders and publishes them.

Never put a key in the repository. Never post anything yourself.
