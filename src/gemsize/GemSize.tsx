import React, { useEffect, useState } from "react";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/playfair-display/900.css";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FPS, H, W, clamp, easeOut, prog, rand } from "../look";
import { timeWords } from "../Frame";
import { TRIM, duck, musicDuck } from "../mix";
import manifest from "../../public/gemsize/manifest.json";

// "How big is a 1 carat {shape}?" (the gem size Shorts, 6 Nov 2026): one Short per diamond shape, built from the numbers in
// gemsize/numbers.json by scripts/gemsize.py. A solid purple panel on top holds the words (the top third, as the hook rules
// say), the artwork sits below it, and nothing important is in the bottom fifth or the right edge, where the apps put their
// buttons. Every picture is opaque and full frame; the stones are drawn to scale (40 px per millimeter, the same scale in
// every picture of one video).

type Stone = { w: number; h: number; cx: number; cy: number; outline: string; inner: string };
const STONES = manifest as unknown as Record<string, Stone>;

export type Dim = { length_mm: number; width_mm: number; finger_share_pct: number };
export type GemLine = {
  key: "hook" | "stones" | "finger" | "why" | "answer";
  text: string; // the words on screen and in the captions
  say: string; // what the voice reads
  audio?: string; // public/ path of the voice
  seconds?: number; // how long the voice runs
  hold?: number; // extra seconds on this picture after the voice
};
export type GemShort = {
  id: string;
  number: number;
  shape: string; // key in numbers.json (oval, emerald...)
  label: string; // "oval", "emerald cut"
  kind: "ratio" | "depth"; // what the fourth picture says: the length to width ratio, or the depth that hides weight
  hook: { text: string; lines?: string[]; gold: string[] };
  dims: Record<"1ct" | "2ct" | "3ct", Dim>;
  fingerMm: number;
  answer: { length: string; width: string; same: boolean }; // as written on screen: "8.0", "5.5"
  lines: GemLine[];
  music?: string;
};

export const PAD_S = 0.3;
export const HOLD_S = 1.5;
const EST_WPS = 2.7;

export const speak = (l: GemLine) => l.seconds ?? l.say.split(/\s+/).length / EST_WPS;
export const gemTimeline = (s: GemShort) => {
  let at = 0;
  const slots = s.lines.map((line, i) => {
    const last = i === s.lines.length - 1;
    const len = speak(line) + (last ? HOLD_S : PAD_S) + (line.hold ?? 0);
    const slot = { line, start: at, len };
    at += len;
    return slot;
  });
  return { slots, total: at };
};

const f = (s: number) => Math.round(s * FPS);
const INK = "#2b1856"; // the panel
const LILAC = "#cdbdf5";
const PURPLE = "#7c5ac5";
const GOLD = "#f2cf7a";
const GOLD_DARK = "#9a7425";
const CREAM = "#fbf6ec";
const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif';
const SERIF = '"Playfair Display", Georgia, serif';
const PANEL_H = 620;

const fade = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);

// ---- the shared background: cream with a few slow gold glints ----
const Backdrop: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 62%, #ffffff 0%, ${CREAM} 55%, #f3e9d6 100%)` }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 16 }).map((_, i) => {
        const x = rand(i + 4) * 1000 + 40;
        const y = PANEL_H + 80 + ((rand(i + 40) * 1000 + t * (8 + rand(i + 9) * 14)) % 880);
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * (1 + rand(i + 3)) + i * 1.7));
        const r = 7 + rand(i + 21) * 9;
        return <path key={i} d={`M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r}Z`} transform={`translate(${x} ${y})`} fill="#e2c27a" opacity={0.5 * tw} />;
      })}
    </svg>
  </AbsoluteFill>
);

// A four-point glint that twinkles on a stone.
const Glint: React.FC<{ x: number; y: number; t: number; size: number; every?: number; at?: number }> = ({ x, y, t, size, every = 1.1, at = 0 }) => {
  const u = ((t - at) % every + every) % every / every;
  const a = t < at ? 0 : Math.sin(Math.min(1, u * 1.6) * Math.PI);
  const r = size * (0.4 + 0.6 * a);
  return <path d={`M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r}Z`} transform={`translate(${x} ${y}) rotate(${u * 40})`} fill="#ffffff" opacity={a} style={{ filter: "drop-shadow(0 0 8px #fff)" }} />;
};

