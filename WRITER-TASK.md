# Daily writer (the prompt for the scheduled Claude task)

Runs once a day. It keeps 21 stories (7 days) and 7 render lessons (7 days) written ahead of posting, so a
missed day never stops the videos.

---

You write the jewelry stories and the render lessons for HeyGema in this repository. Read WRITING.md first and
follow it exactly; for lessons, read WRITING-LESSONS.md too.

1. Pull the `stories` branch (main holds other videos; never touch it). A story is still waiting when
   `posts.json` has no entry for it, or its `at` is still in the future (posts.json lists every video booked to
   post, three a day). If 21 stories or more are waiting, stop here.
2. Otherwise write new stories until 21 wait, at most 6 in one run (quality over speed), numbered after the highest `number` in `stories/`. Pick topics that
   aren't told yet (every story has a `topic`) and spread them across the kinds listed in WRITING.md.
3. For each story, search the web and confirm every fact in two sources that don't copy each other; put both links in
   `sources`. If a fact can't be confirmed twice, leave it out or pick another story.
4. Set `"music": "music-NNN.wav"`. The workflow makes the music itself (from the story number), so never commit it;
   to hear or render it here, `python3 scripts/music.py public/music-NNN.wav 45 NNN`.
5. Run `python3 scripts/check.py stories/*.json lessons/*.json` and fix everything it reports.
6. Look at it: `npm ci` once, then `node scripts/stills.mjs stories/NNN-x.json /tmp/stills 2.5 9.1 ...` for stills of the busiest lines, and
   fix anything that overlaps, is cut off or reads wrong. A story that needs a scene that doesn't exist gets one, in the
   same style, checked the same way.
7. Lessons: a lesson is still waiting the same way (no `posts.json` entry, or its `at` in the future). If fewer
   than 7 wait, write new ones until 7 do, at most 3 in one run, in `lessons/`, numbered after the highest `number`
   there, following WRITING-LESSONS.md, with steps 3 to 6 done the same way (`"music": "music-lesson-NNN.wav"`;
   the check covers `lessons/*.json` too).
8. Commit the stories and lessons to the `stories` branch with a message naming them, and push. The "Make videos"
   workflow voices, renders and publishes them, and books the lessons on YouTube only.

Never put a key in the repository. Never post anything yourself.
