// The balance between the voice and the other sounds (ali, 5 Nov 2026: "the opening sound is too loud, we can't hear the voice").
//
// The voice is read at -18 LUFS and played as it is. Every other sound is shaped to sit under it:
//  - TRIM brings the loud sound files down. Measured on the files in public/sfx, the loudest 0.3 s of the boom is -3 dB,
//    the impact -6 dB, the horn -7 dB, the heartbeat -9 dB, against about -17 dB for the voice, so a boom at the first frame
//    was louder than the first words. TRIM is the gain that puts the loudest 0.3 s of every file at -17 dB or lower.
//  - DUCK lowers all of them (the music keeps its own level) to this share of their volume while the voice speaks, with a
//    short ramp at each end, so a hit still shows between two lines but never covers a word.
export const TRIM: Record<string, number> = {
  boom: 0.21,
  impact: 0.3,
  horn: 0.32,
  heartbeat: 0.41,
  bell: 0.56,
  thump: 0.63,
  whoosh: 0.63,
  creak: 0.71,
  shimmer: 0.8,
  whoosh2: 0.82,
  stamp: 0.9,
  steps: 0.92,
};

export const DUCK = 0.45;
const RAMP = 0.12;

// Gain (DUCK..1) at `sec` seconds into the video, given the spans [from, to] where the voice speaks.
export const duck = (sec: number, spans: readonly (readonly [number, number])[]) => {
  let k = 0;
  for (const [a, b] of spans) k = Math.max(k, Math.min(1, (sec - a + RAMP) / RAMP, (b + RAMP - sec) / RAMP));
  return 1 - (1 - DUCK) * Math.max(0, k);
};

// The music (own volume, 0.16 of its file) goes a third lower while a line is read, and comes back between lines.
export const musicDuck = (sec: number, spans: readonly (readonly [number, number])[]) => 0.7 + (0.3 * (duck(sec, spans) - DUCK)) / (1 - DUCK);