// ---- the panel: the words ----
const Words: React.FC<{ lines: { text: string; size: number; color?: string; font?: string; weight?: number; gap?: number }[]; gold?: string[] }> = ({ lines, gold = [] }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: 940 }}>
    {lines.map((l, i) => (
      <div
        key={i}
        style={{
          fontFamily: l.font ?? SANS,
          fontWeight: l.weight ?? 900,
          fontSize: l.size,
          lineHeight: 1.04,
          letterSpacing: l.size > 100 ? -2 : -0.5,
          color: l.color ?? "#fff",
          marginTop: l.gap ?? 0,
          textWrap: "balance",
        }}
      >
        {l.text.split(/\s+/).map((w, j) => (
          <span key={j} style={{ display: "inline-block", margin: "0 0.13em", color: gold.some((g) => w.toLowerCase().replace(/[^a-z0-9.]/g, "") === g.toLowerCase()) ? GOLD : undefined }}>
            {w}
          </span>
        ))}
      </div>
    ))}
  </div>
);

const share = (s: GemShort, k: "1ct" | "2ct") => s.dims[k].finger_share_pct;

const PanelContent: React.FC<{ s: GemShort; k: GemLine["key"]; t: number }> = ({ s, k, t }) => {
  switch (k) {
    case "hook": {
      const lines = s.hook.lines ?? [s.hook.text];
      const size = Math.min(124, Math.floor(900 / (0.6 * Math.max(...lines.map((l) => l.length)))));
      return <Words lines={lines.map((text) => ({ text, size }))} gold={s.hook.gold} />;
    }
    case "stones":
      return <Words lines={[{ text: "1, 2 and 3 carats", size: 118 }, { text: "drawn to the same scale", size: 54, weight: 700, color: LILAC, gap: 26 }]} gold={["carats"]} />;
    case "finger": {
      const n = Math.round(interpolate(t, [0.4, 1.8], [0, share(s, "2ct")], { ...clamp, easing: easeOut }));
      return (
        <Words
          lines={[
            { text: `A 2 carat ${s.label} covers`, size: 58, weight: 800, color: LILAC },
            { text: `${n}%`, size: 250, font: SERIF, color: GOLD, gap: 8 },
            { text: "of a size 6 finger's width", size: 58, weight: 800, color: LILAC, gap: 6 },
          ]}
        />
      );
    }
    case "why":
      return <Words lines={[{ text: "Same carat,", size: 118 }, { text: s.kind === "ratio" ? "different ratio" : "deeper cut", size: 118 }]} gold={s.kind === "ratio" ? ["ratio"] : ["deeper", "cut"]} />;
    default:
      return (
        <Words
          lines={[
            { text: `A 1 carat ${s.label} measures about`, size: s.label.length > 6 ? 52 : 58, weight: 800, color: LILAC },
            { text: s.answer.same ? s.answer.length : `${s.answer.length} by ${s.answer.width}`, size: 168, font: SERIF, color: GOLD, gap: 10 },
            { text: s.answer.same ? "millimeters across" : "millimeters", size: 64, weight: 800, gap: 22 },
          ]}
        />
      );
  }
};

const Panel: React.FC<{ s: GemShort; t: number }> = ({ s, t }) => {
  const { slots } = gemTimeline(s);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: PANEL_H, background: INK, borderRadius: "0 0 64px 64px", boxShadow: "0 18px 40px rgba(43,24,86,0.28)" }}>
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 0, height: 5, background: GOLD, borderRadius: 3, opacity: 0.9 }} />
      {slots.map((sl, i) => {
        const lt = t - sl.start;
        const inn = i === 0 ? 1 : easeOut(prog(lt, 0.02, 0.32));
        const out = i === slots.length - 1 ? 0 : prog(lt, sl.len - 0.2, sl.len);
        if (lt < -0.05 || out >= 1) return null;
        return (
          <div key={i} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 20, opacity: inn * (1 - out), transform: `translateY(${(1 - inn) * 40 - out * 30}px)` }}>
            <PanelContent s={s} k={sl.line.key} t={lt} />
          </div>
        );
      })}
    </div>
  );
};

