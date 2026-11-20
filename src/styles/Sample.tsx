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
import { DIAMOND, EMERALD, RUBY, SAPPHIRE } from "./common";
import { Piece, PieceSpec, ringBottom } from "./gem3d";
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

// One real piece in every shot, built properly (see gem3d.tsx): a different cut, a different stone and a different metal each time.
function layout(L: Look, b: Beat, lt: number, t: number): Hero {
  const pop = b.kind === "hook" ? 1 : 0.92 + 0.08 * easeOut(prog(lt, 0, 0.5));
  const push = 1 + 0.035 * prog(lt, 0, b.t1 - b.t0);
  const st = L.render;
  const sapphire: PieceSpec = { cut: "oval", stops: SAPPHIRE, metal: "platinum", halo: { n: 14, stops: DIAMOND }, rr: 1.9, rise: 0.34 };
  if (b.kind === "hook") {
    const k = 165 * pop * push;
    const yaw = 0.62 + Math.sin(t * 0.9) * 0.1;
    const elev = 0.5;
    const oy = 1200;
    return {
      floorY: ringBottom(sapphire, yaw, elev, oy, k) + 2,
      medal: { cy: 1090, rx: 470, ry: 560 },
      node: <Piece spec={sapphire} yaw={yaw} elev={elev} ox={540} oy={oy} k={k} t={t} style={st} uid="hook" seed={1} />,
    };
  }
  if (b.kind === "row") {
    const rings: { x: number; k: number; yaw: number; spec: PieceSpec; seed: number }[] = [
      { x: 150, k: 80, yaw: 0.5, seed: 5, spec: { cut: "oval", stops: RUBY, metal: "rose", prongs: 4, rr: 1.85 } },
      { x: 930, k: 80, yaw: -0.5, seed: 7, spec: { cut: "emerald", stops: EMERALD, metal: "yellow", prongs: 4, rr: 1.85, shoulder: { n: 3, stops: DIAMOND } } },
      { x: 540, k: 128, yaw: 0.62, seed: 1, spec: sapphire },
    ];
    const baseline = 1450;
    const elev = 0.5;
    return {
      floorY: baseline + 2,
      medal: { cy: 1060, rx: 480, ry: 430 },
      node: (
        <g>
          {rings.map((r, i) => {
            const k = r.k * pop * push;
            const rise = (1 - easeOut(prog(lt, 0.05 + i * 0.12, 0.6 + i * 0.12))) * 70;
            const oy = baseline - (ringBottom(r.spec, r.yaw, elev, 0, k)) + rise;
            return (
              <g key={i} opacity={0.35 + 0.65 * easeOut(prog(lt, i * 0.12, 0.35 + i * 0.12))}>
                <Piece spec={r.spec} yaw={r.yaw + Math.sin(t * 0.8 + i) * 0.06} elev={elev} ox={r.x} oy={oy} k={k} t={t} style={st} uid={`row${i}`} seed={r.seed} />
              </g>
            );
          })}
        </g>
      ),
    };
  }
  if (b.kind === "stone") {
    const shown = Math.min(14, Math.floor(prog(lt, 0.15, 1.7) * 14.99));
    const spec: PieceSpec = { ...sapphire, band: false, halo: { n: 14, stops: DIAMOND, shown } };
    return {
      floorY: null,
      medal: { cy: 960, rx: 470, ry: 470 },
      node: <Piece spec={spec} yaw={0.15 * Math.sin(t * 0.7)} elev={1.0} ox={540} oy={980 + Math.sin(t * 1.5) * 6} k={250 * pop * push} t={t} style={st} uid="stone" seed={1} />,
    };
  }
  if (b.kind === "ring") {
    const k = 150 * pop * push;
    const yaw = 1.05 + Math.sin(t * 0.9) * 0.12;
    const elev = 0.3;
    const oy = 1135;
    const spec: PieceSpec = { ...sapphire, halo: { n: 14, stops: DIAMOND }, rise: 0.4 };
    return {
      floorY: ringBottom(spec, yaw, elev, oy, k) + 2,
      medal: { cy: 1100, rx: 470, ry: 520 },
      node: <Piece spec={spec} yaw={yaw} elev={elev} ox={540} oy={oy} k={k} t={t} style={st} uid="ring" seed={2} />,
    };
  }
  // title: the loose stone alone, turning
  const loose: PieceSpec = { cut: "oval", stops: SAPPHIRE, metal: "platinum", band: false };
  return {
    floorY: null,
    medal: { cy: 1130, rx: 480, ry: 470 },
    node: <Piece spec={loose} yaw={t * 0.8} elev={0.4} ox={540} oy={1070 + Math.sin(t * 1.5) * 6} k={380 * pop * push} t={t} style={st} uid="loose" seed={1} />,
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
