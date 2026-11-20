import React from "react";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/800.css";
import "@fontsource/playfair-display/900.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { FPS, easeOut, prog } from "../look";
import { EMERALD, Ring, RUBY, Stone, StoneProps } from "./common";
import { LOOKS, Look, Medal } from "./looks";

// A 10 second sample of one real story (Diana's sapphire ring) in each new look: same script, same beats, same timing,
// so the looks can be compared like for like. Silent except for the story's music: no voice in the samples.

type Beat = { kind: "hook" | "row" | "stone" | "title" | "ring"; t0: number; t1: number };
const BEATS: Beat[] = [
  { kind: "hook", t0: 0, t1: 2.2 },
  { kind: "row", t0: 2.2, t1: 4.4 },
  { kind: "stone", t0: 4.4, t1: 6.6 },
  { kind: "title", t0: 6.6, t1: 8.6 },
  { kind: "ring", t0: 8.6, t1: 10.8 },
];
export const SAMPLE_SECONDS = BEATS[BEATS.length - 1].t1;

const HOOK_LINES = ["Diana chose her", "ring from a", "catalog."];
const HOOK_GOLD = ["catalog."];
const CAPTIONS: Record<string, string> = {
  row: "The royal jeweler Garrard brought a selection of rings.",
  stone: "Diana picked an oval sapphire circled by 14 diamonds.",
  title: "The sapphire weighs about 12 carats and comes from Ceylon.",
  ring: "In 2010, Prince William gave that ring to Catherine Middleton.",
};

type Hero = { node: React.ReactNode; floorY: number | null; medal: Medal };

function layout(L: Look, b: Beat, lt: number, t: number): Hero {
  const pop = b.kind === "hook" ? 1 : 0.9 + 0.1 * easeOut(prog(lt, 0, 0.5));
  const push = 1 + 0.035 * prog(lt, 0, b.t1 - b.t0);
  const bob = Math.sin(t * 1.5) * 7;
  const base: StoneProps = { t, rx: 255, ry: 200, ...L.stone, seed: 1 };
  const RR = { R: 215, bw: 70 };
  const metal = L.metal;
  if (b.kind === "hook" || b.kind === "ring") {
    const s = (b.kind === "hook" ? 0.95 : 0.84) * pop * push;
    const oy = 1290;
    const bottom = oy + 250 * s;
    return {
      floorY: bottom + 2,
      medal: b.kind === "hook" ? { cy: 1090, rx: 470, ry: 550 } : { cy: 1100, rx: 470, ry: 520 },
      node: (
        <g transform={`translate(540 ${oy + bob * 0.4}) scale(${s})`}>
          <Ring {...base} {...RR} metal={metal} />
        </g>
      ),
    };
  }
  if (b.kind === "row") {
    const bottom = 1300;
    const rings: [number, number, StoneProps["stops"], number][] = [
      [205, 0.4, RUBY, 5],
      [875, 0.4, EMERALD, 7],
      [540, 0.62, L.stone.stops, 1],
    ];
    return {
      floorY: bottom + 2,
      medal: { cy: 1080, rx: 480, ry: 400 },
      node: (
        <g>
          {rings.map(([x, sc, stops, seed], i) => {
            const k = sc * pop * push;
            const rise = (1 - easeOut(prog(lt, 0.05 + i * 0.12, 0.6 + i * 0.12))) * 70;
            return (
              <g key={i} transform={`translate(${x} ${bottom - 250 * k + rise}) scale(${k})`} opacity={0.35 + 0.65 * easeOut(prog(lt, i * 0.12, 0.35 + i * 0.12))}>
                <Ring {...base} {...RR} stops={i === 2 ? L.stone.stops : stops} seed={seed} halo={i === 2 ? 14 : 10} metal={metal} sparkles={i === 2} />
              </g>
            );
          })}
        </g>
      ),
    };
  }
  if (b.kind === "stone") {
    const shown = Math.min(14, Math.floor(prog(lt, 0.15, 1.7) * 14.99));
    return {
      floorY: null,
      medal: { cy: 940, rx: 470, ry: 470 },
      node: (
        <g transform={`translate(540 ${940 + bob}) scale(${1.32 * pop * push})`}>
          <Stone {...base} haloShown={shown} />
        </g>
      ),
    };
  }
  // title: the stone alone, bigger
  return {
    floorY: null,
    medal: { cy: 1120, rx: 480, ry: 470 },
    node: (
      <g transform={`translate(540 ${1120 + bob}) scale(${1.12 * pop * push})`}>
        <Stone {...base} rx={335} ry={270} halo={0} />
      </g>
    ),
  };
}

export const StyleSample: React.FC<{ look: "jewelbox" | "deco" | "gouache"; music?: string }> = ({ look, music }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const L = LOOKS[look];
  const bi = Math.max(0, BEATS.findIndex((b) => t < b.t1));
  const b = BEATS[bi === -1 ? BEATS.length - 1 : bi];
  const lt = t - b.t0;
  const hero = layout(L, b, lt, t);
  const settle = bi === 0 ? 1 : easeOut(prog(lt, 0, 0.3));
  const scale = 1.06 - 0.06 * settle;
  const count = b.kind === "stone" ? String(Math.min(14, Math.floor(prog(lt, 0.15, 1.7) * 14.99))) : "";
  const reflect = L.reflect && hero.floorY !== null;
  const heroG = <g filter={L.heroFilter}>{hero.node}</g>;
  return (
    <AbsoluteFill style={{ background: L.base }}>
      {music && <Audio src={staticFile(music)} volume={0.6} />}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: "50% 45%" }}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <L.Defs />
          <L.Bg t={t} beat={bi} medal={hero.medal} floorY={hero.floorY} />
          {reflect && hero.floorY !== null && (
            <g opacity={0.3} style={{ maskType: "alpha" } as React.CSSProperties}>
              <mask id="reflMask" maskUnits="userSpaceOnUse" x={0} y={hero.floorY} width={1080} height={520}>
                <rect x={0} y={hero.floorY} width={1080} height={520} fill="url(#jbFade)" />
              </mask>
              <g mask="url(#reflMask)">
                <g transform={`translate(0 ${2 * hero.floorY}) scale(1 -1)`}>{heroG}</g>
              </g>
            </g>
          )}
          {heroG}
        </svg>
        {b.kind === "hook" && <L.Hook lines={HOOK_LINES} gold={HOOK_GOLD} t={lt} />}
        {b.kind === "row" && <L.Title big="Garrard" sub="The royal jeweler" t={lt} />}
        {b.kind === "stone" && <L.Title big={count} sub="diamonds" t={lt} />}
        {b.kind === "title" && <L.Title big="12 carats" sub="A Ceylon sapphire" t={lt} />}
        {b.kind === "ring" && <L.Title big="2010" sub="On Catherine's hand" t={lt} />}
        {b.kind !== "hook" && <L.Caption text={CAPTIONS[b.kind]} t={lt} />}
      </div>
      <L.Over t={t} />
    </AbsoluteFill>
  );
};