// ---- artwork ----
const stoneKey = (s: GemShort, n: 1 | 2 | 3) => `${s.shape}-${n}ct`;
const Inner: React.FC<{ stone: Stone }> = ({ stone }) => <g dangerouslySetInnerHTML={{ __html: stone.inner.replace(/#f3effb/g, "url(#gemFill)").replace(/stroke-opacity="0.35"/g, 'stroke-opacity="0.6"') }} />;
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="gemFill" cx="0.4" cy="0.35" r="0.8">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="0.55" stopColor="#ebe3fc" />
      <stop offset="1" stopColor="#c9b8f1" />
    </radialGradient>
  </defs>
);
const mm = (d: Dim, round: boolean) => (round ? `${d.length_mm.toFixed(1)} mm` : `${d.length_mm.toFixed(1)} x ${d.width_mm.toFixed(1)} mm`);
const shadow = { filter: "drop-shadow(0 14px 22px rgba(124,90,197,0.30))" };

// The finger: the artwork's own SVG with a skin-coloured body under it (the file leaves the body empty) and the finger
// carried on below the picture's end.
const FINGER = { S: 42, ring: 1080 }; // px per mm, and the screen y of the ring's centre
const FingerBody: React.FC = () => {
  const { S, ring } = FINGER;
  const y0 = 38 - ring / S;
  return (
    <svg width={38.51 * S} height={H} viewBox={`0 ${y0} 38.51 ${H / S}`} style={{ position: "absolute", left: (W - 38.51 * S) / 2, top: 0 }}>
      <path d="M11.76 9 A7.5 9 0 0 1 26.75 9 L27.51 39 L27.51 80 L11 80 L11 39 Z" fill="#f4d3b8" />
      <path d="M27.51 55 L27.51 80 M11 55 L11 80" stroke="#cf9a77" strokeWidth={0.5} fill="none" />
    </svg>
  );
};
const FingerArt: React.FC<{ s: GemShort; n: 1 | 2; opacity: number }> = ({ s, n, opacity }) => {
  const { S, ring } = FINGER;
  return <img src={staticFile(`gemsize/finger-${s.shape}-${n}ct.svg`)} style={{ position: "absolute", left: (W - 38.51 * S) / 2, top: ring - 38 * S, width: 38.51 * S, height: 58 * S, opacity }} />;
};

const FingerScene: React.FC<{ s: GemShort; t: number; len: number; two: boolean }> = ({ s, t, len, two }) => {
  const { S, ring } = FINGER;
  const push = 1 + 0.06 * prog(t, 0, len + 1);
  const swap = two ? easeOut(prog(t, 0.12, 0.5)) : 0;
  const bracket = two ? easeOut(prog(t, 0.6, 1.2)) : 0;
  const sx = (x: number) => (W - 38.51 * S) / 2 + x * S;
  const sy = (y: number) => ring + (y - 38) * S;
  const by = 29.4;
  return (
    <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: `540px ${ring}px` }}>
      <FingerBody />
      <FingerArt s={s} n={1} opacity={1 - swap} />
      {two ? <FingerArt s={s} n={2} opacity={swap} /> : null}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {two ? (
          <g opacity={bracket}>
            <path d={`M${sx(11)} ${sy(by)} H${sx(11 + 16.51 * bracket)} M${sx(11)} ${sy(by) - 18} V${sy(by) + 18} M${sx(11 + 16.51 * bracket)} ${sy(by) - 18} V${sy(by) + 18}`} stroke={GOLD_DARK} strokeWidth={6} strokeLinecap="round" fill="none" />
            <text x={sx(19.25)} y={sy(by) - 30} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={48} fill={GOLD_DARK}>
              finger {s.fingerMm} mm
            </text>
          </g>
        ) : null}
        <Glint x={sx(19.25) - 26} y={sy(38) - 34} t={t} size={34} at={two ? 1.2 : 0.2} every={1.3} />
      </svg>
    </AbsoluteFill>
  );
};

