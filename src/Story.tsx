import React, { useEffect, useState } from "react";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/700-italic.css";
import "@fontsource/playfair-display/900.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/instrument-serif/400-italic.css";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BG, FPS, clamp, easeOut, prog } from "./look";
import { Badge, Captions, HookText, Overlay, chunk, timeWords } from "./Frame";
import { Story, speakSeconds, timeline } from "./story";
import { sceneSfx } from "./sfx";
import { SceneProps } from "./scenes/types";
import { Parcel } from "./scenes/Parcel";
import { Mine } from "./scenes/Mine";
import { Ship } from "./scenes/Ship";
import { Gift } from "./scenes/Gift";
import { Cut } from "./scenes/Cut";
import { Crown } from "./scenes/Crown";
import { End } from "./scenes/End";
import { Reveal } from "./scenes/Reveal";
import { Journey } from "./scenes/Journey";
import { Stranger } from "./scenes/Stranger";
import { Title } from "./scenes/Title";
import { Jewel } from "./scenes/Jewel";
import { Portrait } from "./scenes/Portrait";
import { Cast } from "./scenes/Cast";
import { Hook } from "./scenes/Hook";
import { Photo } from "./scenes/Photo";
import { Compare } from "./scenes/Compare";
import { Grid } from "./scenes/Grid";
import { Steps } from "./scenes/Steps";
import { Mix } from "./scenes/Mix";
import { LpEnd } from "./lp/scenes";
import { lowPolyScene } from "./lp/registry";
import { paperScene } from "./paper/registry";
import { PaperEnd } from "./paper/scenes";
import { PaperBadge, PaperCaptions, PaperHook, PaperOverlay } from "./paper/frame";
import { CREAM, PAPER } from "./paper/kit";

export const SCENES: Record<string, React.FC<SceneProps>> = {
  parcel: Parcel,
  mine: Mine,
  ship: Ship,
  gift: Gift,
  cut: Cut,
  crown: Crown,
  reveal: Reveal,
  journey: Journey,
  stranger: Stranger,
  title: Title,
  jewel: Jewel,
  portrait: Portrait,
  cast: Cast,
  hook: Hook,
  photo: Photo,
  compare: Compare,
  grid: Grid,
  steps: Steps,
  mix: Mix,
};

const f = (s: number) => Math.round(s * FPS);
const PUNCH_S = 0.3;

// One scene. It cuts in hard with a quick zoom settle and a flash, then keeps pushing in slowly.
// In the paper look the cut is softer: a small settle and a cream flash.
const SceneSlot: React.FC<{ kind: string; p: Record<string, unknown>; len: number; first: boolean; hook: boolean; look: string }> = ({ kind, p, len, first, hook, look }) => {
  const t = useCurrentFrame() / FPS;
  const paper = look === "paper";
  const Scene = (paper && paperScene(kind, p)) || (look === "lowpoly" && lowPolyScene(kind, p)) || SCENES[kind];
  if (!Scene) throw new Error(`Unknown scene "${kind}"`);
  const settle = first ? 1 : easeOut(prog(t, 0, PUNCH_S));
  const scale = paper ? (1.05 - 0.05 * settle) * (1 + 0.03 * Math.min(1, t / Math.max(1, len))) : (1.14 - 0.14 * settle) * (1 + 0.06 * Math.min(1, t / Math.max(1, len)));
  const flash = first ? 0 : interpolate(t, [0, 0.12], [paper ? 0.4 : 0.55, 0], clamp);
  return (
    <AbsoluteFill style={paper ? { background: PAPER } : undefined}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Scene t={t} dur={len} p={p} hook={hook} />
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{ background: paper ? CREAM : "#fff6dd", opacity: flash }} />}
    </AbsoluteFill>
  );
};

const CaptionSlot: React.FC<{ text: string; speak: number; len: number; words?: { w: string; a: number; b: number }[]; paper: boolean }> = ({ text, speak, len, words, paper }) => {
  const t = useCurrentFrame() / FPS;
  const Caps = paper ? PaperCaptions : Captions;
  return <Caps words={timeWords(text, speak, words)} t={t} end={len} />;
};

const SceneEnd: React.FC<{ p: Record<string, unknown>; look: string }> = ({ p, look }) => {
  const t = useCurrentFrame() / FPS;
  const Card = look === "paper" ? PaperEnd : look === "lowpoly" ? LpEnd : End;
  return (
    <AbsoluteFill>
      <Card t={t} dur={2} p={p} />
      <AbsoluteFill style={{ background: look === "paper" ? CREAM : "#fff6dd", opacity: interpolate(t, [0, 0.12], [0.5, 0], clamp) }} />
    </AbsoluteFill>
  );
};

