# Writing a render lesson

A render lesson teaches one thing about how jewelry is made, in 30 to 45 seconds, shown with real HeyGema renders.
One goes out a day, on YouTube only (16:00 UTC; `schedule.json` "series"). A lesson is one JSON file in `lessons/`;
`scripts/check.py` checks it before it's made. Everything in [WRITING.md](WRITING.md) under "How it should sound"
applies here too: read it first.

## What makes a good one

- **One thing, taught properly.** A setting, a metal, a step of making a piece, a stone cut, a hallmark. By the end
  the viewer can explain it to someone else. Every fact comes from two sources that don't copy each other (GIA, the
  World Gold Council, a casting supplier's guide, an encyclopedia); put both links in `sources`. When sources
  disagree, say "about", give the range, or leave it out.
- **Shown with real renders.** Every picture comes from `public/renders/` (list below). Never a made-up image, never
  a picture that claims more than it shows: don't call a stone "0.01 carat" on a ring where nobody knows the weight
  unless the line says "often", and don't show an eternity band while talking about pavé.
- **The hook is the first frame**, as in WRITING.md: `hook.text` is 7 words or fewer, names the thing ("rose gold",
  "pavé", "the mold"), and the first line reads it out word for word. The first scene is `compare` (the 3D file
  turning into its render) or `photo` (the render itself), and it sits under the hook words by itself.
  Good: "This pink comes from copper." "This ring's mold only works once." "This ring is paved like a street."
- **Pay it off, then tie it to the render.** The second to last sentence answers the hook. The last one says, plainly,
  what the render did for the piece ("so a client can pick the gold before anything is cast"). Once, at the end, never
  a sales pitch, never a price, never how long a render takes, never "AI", never "100% identical".
- **Pace.** About 105 to 120 spoken words, 9 to 12 lines, a new picture every line. A caption line is 12 words at most.

## Picking lessons

Spread them across: settings (prong, bezel, channel, halo, pavé, tension), metals (gold colors, karats and stamps,
platinum, rhodium), making (CAD, 3D printing, casting, stone setting, polishing, engraving), stones (cuts, melee,
lab and mined), and reading a render (views, shadows, what a client checks). Never repeat a `topic`, and never
remake the tutorials already on YouTube: a Rhino .3dm to a render, a CAD screenshot to a render, refining a render,
an engagement ring render, KeyShot alternatives, hiring a render artist, render software compared, client approval.

## The file

```json
{
  "id": "lesson-004-bezel-setting",
  "series": "lesson",
  "number": 4,
  "title": "What a bezel setting is",
  "topic": "bezel setting",
  "music": "music-lesson-004.wav",
  "hook": { "text": "...", "gold": ["..."] },
  "end": { "line": "Renders made with", "handle": "HeyGema" },
  "lines": [ { "text": "...", "say": "...", "scene": { "kind": "compare", "before": "x-input.webp", "after": "x-render.webp" } } ],
  "post": { "youtube_title": "What a bezel setting is", "caption": "Two or three plain sentences.", "hashtags": ["#jewelrymaking", "..."] },
  "sources": ["https://...", "https://..."]
}
```

`youtube_title` is 10 to 70 characters, no hashtags: say what the viewer learns. The caption is the YouTube
description: what the lesson taught in two or three sentences, and "The renders in this video were made with
HeyGema." Brand voice (/mnt/project-files/style/brand-voice.md when you have it): plain, no hype, no exclamation marks.

## Scenes for lessons

All the story scenes work (`title` is good for one big number: "730°C", "6,000 years"). These show the renders:

| kind | what it shows | options |
| --- | --- | --- |
| `photo` | one picture on a white card, slowly pushing in | `src`, `label` (line above), `focus` {x, y, k}: push in k times toward a point (x, y from 0 to 1 across the picture), `marks` [{x, y, text, at}]: a dot and a tag, up to 4 |
| `compare` | the 3D file, then the render wipes in over it | `before`, `after`, `at` (when the wipe starts), `beforeLabel` ("3D file"), `afterLabel` ("Render") |
| `grid` | two to four pictures, popping in | `srcs`, `labels`, `label` (not with four) |
| `steps` | a numbered list with the current step lit | `items` (up to 6 short words), `active` (0 is the first), `label` |
| `mix` | what a metal is made of: a bar filling part by part under the render | `parts` [{name, pct}] (Gold, Silver, Copper, Palladium, Nickel, Zinc, Platinum get their own color), `src`, `label` |

Don't put `steps` on more than two lines in a row: break it up with a `title` or a `photo`.

## The renders (public/renders/)

Real HeyGema renders from heygema.com, mostly 976 x 976 on white. `-input`, `-cad`, `-wireframe` and `-still` are
views of the 3D file; the matching `-render` is what HeyGema made from it.

- `matthew-rose-input` / `matthew-rose-render`: solitaire, rose gold. `render-matthew-yellow`: the same angle in
  yellow gold. `matthew-front-white-input` / `-render`: a solitaire from the front, white gold. `viewer-matthew-gold`:
  the 3D file in the viewer.
- `mix585-front-input` / `mix585-front-render`, `mix585-still-three-quarter` (green 3D file), and
  `mix585-render-front`, `-side`, `-top`, `-back`, `-three-quarter`: one emerald-cut ring with a pavé band and a
  matching band, every view.
- `ring-1d-input` / `ring-1d-render` (white gold) and `ring-1d-yellow-input` / `-render`: a dome ring with a pavé top.
- `bridal-cad` / `bridal-render`: a bridal set with marquise side stones. `cad-wireframe` / `cad-render`: a sapphire
  solitaire with pavé shoulders. `eternity-cad` / `eternity-render`: a full eternity band. `signet-cad` /
  `signet-render`: a band with a row of sapphires. `pendant-pear-input` / `-render`: a pear sapphire pendant with a halo.
  `earrings-input` / `-render`: pearl drops. `refine-before` / `refine-after`: one render before and after a change.

To add more, copy real renders only (the website's `public/` folder in yahamh/heygema-website has them), never a
client's own file, and list them here.
