import type { Timed } from "./Frame";

// One story (or lesson) = an ordered list of lines. Each line is one stretch of voice, its captions, and one scene.
export type SceneSpec = { kind: string; [param: string]: unknown };
export type Sfx = { at: number; name: string; vol?: number };

export type Line = {
  text: string; // the caption
  say?: string; // what the voice reads, when it differs from the caption (numbers spelled out, for example)
  audio?: string; // public/ path of this line's voice
  seconds?: number; // length of that voice, filled in by the voice step
  pad?: number; // silence after the voice, filled in by the voice step (0 when the next line was read in the same breath)
  words?: Timed[]; // when each caption word is said, filled in by the voice step when it can tell
  hold?: number; // extra seconds on this scene after the line is read
  sfx?: Sfx[]; // extra sound effects, seconds from the line's start
  scene: SceneSpec;
};

export type Story = {
  id: string;
  series?: string; // "lesson" for the render lessons (lessons/), left out for the jewelry stories
  number: number;
  title: string;
  lines: Line[];
  music?: string;
  hook?: { text: string; gold?: string[] }; // big words on the first frame, shown while the first line is read
  end?: { line?: string; handle?: string };
  post?: { caption: string; hashtags: string[] };
  sources: string[];
};

const READ_WPS = 3.4; // about how fast voice A reads
export const PAD_S = 0.25;
export const END_S = 2.0;

export const speakSeconds = (l: Line) => l.seconds ?? (l.say ?? l.text).split(/\s+/).length / READ_WPS;
export const lineSeconds = (l: Line) => speakSeconds(l) + (l.pad ?? PAD_S) + (l.hold ?? 0);

export type Slot = { line: Line; start: number; len: number };

export const timeline = (story: Story) => {
  let at = 0;
  const slots: Slot[] = story.lines.map((line) => {
    const len = lineSeconds(line);
    const slot = { line, start: at, len };
    at += len;
    return slot;
  });
  return { slots, endStart: at, total: at + END_S };
};