export const StoryVideo: React.FC<{ story: Story }> = ({ story }) => {
  const frame = useCurrentFrame();
  const [fonts] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(
      ['800 80px "Inter"', '900 100px "Inter"', '700 30px "Inter"', 'italic 400 50px "Playfair Display"', 'italic 700 50px "Playfair Display"', '700 50px "Playfair Display"', '900 50px "Playfair Display"', '700 60px "Space Mono"', 'italic 400 100px "Instrument Serif"'].map((x) => document.fonts.load(x)),
    ).then(() => continueRender(fonts));
  }, [fonts]);

  const { slots, endStart, total } = timeline(story);
  const look = story.style ?? "drawn";
  const paper = look === "paper";
  // the paper look trades the dark hits for light ones: a bell for the boom, a pop for an impact or a crack
  const BRIGHT: Record<string, string> = { boom: "bell", impact: "pop", crack: "pop", heartbeat: "pluck", creak: "drip", horn: "bell", steps: "pluck" };
  const t = frame / FPS;
  const voiced = slots.some((s) => s.line.audio);
  const musicVolume = (fr: number) => interpolate(fr / FPS, [0, 0.3, total - 1.5, total], [0, 1, 1, 0], clamp) * (voiced ? 0.16 : 0.36);
  const sounds = slots.flatMap((s, i) => [
    ...(i > 0 ? [{ at: s.start - 0.06, name: i % 2 ? "whoosh" : "whoosh2", vol: 0.55 }] : []),
    ...sceneSfx(s.line.scene, s.len).map((x) => ({ ...x, at: s.start + x.at })),
    ...(s.line.sfx ?? []).map((x) => ({ ...x, at: s.start + x.at })),
  ]);
  sounds.push({ at: endStart - 0.06, name: "whoosh", vol: 0.5 }, { at: endStart + 0.1, name: "shimmer", vol: 0.6 });
  if (paper) {
    sounds.push({ at: endStart + 0.1, name: "bell", vol: 0.6 });
    // a soft pluck as each group of caption words comes up
    slots.forEach((s, i) => {
      if (i === 0 && story.hook) return;
      chunk(timeWords(s.line.text, speakSeconds(s.line), s.line.words)).forEach((g, j) => sounds.push({ at: s.start + g[0].a - 0.02, name: "pluck", vol: j % 2 ? 0.16 : 0.2 }));
    });
  }
  // The hook: a hit on the very first frame, the hook words instead of captions for the first line, and the series name
  // only once the hook has gone.
  const hook = story.hook;
  const hookOut = hook ? slots[0].len : 0;
  if (hook) sounds.push({ at: 0, name: "boom", vol: 0.75 }, { at: 0, name: "shimmer", vol: 0.7 });
  if (paper) sounds.forEach((x) => (x.name = BRIGHT[x.name] ?? x.name));
  // the paper plate header stays from the first frame, like the top of a book's plate
  const Hook = paper ? PaperHook : HookText;
  const badge = Math.min(paper ? 1 : interpolate(t, [hookOut, hookOut + 0.3], [hook ? 0 : 1, 1], clamp), interpolate(t, [endStart - 0.1, endStart], [1, 0], clamp));

  return (
    <AbsoluteFill style={{ background: paper ? PAPER : BG }}>
      {slots.map((s, i) => (
        <Sequence key={i} from={f(s.start)} durationInFrames={f(s.len)} layout="none">
          <SceneSlot kind={s.line.scene.kind} p={s.line.scene} len={s.len} first={i === 0} hook={i === 0 && !!story.hook} look={look} />
        </Sequence>
      ))}
      <Sequence from={f(endStart)} layout="none">
        <SceneEnd p={story.end ?? {}} look={look} />
      </Sequence>
      {paper ? <PaperOverlay frame={frame} /> : <Overlay frame={frame} />}
      {paper ? <PaperBadge number={story.number} plate={story.plate} opacity={badge} /> : <Badge number={story.number} series={story.series} opacity={badge} />}
      {hook && t < hookOut && (
        <Hook text={hook.text} gold={hook.gold ?? []} t={t} out={hookOut} words={hook.text === slots[0].line.text ? timeWords(hook.text, speakSeconds(slots[0].line), slots[0].line.words) : undefined} />
      )}
      {slots.map((s, i) => (hook && i === 0 ? null :
        <Sequence key={`c${i}`} from={f(s.start)} durationInFrames={f(s.len)} layout="none">
          <CaptionSlot text={s.line.text} speak={speakSeconds(s.line)} len={s.len} words={s.line.words} paper={paper} />
        </Sequence>
      ))}
      {slots.map((s, i) =>
        s.line.audio ? (
          <Sequence key={`v${i}`} from={f(s.start)} layout="none">
            <Audio src={staticFile(s.line.audio)} />
          </Sequence>
        ) : null,
      )}
      {sounds
        .filter((x) => x.at >= 0 && x.at < total)
        .map((x, i) => (
          <Sequence key={`s${i}`} from={f(x.at)} layout="none">
            <Audio src={staticFile(`sfx/${x.name}.wav`)} volume={(x.vol ?? 1) * (voiced ? 0.5 : 0.62)} />
          </Sequence>
        ))}
      {story.music ? <Audio src={staticFile(story.music)} volume={musicVolume} /> : null}
    </AbsoluteFill>
  );
};
