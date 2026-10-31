# Writing a jewelry story

Each video tells one true jewelry story in 30 to 40 seconds, for people who love jewelry. Three go out every day,
and every one is a new story. A story is one JSON file in `stories/`; `scripts/check.py` checks it before it's made.

## What makes a good one

- **True, and checked.** Every fact comes from two sources that don't copy each other (a museum, a news outlet, a
  book, an encyclopedia). Put both links in `sources`. When sources disagree, use what both say or leave it out.
  Never make up a quote, a name, a date or a number. A legend (a curse, a myth) is told as a legend: "people said".
- **The hook is the first frame.** People decide in about a second, often with the sound off, so the first frame has
  to say why to keep watching. Three parts, all pointing at the same question:
  - `hook.text`: the strangest true fact in 7 words or fewer, big at the top from frame one ("They mailed the
    biggest diamond ever found."). Put the jewel's name or kind in it ("diamond", "pearl", "tiara"): TikTok searches
    on-screen text. `hook.gold` lists the one or two words that carry the surprise.
  - The first line is read out as the same words, so voice and text agree. No date first, no "Have you ever", no
    question the viewer can answer, no greeting.
  - The first scene is `hook`: the payoff itself, big and already moving (the stone rising out of the parcel), never
    the setup. Show the most striking thing in the story.
  - Don't answer the hook until the end. Halfway, let a fact raise a new question by itself ("His first blow snapped
    the steel knife."). Never a teaser line that only promises something ("But that wasn't the strange part.").
- **Keep it moving with facts, not teasers.** Each sentence adds something new: a name, a number, what happened next.
  Lines like "And it was no accident." or "He struck." are how machine-written stories fake suspense; people hear it.
- **Pace.** About 95 to 110 spoken words, 11 to 15 lines. A caption line is 12 words at most, and a sentence may run
  across two lines (end the first on a comma); the voice reads it in one breath. No line that only sets the mood.
- **A real ending.** The last line pays the story off with a concrete fact people can repeat ("The two biggest are in
  the British Crown Jewels today."). No moral, no lesson, no "follow for more": the end card already says "A new
  jewelry story every day".

## How it should sound

Like a friend telling you something they just read, not like a narrator, an ad or a machine. ali, 28 Oct: the first
script "sounds very AI". These rules come from Wikipedia's "Signs of AI writing" guide, tropes.fyi's list of machine
writing habits, broadcast "write for the ear" rules (IJNet) and voiceover guides (Fliki, Lilach Bullock). The first
Cullinan script broke most of them; its lines are the "before" examples. `check.py` catches the ones a script can.

1. **No strings of fragments.** "In a plain box." "Nine large stones. 96 small ones." Short punchy fragments for
   forced drama are the loudest sign of machine writing. Most sentences run 7 to 15 words; a short one now and then
   lands harder because the others aren't. At most one sentence under four words in a story.
2. **No teaser lines.** "And it was no accident." "He struck." "Here's the thing." "The result?" Say what happened
   instead ("His first blow snapped the steel knife."). No question you answer yourself, no question marks at all.
3. **No "not X, but Y"** and no "it's not just X". Say the thing itself.
4. **No lists of three** made to sound complete ("rare, old, and priceless"). Keep the real number of things, or
   pick the one that matters.
5. **Plain verbs.** "is", "was", "had". Never "serves as", "stands as", "boasts".
6. **Words people don't say out loud:** imagine, little did they know, in a world, delve, tapestry, testament,
   shrouded, legendary, iconic, stunning, breathtaking, exquisite, timeless, masterpiece, vibrant, nestled, pivotal,
   captivating, intricate, crucial, rich history, quietly, you won't believe, let that sink in, wait for it. No "AI"
   anywhere, and no sales pitch for HeyGema in the story.
7. **Specific beats grand.** Names, places, numbers people can picture: "eighteen feet down a South African mine",
   "about four inches long". Round a number when the exact one doesn't matter ("over three thousand carats"). Never
   "experts say": say who.
8. **One small human touch.** An understatement or a plain opinion, once: "It got there fine." Not a joke, not a lesson.
9. **Same name for the same thing.** Once it's "the box", it stays "the box", not "the parcel" and "the package".
10. **Talk.** Contractions, "so", "then", "and". US spelling. No dashes and no exclamation marks.
11. **Read it out loud.** If you wouldn't say a line to a friend over coffee, rewrite it.

`say` is what the voice reads when it differs from the caption: write every number, year and Roman numeral out
("in nineteen oh five", "Edward the Seventh", "three thousand"), and spell hard names the way they sound.

## Picking stories

- Bright and positive (ali, 30 Oct 2026: "brighter positive stories"): pick stories that leave people smiling, such as
  love and gifts, a maker's breakthrough, a lucky find, a lost ring returned, a record stone, a clever craft, a
  tradition. No heists, thefts, curses or tragedies as the story; hard history still comes up plainly when it's part
  of a happy story. The last lines land on the warm part (the gift given, the ring back on a finger).
- Spread them out: famous stones, royal jewels, the makers (Cartier, Faberge, Tiffany, Lalique, Van Cleef), lost and
  found, wedding and engagement customs, pearls and the sea, ancient and buried treasure, science made simple (how a
  pearl forms, why a ruby is red), and what happened on this day.
- `topic` names the jewel or event in a few words ("cullinan diamond", "mikimoto cultured pearl"). `check.py` refuses a
  topic that was told before.
- People in the story are drawn as simple figures in the clothes of their time, never a likeness. Living private
  people stay unnamed. Nobody is called a thief unless a court said so. Hard history (mines, wars, slavery, deaths)
  is told plainly and with respect, never as a joke.

## The file

```json
{
  "id": "014-hope-diamond",
  "number": 14,
  "title": "Short title for us",
  "style": "paper",
  "plate": "The Hope Diamond",
  "topic": "hope diamond",
  "music": "music-014.wav",
  "hook": { "text": "The hook, seven words or fewer.", "gold": ["word"] },
  "end": { "line": "A new jewelry story every day", "handle": "HeyGema" },
  "lines": [
    { "text": "Caption text, a sentence or the first part of one,", "say": "Optional: what the voice reads.", "hold": 0.3, "scene": { "kind": "parcel", "glow": true } }
  ],
  "post": { "caption": "One or two lines that make people want the answer.", "hashtags": ["#jewelryhistory", "..."] },
  "sources": ["https://...", "https://..."]
}
```

- `style`: always `"paper"`. Since story 014 (ali, 30 Oct 2026: "brighter positive stories", from a reel he sent,
  `/mnt/project-files/revamp/stories/reel-style/`) the stories are drawn on warm cream paper: one big painted shape
  per scene in a bright color, the subject flat on it, thin white line work, confetti, small typed captions, the hook
  in big italic capitals, bright plucks and a major-key tune. `src/paper/` draws it. Stories 007 to 013 are low-poly
  3D (`"lowpoly"`, `src/lp/`) and stay that way. The check refuses a new story without `"paper"`.
- `plate`: the story's name in italics under the plate header at the top ("JEWELRY STORY XIV"), like a plate in an
  old science book: a few words, title case ("Crater of Diamonds").
- `color` on a scene picks its painted shape's color: `#ec6a9c` pink, `#f0552e` coral, `#c8dc3c` lime, `#4cc3a8`
  mint, `#5bb4e8` sky, `#f7c23a` sun, `#a98be0` lilac. Give neighbouring scenes different ones; left out, the scene
  picks one from its settings.
- `hold` adds seconds of silence after a line. Use it rarely, for a beat the story has earned.
- `sfx` adds sounds to a line: `[{ "at": 0.4, "name": "impact" }]` with seconds from the line's start. Names: whoosh,
  whoosh2, impact, boom, riser, shimmer, stamp, horn, waves, crack, heartbeat, creak, steps. Scenes already add their
  own sounds.
- Music: always `"music-NNN.wav"` with the story's number. The workflow makes it from the number, so each story gets
  its own; it's never committed.
- Hashtags: 3 to 6, specific to the story, different from the last few stories.

## Scenes

Each line shows one scene. The options are at the top of each file in `src/scenes/`:

| kind | what it shows |
| --- | --- |
| hook | the opening shot only: the payoff, big and moving from frame one (a stone rising out of a parcel or a chest, a rough stone, a cut gem, a pear-shaped pearl, a gold Easter egg; `halo` for a stone that glows) |
| cast | 1 to 3 people of the story in a setting (mine, ship, palace, workshop, street, study, vault, plain), with a name card. Looks in `src/people/Person.tsx` (`mask: true` covers nose and mouth) |
| parcel | a plain parcel under a light; a stamp can slam on |
| mine | an open mine at night, the rough stone, a carat count |
| ship | a steamship at night with guards around a chest |
| reveal | a chest opens on a rough stone, a gem, a pearl, an egg, a fake or nothing; `light` colors the lamp, `dark` turns it off, `halo` makes the item glow |
| journey | a route drawn across a chart, with a parcel, ship, train or plane |
| gift | a royal gift (a stone or an egg) on a cushion with a handwritten tag |
| cut | a cutter's bench: the blade waits, snaps, strikes, or the cut stones in a row (each can have a `tone`) |
| crown | a crown and sceptre with labels |
| jewel | one piece close up: ring, necklace, earrings, brooch, tiara; a necklace can hang a pearl (`drop: "pearl"`) |
| portrait | a painted portrait in a gilt frame |
| stranger | a figure under a street lamp in fog; `darkAt` puts the lights out |
| title | words alone, for a date or a line that needs room (never first) |

People carry the story: show them whenever the line is about someone. The options are the same in the paper look;
each scene's paper version is in `src/paper/scenes.tsx` (listed in `registry.ts`, with the shared pieces in
`kit.tsx`, the things in `things.tsx` and the people in `people.tsx`). The paper look adds a few options:

- `cast`: whole figures standing in a place; settings palace, workshop, street, study, garden, field, lab, mine,
  ship, vault or plain; outfit `casual` and props `ringbox`, `shovel`, `carrot` on top of the drawn ones.
- `hook`: `show` can also be `ring` (with `prongs`, `metal`), `carrot`, `opal` or `round-pearl`.
- `mine`: `ground: "field"` for a plowed field instead of a hill; leave out `carats` and set `zoomAt` past 1 for
  the ground alone.
- `jewel`: `prongs` (4 or 6), `halo` and `empty` (a ring with no stone yet) for a ring; and pieces `spheres` (opal's
  silica spheres, `size: "small"` for small ones), `opal` and `carrot` (a carrot grown through a ring). It is drawn
  like a plate in a science book, with the stone again in a square lens.
- `reveal`, `gift`: items and stones can also be `ring`, `opal`, `carrot`, `round-pearl`.
- `cut`: a piece can take `size` (0 to 1) when it has no carats, and `shape: "rough"` for an uncut crystal.

When a story needs something no scene shows, add it in `src/paper/` (and register it), and check it with
`node scripts/stills.mjs` before using it. Low-poly scenes (`src/lp/`) and the drawn ones (`src/scenes/`) stay for
the older stories and the lessons.