const StonesScene: React.FC<{ s: GemShort; t: number; len: number; say: string; speakS: number }> = ({ s, t, len, say, speakS }) => {
  const keys = [1, 2, 3].map((n) => STONES[stoneKey(s, n as 1 | 2 | 3)]);
  const round = s.shape === "round";
  const gap = 30;
  const base = 1290;
  const k = Math.min(1.15, (940 - 2 * gap) / keys.reduce((a, b) => a + b.w, 0), (base - PANEL_H - 70) / Math.max(...keys.map((x) => x.h)));
  const total = keys.reduce((a, b) => a + b.w * k, 0) + 2 * gap;
  const words = timeWords(say, speakS);
  const at = (w: string) => words.find((x) => x.w.toLowerCase().startsWith(w))?.a ?? 1;
  const cues = [0.05, Math.max(0.3, at("two") - 0.15), Math.max(0.9, at("three") - 0.15)];
  let x = (W - total) / 2;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Defs />
        {keys.map((st, i) => {
          const left = x;
          x += st.w * k + gap;
          const p = easeOut(prog(t, cues[i], cues[i] + 0.4));
          const ct = (i + 1) as 1 | 2 | 3;
          const d = s.dims[`${ct}ct` as "1ct" | "2ct" | "3ct"];
          const cx = left + (st.w * k) / 2;
          const one = STONES[stoneKey(s, 1)];
          return (
            <g key={i} opacity={p} transform={`translate(0 ${(1 - p) * 60})`}>
              <g transform={`translate(${left} ${base - st.h * k}) scale(${k})`} style={shadow}>
                <Inner stone={st} />
                {i > 0 ? (
                  <g transform={`translate(${st.cx} ${st.cy})`}>
                    <path d={one.outline} fill="none" stroke={GOLD_DARK} strokeWidth={4} strokeDasharray="14 10" opacity={0.85 * fade(t, cues[i] + 0.5, cues[i] + 0.9)} vectorEffect="non-scaling-stroke" />
                  </g>
                ) : null}
              </g>
              <text x={cx} y={base + 78} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={66} fill={INK}>
                {ct} ct
              </text>
              <text x={cx} y={base + 130} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={Math.min(44, (st.w * k + gap - 8) / (Math.max(5, mm(d, round).length) * 0.6))} fill="#6a5a96">
                {mm(d, round)}
              </text>
            </g>
          );
        })}
        <Glint x={(W - total) / 2 + keys[0].w * k * 0.35} y={base - keys[0].h * k * 0.78} t={t} size={26} at={0.6} every={1.5} />
      </svg>
    </AbsoluteFill>
  );
};

// A same-weight comparison: two stones, one rounder and one longer (the shapes' own artwork, stretched so the face keeps
// its area), or two side views, one with an ideal depth and one too deep for the same weight.
const WhyScene: React.FC<{ s: GemShort; t: number }> = ({ s, t }) => {
  if (s.kind === "ratio") {
    const st = STONES[stoneKey(s, 1)];
    const k = Math.min(1.9, 520 / st.h, 330 / st.w);
    const cy = 1030;
    const pairs = [
      { x: 300, sx: 1.12, sy: 1 / 1.12, label: "Rounder", at: 0.15 },
      { x: 780, sx: 0.9, sy: 1 / 0.9, label: "Longer", at: 0.55 },
    ];
    return (
      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Defs />
          {pairs.map((p, i) => {
            const a = easeOut(prog(t, p.at, p.at + 0.4));
            return (
              <g key={i} opacity={a} transform={`translate(0 ${(1 - a) * 50})`}>
                <g transform={`translate(${p.x} ${cy}) scale(${k * p.sx} ${k * p.sy}) translate(${-st.cx} ${-st.cy})`} style={shadow}>
                  <Inner stone={st} />
                </g>
                <text x={p.x} y={cy + 330} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={60} fill={INK}>
                  {p.label}
                </text>
              </g>
            );
          })}
          <g opacity={fade(t, 0.7, 1.1)}>
            <circle cx={540} cy={cy} r={50} fill={INK} />
            <path d="M516 1018 H564 M516 1042 H564" stroke={GOLD} strokeWidth={9} strokeLinecap="round" />
          </g>
        </svg>
      </AbsoluteFill>
    );
  }
  // side views of a faceted stone: ideal depth (0.61 of its width) against a deep one (0.78) of the same weight, so the
  // deep one is 12% narrower
  const side = (D: number, pav: number) => {
    const tb = 0.27 * D, crown = 0.15 * D, girdle = 0.03 * D, depth = pav * D;
    const pts = [[-tb, 0], [tb, 0], [D / 2, crown], [D / 2, crown + girdle], [0, crown + girdle + depth], [-D / 2, crown + girdle], [-D / 2, crown]];
    const lines = [[-tb, 0, -D * 0.22, crown], [tb, 0, D * 0.22, crown], [-D * 0.22, crown + girdle, 0, crown + girdle + depth], [D * 0.22, crown + girdle, 0, crown + girdle + depth], [-D / 2, crown, D / 2, crown]];
    return { d: pts.map((q, i) => `${i ? "L" : "M"}${q[0]} ${q[1]}`).join(" ") + "Z", lines, h: crown + girdle + depth };
  };
  const A = side(400, 0.43), B = side(400 * 0.884, 0.6);
  const top = 880;
  const items = [
    { x: 275, g: A, label: "Ideal depth", sub: "looks bigger", at: 0.15 },
    { x: 800, g: B, label: "Too deep", sub: "hides weight", at: 0.6 },
  ];
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Defs />
        {items.map((it, i) => {
          const a = easeOut(prog(t, it.at, it.at + 0.4));
          return (
            <g key={i} opacity={a} transform={`translate(0 ${(1 - a) * 50})`}>
              <g transform={`translate(${it.x} ${top})`} style={shadow}>
                <path d={it.g.d} fill="url(#gemFill)" stroke={PURPLE} strokeWidth={5} strokeLinejoin="round" />
                {it.g.lines.map((l, j) => (
                  <path key={j} d={`M${l[0]} ${l[1]} L${l[2]} ${l[3]}`} stroke={PURPLE} strokeOpacity={0.4} strokeWidth={2.5} />
                ))}
              </g>
              <text x={it.x} y={top + 380} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={58} fill={INK}>
                {it.label}
              </text>
              <text x={it.x} y={top + 436} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill="#6a5a96">
                {it.sub}
              </text>
            </g>
          );
        })}
        <g opacity={fade(t, 0.9, 1.3)}>
          <circle cx={540} cy={top + 120} r={50} fill={INK} />
          <path d="M516 1008 H564 M516 1032 H564" stroke={GOLD} strokeWidth={9} strokeLinecap="round" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const Bracket: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number }> = ({ x1, y1, x2, y2, p }) => {
  const ex = x1 + (x2 - x1) * p, ey = y1 + (y2 - y1) * p;
  const horizontal = y1 === y2;
  const tick = (x: number, y: number) => (horizontal ? `M${x} ${y - 16} V${y + 16}` : `M${x - 16} ${y} H${x + 16}`);
  return <path d={`M${x1} ${y1} L${ex} ${ey} ${tick(x1, y1)} ${tick(ex, ey)}`} stroke={GOLD_DARK} strokeWidth={6} strokeLinecap="round" fill="none" />;
};

