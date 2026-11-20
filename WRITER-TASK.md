# Daily writer (the prompt for the scheduled Claude task)

Runs four times a day. It keeps three days of stories written ahead of posting (three times the number of `times` in schedule.json, never fewer
than 40: 48 at stage 1, then 72, 96 and 120) and 7 render lessons (7 days), so a missed run never stops the videos.

**The ramp (ali, 16 Nov 2026: "we need to post 40 times a day for each platform").** schedule.json `stage` says which step the
posting is at (`python3 scripts/stage.py N` sets it: 1 = 16 stories a day, 2 = 24, 3 = 32, 4 = 40). Each step waits for a clean
day (no refused post, no 429, views not falling), then the next fire after it moves up one. The platforms' own daily limits
set the most one account takes (Instagram 44 from this repo, Facebook 29, TikTok 13, YouTube 8; `caps` in schedule.json, kept by
`scripts/post.py`), so not every story goes everywhere. New stories fill the free times ahead (`fill_gaps`), so a step shows within
a day. The quality rules don't loosen: two sources for every fact, a look for each, stills of every line.

---

You write the jewelry stories and the render lessons for HeyGema in this repository. Read WRITING.md first and
follow it exactly; for lessons, read WRITING-LESSONS.md too.

1. Pull the `stories` branch (main holds other videos; never touch it). A story is still waiting when
   `posts.json` has no entry for it, or its `at` is still in the future (posts.json lists every video booked to
   post, three a day). If as many stories are waiting as the target above, stop here.
2. Otherwise write new stories until the target wait, at most 10 in one run (the stage's times a day; the quality rules don't loosen), numbered after the highest `number` in `stories/`. Pick topics that
   aren't told yet (every story has a `topic`) and spread them across the four groups in WRITING.md ("From 20 Nov 2026": names people know, diamonds, engagement and wedding rings, gold and pearls; at least 4 in 10 are names people know; no more minerals, word origins or techniques on their own).
3. For each story, search the web and confirm every fact in two sources that don't copy each other; put both links in
   `sources`. If a fact can't be confirmed twice, leave it out or pick another story.
   Then find a real picture of the subject (WRITING.md, "Pieces and pictures": the `images-tmp` job, license check, a `real`
   scene, credit) and give the story a piece and stone that fit it, different from the three stories before.
4. Pick each story's look (WRITING.md, "style and theme": rotate, never the same as either of the two stories before
   it; just rotate (the 20 Nov review found no real difference between looks on Instagram);
   never a one-ink theme) and set `"style"`, `"theme"` where it has one, a `"plate"` (the
   story's name in italics under the plate header, for the paper look; the other looks leave it out) and
   `"music": "music-NNN.wav"`. The workflow makes the music itself (from the story number), so never commit it; to hear
   or render it here, `python3 scripts/music.py public/music-NNN.wav 45 NNN bright`.
5. Run `python3 scripts/check.py stories/*.json lessons/*.json` and fix everything it reports.
6. Look at it: `npm ci` once, then `node scripts/stills.mjs stories/NNN-x.json /tmp/stills 2.5 9.1 ...` for stills of the busiest lines, and
   fix anything that overlaps, is cut off or reads wrong. A story that needs a scene that doesn't exist gets one, in the
   same style, checked the same way. Look at the story in its own look.
7. Lessons: a lesson is still waiting the same way (no `posts.json` entry, or its `at` in the future). If fewer
   than 7 wait, write new ones until 7 do, at most 3 in one run, in `lessons/`, numbered after the highest `number`
   there, following WRITING-LESSONS.md, with steps 3 to 6 done the same way (`"music": "music-lesson-NNN.wav"`;
   the check covers `lessons/*.json` too).
   Until schedule.json `series.lesson` has an `intro`: if website PR yahamh/heygema-website#135 is merged
   (`gh api repos/yahamh/heygema-website/pulls/135 --jq .merged`), set it to
   `"Jewelry rendering, step by step: https://www.heygema.com/en/jewelry-rendering"`.
8. Commit the stories and lessons to the `stories` branch with a message naming them, and push. The "Make videos"
   workflow voices, renders and publishes them, and books the lessons on YouTube only.

Never put a key in the repository. Never post anything yourself.
