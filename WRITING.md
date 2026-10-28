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
  - Don't answer the hook until the end. Plant a second, smaller question halfway ("But that wasn't the strange part.").
- **Open loops.** Raise a question and make people wait for the answer: "And it was no accident." "But their box held
  a fake." "He struck." Close every loop before the end. One or two loops a story, not five.
- **Fast.** One short line per scene, mostly 4 to 9 words, never more than 12. About 85 to 105 spoken words in all,
  12 to 16 lines. No line that only sets the mood.
- **A real ending.** The last line pays the story off with a concrete fact people can repeat ("The two biggest are in
  the British Crown Jewels today."). No "follow for more": the end card already says "A new jewelry story every day".

## How it should sound

Like a friend telling you something they just read, not like a narrator or an ad.

- Plain, short sentences. US spelling. Contractions are good.
- Names, places, numbers. "3,106 carats" beats "enormous".
- No dashes and no exclamation marks.
- None of these, ever: imagine, little did they know, in a world, here's the twist, fast forward, delve, tapestry,
  testament, shrouded, legendary, iconic, stunning, breathtaking, exquisite, timeless, masterpiece, you won't believe,
  let that sink in, wait for it. No "AI" anywhere, and no sales pitch for HeyGema in the story.
- `say` is what the voice reads when it differs from the caption: write every number, year and Roman numeral out
  ("In nineteen oh five", "Edward the Seventh", "three thousand, one hundred and six"), and spell hard names the way
  they sound.

## Picking stories

- Spread them out: famous stones, heists and thefts, royal jewels, the makers (Cartier, Faberge, Tiffany, Lalique,
  Van Cleef), lost and found, wedding and engagement customs, pearls and the sea, ancient and buried treasure, gems in
  wars and on ships, science made simple (how a pearl forms, why a ruby is red), and what happened on this day.
- `topic` names the jewel or event in a few words ("cullinan diamond", "louvre heist 2025"). `check.py` refuses a
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
  "topic": "hope diamond",
  "music": "music-014.wav",
  "hook": { "text": "The hook, seven words or fewer.", "gold": ["word"] },
  "end": { "line": "A new jewelry story every day", "handle": "@trygema" },
  "lines": [
    { "text": "Caption text.", "say": "Optional: what the voice reads.", "hold": 0.3, "scene": { "kind": "parcel", "glow": true } }
  ],
  "post": { "caption": "One or two lines that make people want the answer.", "hashtags": ["#jewelryhistory", "..."] },
  "sources": ["https://...", "https://..."]
}
```

- `hold` adds seconds after a line, for a beat after a cliffhanger ("He struck.").
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
| hook | the opening shot only: the payoff, big and moving from frame one (a stone rising out of a parcel or a chest, a rough stone, a cut gem) |
| cast | 1 to 3 people of the story in a setting (mine, ship, palace, workshop, street, study, vault, plain), with a name card. Looks in `src/people/Person.tsx` |
| parcel | a plain parcel under a light; a stamp can slam on |
| mine | an open mine at night, the rough stone, a carat count |
| ship | a steamship at night with guards around a chest |
| reveal | a chest opens on a rough stone, a gem, a fake or nothing |
| journey | a route drawn across a chart, with a parcel, ship, train or plane |
| gift | a royal gift on a cushion with a handwritten tag |
| cut | a cutter's bench: the blade waits, strikes, or the cut stones in a row |
| crown | a crown and sceptre with labels |
| jewel | one piece close up: ring, necklace, earrings, brooch, tiara |
| portrait | a painted portrait in a gilt frame |
| stranger | a figure under a street lamp in fog |
| title | words alone, for a date or a line that needs room (never first) |

People carry the story: show them whenever the line is about someone. When a story needs something no scene shows,
add a scene in `src/scenes/` in the same dark and gold style, register it in `src/Story.tsx`, and check it with
`node scripts/stills.mjs` before using it.
