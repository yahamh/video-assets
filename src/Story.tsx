import React, { useEffect, useState } from "react";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/700-italic.css";
import "@fontsource/playfair-display/900.css";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BG, FPS, clamp, easeOut, prog } from "./look";
import { Badge, Captions, Overlay, timeWords } from "./Frame";
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
};

const f = (s: number) => Math.round(s * FPS);
const PUNCH_S = 0.3;

// One scene. It cuts in hard with a quick zoom settle and a flash, then keeps pushing in slowly.
const SceneSlot: React.FC<{ kind: string; p: Record<string, unknown>; len: number; first: boolean }> = ({ kind, p, len, first }) => {
  const t = useCurrentFrame() / FPS;
  const Scene = SCENES[kind];
  if (!Scene) throw new Error(`Unknown scene "${kind}"`);
  const settle = first ? 1 : easeOut(prog(t, 0, PUNCH_S));
  const scale = (1.14 - 0.14 * settle) * (1 + 0.06 * Math.min(1, t / Math.max(1, len)));
  const flash = first ? 0 : interpolate(t, [0, 0.12], [0.55, 0], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Scene t={t} dur={len} p={p} />
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{ background: "#fff6dd", opacity: flash }} />}
    </AbsoluteFill>
  );
};

const CaptionSlot: React.FC<{ text: string; speak: number; len: number; words?: { w: string; a: number; b: number }[] }> = ({ text, speak, len, words }) => {
  const t = useCurrentFrame() / FPS;
  return <Captions words={timeWords(text, speak, words)} t={t} end={len} />;
};

const SceneEnd: React.FC<{ p: Record<string, unknown> }> = ({ p }) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      <End t={t} dur={2} p={p} />
      <AbsoluteFill style={{ background: "#fff6dd", opacity: interpolate(t, [0, 0.12], [0.5, 0], clamp) }} />
    </AbsoluteFill>
  );
};

export const StoryVideo: React.FC<{ story: Story }> = ({ story }) => {
  const frame = useCurrentFrame();
  const [fonts] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(
      ['800 80px "Inter"', '700 30px "Inter"', 'italic 400 50px "Playfair Display"', 'italic 700 50px "Playfair Display"', '700 50px "Playfair Display"', '900 50px "Playfair Display"'].map((x) => document.fonts.load(x)),
    ).then(() => continueRender(fonts));
  }, [fonts]);

  const { slots, endStart, total } = timeline(story);
  const t = frame / FPS;
  const voiced = slots.some((s) => s.line.audio);
  const musicVolume = (fr: number) => interpolate(fr / FPS, [0, 0.3, total - 1.5, total], [0, 1, 1, 0], clamp) * (voiced ? 0.16 : 0.36);
  const sounds = slots.flatMap((s, i) => [
    ...(i > 0 ? [{ at: s.start - 0.06, name: i % 2 ? "whoosh" : "whoosh2", vol: 0.55 }] : []),
    ...sceneSfx(s.line.scene, s.len).map((x) => ({ ...x, at: s.start + x.at })),
    ...(s.line.sfx ?? []).map((x) => ({ ...x, at: s.start + x.at })),
  ]);
  sounds.push({ at: endStart - 0.06, name: "whoosh", vol: 0.5 }, { at: endStart + 0.1, name: "shimmer", vol: 0.6 });

  return (
    <AbsoluteFill style={{ background: BG }}>
      {slots.map((s, i) => (
        <Sequence key={i} from={f(s.start)} durationInFrames={f(s.len)} layout="none">
          <SceneSlot kind={s.line.scene.kind} p={s.line.scene} len={s.len} first={i === 0} />
        </Sequence>
      ))}
      <Sequence from={f(endStart)} layout="none">
        <SceneEnd p={story.end ?? {}} />
      </Sequence>
      <Overlay frame={frame} />
      <Badge number={story.number} opacity={interpolate(t, [endStart - 0.1, endStart], [1, 0], clamp)} />
      {slots.map((s, i) => (
        <Sequence key={`c${i}`} from={f(s.start)} durationInFrames={f(s.len)} layout="none">
          <CaptionSlot text={s.line.text} speak={speakSeconds(s.line)} len={s.len} words={s.line.words} />
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
