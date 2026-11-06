# Gem size Shorts

"How big is a 1 carat oval?" and the other eleven shapes (6 Nov 2026, from the gem size thread's brief
`/mnt/project-files/seo/gem-size/video-brief-shorts.md`; the plan is `.../plan.md`). Each is a 21 s 9:16 Short on YouTube, one a
day at 17:00 UTC (`schedule.json` series `gemsize`, ids `gs-NN-shape` in `uploads/`).

- `numbers.json`: every number on screen and in the voice (a copy of the gem size thread's `video-assets/numbers.json`: the page
  numbers and the video numbers must match, so change it there first).
- `public/gemsize/`: the stone and finger artwork (the thread's SVGs without their C2PA block, `scripts/gemsize_assets.py`) and
  `manifest.json` (each stone's size, centre and outline).
- `src/gemsize/GemSize.tsx`: the Remotion composition `GemSize`. A purple panel on top holds the words, the artwork is below, nothing
  important is in the bottom fifth or the right edge. Five pictures, one per voice line: the hook (the 1 carat stone on a size 6 finger),
  the 1, 2 and 3 carat stones at one scale, the 2 carat stone on the finger and its share of the width, "same carat" (the length to width
  ratio for oval, emerald, radiant, pear, marquise, baguette and cushion; the depth that hides weight for the others) and the answer.
- `scripts/gemsize.py`: builds a Short's lines from `numbers.json` and reads them with Kokoro `af_heart`. `scripts/gemsize_make.sh oval`
  does everything (voice, music, render) and leaves `uploads/gs-01-oval.mp4` and `.json`; push both to the `stories` branch and the
  "Make videos" run books it.
- Hook A is the default ("How big is a 1 carat {shape}?", "1 carat emerald cut, how big?" for emerald cut and Asscher). Hook B, "Twice the
  carat. Only {N} mm longer.", is `gemsize_make.sh oval B`; test it a few days apart from A.
- Rules: no gem sizer in the video or the description (the sizer is team only), no dashes, no exclamation marks, no prices, "Hey Gemma" if
  the voice ever says the name and "HeyGema" on screen. The description has the shape's chart page with
  `?utm_source=youtube&utm_medium=shorts&utm_campaign=gem_size_shorts` and "Estimates for a well-cut stone."