const AnswerScene: React.FC<{ s: GemShort; t: number; say: string; speakS: number }> = ({ s, t, say, speakS }) => {
  const st = STONES[stoneKey(s, 1)];
  const round = s.shape === "round";
  const k = Math.min(2.6, 520 / st.h, 520 / st.w);
  const w = st.w * k, h = st.h * k;
  // the artwork's size includes a 24 px margin; the stone itself is the length and width in the numbers
  const sw = s.dims["1ct"].width_mm * 40 * k, sh = s.dims["1ct"].length_mm * 40 * k;
  const cx = 560, cy = 1010;
  const words = timeWords(say, speakS);
  const after = (w1: string) => {
    const i = words.findIndex((x) => x.w.toLowerCase() === w1);
    return words[i + 1]?.a ?? 1.6;
  };
  const lenAt = after("about") - 0.1;
  const widAt = after("by") - 0.1;
  const left = cx - sw / 2, right = cx + sw / 2, top = cy - sh / 2, bottom = cy + sh / 2;
  const pL = easeOut(prog(t, lenAt, lenAt + 0.5));
  const pW = easeOut(prog(t, widAt, widAt + 0.5));
  const appear = easeOut(prog(t, 0, 0.45));
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Defs />
        <g opacity={appear} transform={`translate(0 ${(1 - appear) * 50})`}>
          <g transform={`translate(${cx - w / 2} ${cy - h / 2}) scale(${k})`} style={shadow}>
            <Inner stone={st} />
          </g>
        </g>
        {/* the length, up the left side */}
        {!round ? <Bracket x1={left - 54} y1={bottom} x2={left - 54} y2={top} p={pL} /> : null}
        {!round ? (
          <text x={left - 76} y={cy + 18} textAnchor="end" fontFamily={SANS} fontWeight={900} fontSize={56} fill={INK} opacity={pL}>
            {s.answer.length} mm
          </text>
        ) : null}
        {/* the width, under the stone */}
        <Bracket x1={left} y1={bottom + 54} x2={right} y2={bottom + 54} p={round ? pL : pW} />
        <text x={cx} y={bottom + 138} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={56} fill={INK} opacity={round ? pL : pW}>
          {round ? s.answer.length : s.answer.width} mm
        </text>
        <Glint x={cx - sw * 0.2} y={cy - sh * 0.27} t={t} size={34} at={0.5} every={1.4} />
        <text x={540} y={1505} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={36} fill="#8a7ab0" opacity={fade(t, 1.0, 1.5)}>
          Estimates for a well-cut stone
        </text>
      </svg>
    </AbsoluteFill>
  );
};

// ---- the video ----
const SceneSlot: React.FC<{ s: GemShort; line: GemLine; first: boolean; len: number }> = ({ s, line, first, len }) => {
  const t = useCurrentFrame() / FPS;
  const inn = first ? 1 : fade(t, 0, 0.16);
  const speakS = speak(line);
  return (
    <AbsoluteFill style={{ opacity: inn }}>
      <Backdrop t={t + (first ? 0 : 0)} />
      {line.key === "hook" ? <FingerScene s={s} t={t} len={len} two={false} /> : null}
      {line.key === "stones" ? <StonesScene s={s} t={t} len={len} say={line.say} speakS={speakS} /> : null}
      {line.key === "finger" ? <FingerScene s={s} t={t} len={len} two /> : null}
      {line.key === "why" ? <WhyScene s={s} t={t} /> : null}
      {line.key === "answer" ? <AnswerScene s={s} t={t} say={line.say} speakS={speakS} /> : null}
    </AbsoluteFill>
  );
};

export const GemShortVideo: React.FC<{ short: GemShort }> = ({ short: s }) => {
  const frame = useCurrentFrame();
  const [fonts] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(['900 100px "Inter"', '800 60px "Inter"', '700 40px "Inter"', '900 200px "Playfair Display"'].map((x) => document.fonts.load(x))).then(() => continueRender(fonts));
  }, [fonts]);
  const t = frame / FPS;
  const { slots, total } = gemTimeline(s);
  const spoken = slots.filter((x) => x.line.audio).map((x) => [x.start, x.start + speak(x.line)] as const);
  // sounds: a soft hit and a shimmer on the very first frame, a whoosh into every picture, a bell on the answer
  const sounds: { at: number; name: string; vol: number }[] = [{ at: 0, name: "boom", vol: 0.6 }, { at: 0, name: "shimmer", vol: 0.7 }];
  slots.forEach((x, i) => {
    if (i > 0) sounds.push({ at: x.start - 0.05, name: i % 2 ? "whoosh" : "whoosh2", vol: 0.5 });
    if (x.line.key === "stones") sounds.push({ at: x.start + 0.55, name: "thump", vol: 0.35 }, { at: x.start + 1.5, name: "thump", vol: 0.35 });
    if (x.line.key === "finger") sounds.push({ at: x.start + 1.9, name: "shimmer", vol: 0.5 });
    if (x.line.key === "answer") sounds.push({ at: x.start + 0.9, name: "bell", vol: 0.5 }, { at: x.start + 2.4, name: "shimmer", vol: 0.5 });
  });
  const voiced = spoken.length > 0;
  const musicVolume = (fr: number) => interpolate(fr / FPS, [0, 0.3, total - 1.4, total], [0, 1, 1, 0], clamp) * (voiced ? 0.16 * musicDuck(fr / FPS, spoken) : 0.36);
  return (
    <AbsoluteFill style={{ background: CREAM }}>
      {slots.map((x, i) => (
        <Sequence key={i} from={f(x.start)} durationInFrames={f(x.len)} layout="none">
          <SceneSlot s={s} line={x.line} first={i === 0} len={x.len} />
        </Sequence>
      ))}
      <Panel s={s} t={t} />
      {slots.map((x, i) =>
        x.line.audio ? (
          <Sequence key={`v${i}`} from={f(x.start + (i === 0 ? 0.04 : 0))} layout="none">
            <Audio src={staticFile(x.line.audio)} />
          </Sequence>
        ) : null,
      )}
      {sounds
        .filter((x) => x.at >= 0 && x.at < total)
        .map((x, i) => {
          const level = x.vol * (TRIM[x.name] ?? 1) * (voiced ? 0.5 : 0.62);
          return (
            <Sequence key={`s${i}`} from={f(x.at)} layout="none">
              <Audio src={staticFile(`sfx/${x.name}.wav`)} volume={voiced ? (fr: number) => level * duck(x.at + fr / FPS, spoken) : level} />
            </Sequence>
          );
        })}
      {s.music ? <Audio src={staticFile(s.music)} volume={musicVolume} /> : null}
    </AbsoluteFill>
  );
};
