import React from "react";
import { AbsoluteFill } from "remotion";
import { DISPLAY, GOLD, GOLD_LIGHT, IVORY, SANS, W, popped, rand } from "./look";

// Film grain, a dark vignette, floating gold dust and a thin gold frame with Art Deco corners, over every scene.
export const Overlay: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / 30;
  const dust = [];
  for (let i = 0; i < 26; i++) {
    const x = rand(i) * 1080 + Math.sin(t * 0.4 + i) * 30;
    const y = 1920 - ((rand(i + 50) * 1920 + t * (18 + rand(i + 9) * 30)) % 1920);
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + rand(i + 3)) + i));
    dust.push(<circle key={i} cx={x} cy={y} r={1.5 + rand(i + 7) * 2.5} fill={GOLD_LIGHT} opacity={0.5 * tw} />);
  }
  const corner = (r: number) => (
    <g transform={`rotate(${r} 540 960)`} stroke={GOLD} strokeWidth={2} fill="none" opacity={0.75}>
      <path d="M40 150 V40 H150" />
      <path d="M52 110 V52 H110" />
      <path d="M40 40 L84 84" />
      <circle cx={92} cy={92} r={5} fill={GOLD} stroke="none" />
    </g>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="ovGrain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(frame / 2) % 50} />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0.55 -0.2" />
          </filter>
          <radialGradient id="ovVig" cx="0.5" cy="0.46" r="0.72">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.62} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#ovVig)" />
        {dust}
        <rect width={1080} height={1920} filter="url(#ovGrain)" opacity={0.09} />
        <rect x={28} y={28} width={1024} height={1864} fill="none" stroke={GOLD} strokeWidth={2} opacity={0.45} />
        {corner(0)}
        <g transform="translate(1080 0) scale(-1 1)">{corner(0)}</g>
        <g transform="translate(0 1920) scale(1 -1)">{corner(0)}</g>
        <g transform="translate(1080 1920) scale(-1 -1)">{corner(0)}</g>
      </svg>
    </AbsoluteFill>
  );
};

// The hook: a few big words at the top, fully there on the very first frame (it is also the still people see in the
// feed). Gold words carry the surprise and get a gold underline as they are said. It is gone by `out`, the cut.
export const HookText: React.FC<{ text: string; gold: string[]; t: number; out: number; words?: Timed[] }> = ({ text, gold, t, out, words }) => {
  const leave = Math.min(1, Math.max(0, (t - (out - 0.1)) / 0.1));
  if (leave >= 1) return null;
  const list = text.split(/\s+/).filter(Boolean);
  const isGold = (w: string) => gold.some((g) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "") === g.toLowerCase());
  const size = text.length > 46 ? 88 : text.length > 34 ? 100 : 112;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        width: W - 140,
        top: 250,
        height: 470,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 1 - leave,
        transform: `translateY(${-50 * leave}px)`,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.06,
          letterSpacing: -1.5,
          textAlign: "center",
          textWrap: "balance",
          color: "#ffffff",
          textShadow: "0 6px 28px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)",
        }}
      >
        {list.map((w, i) => {
          const gold = isGold(w);
          const at = words?.[i]?.a ?? 0.3;
          const line = gold ? Math.min(1, Math.max(0, (t - at) / 0.25)) : 0;
          return (
            <span key={i} style={{ display: "inline-block", margin: "0 0.12em", position: "relative", color: gold ? GOLD_LIGHT : "#ffffff" }}>
              {w}
              {gold && (
                <span style={{ position: "absolute", left: 0, bottom: "0.02em", height: "0.09em", width: `${line * 100}%`, background: GOLD, borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.6)" }} />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// The series name at the top, small, between two gold rules.
// The series name at the top, once the hook has gone.
const SERIES: Record<string, string> = { lesson: "RENDER LESSONS" };
export const Badge: React.FC<{ number: number; series?: string; opacity: number }> = ({ number, series, opacity }) => (
  <div style={{ position: "absolute", top: 168, left: 0, width: W, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, opacity }}>
    <div style={{ width: 70, height: 2, background: GOLD, opacity: 0.8 }} />
    <svg width={18} height={18} viewBox="0 0 18 18">
      <path d="M9 1 L17 9 L9 17 L1 9Z" fill={GOLD} />
    </svg>
    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, letterSpacing: 7, color: GOLD_LIGHT }}>
      {SERIES[series ?? ""] ?? "JEWELRY STORIES"} <span style={{ opacity: 0.6 }}>· {number}</span>
    </div>
    <svg width={18} height={18} viewBox="0 0 18 18">
      <path d="M9 1 L17 9 L9 17 L1 9Z" fill={GOLD} />
    </svg>
    <div style={{ width: 70, height: 2, background: GOLD, opacity: 0.8 }} />
  </div>
);

export type Timed = { w: string; a: number; b: number }; // a word and when it is said, in seconds from the line's start

// Splits a line into the words' timings. Without real timings, each word gets time in proportion to its length.
export const timeWords = (text: string, speak: number, given?: Timed[]): Timed[] => {
  if (given && given.length) return given;
  const words = text.split(/\s+/).filter(Boolean);
  const weight = words.map((w) => w.replace(/[^\p{L}\p{N}]/gu, "").length + 2.5 + (/[.,;:]$/.test(w) ? 3 : 0));
  const total = weight.reduce((x, y) => x + y, 0);
  let at = 0.08;
  return words.map((w, i) => {
    const len = (weight[i] / total) * (speak - 0.08);
    const r = { w, a: at, b: at + len };
    at += len;
    return r;
  });
};

// Groups of up to 3 words (fewer when the words are long), shown one group at a time.
const chunk = (words: Timed[]) => {
  const out: Timed[][] = [];
  let cur: Timed[] = [];
  let chars = 0;
  for (const w of words) {
    if (cur.length && (cur.length >= 3 || chars + w.w.length > 17)) {
      out.push(cur);
      cur = [];
      chars = 0;
    }
    cur.push(w);
    chars += w.w.length + 1;
    if (/[.,;:?]$/.test(w.w)) {
      out.push(cur);
      cur = [];
      chars = 0;
    }
  }
  if (cur.length) out.push(cur);
  return out;
};

// Big captions that follow the voice: a few words at a time, the word being said in gold.
export const Captions: React.FC<{ words: Timed[]; t: number; end: number }> = ({ words, t, end }) => {
  const groups = chunk(words);
  const gi = groups.findIndex((g, i) => t < (groups[i + 1]?.[0].a ?? end));
  if (gi < 0) return null;
  const g = groups[gi];
  const pop = popped(t, g[0].a - 0.05, g[0].a + 0.12);
  return (
    <div style={{ position: "absolute", left: 60, width: W - 120, top: 1180, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 82,
          lineHeight: 1.08,
          textAlign: "center",
          letterSpacing: -1,
          transform: `scale(${0.88 + 0.12 * pop})`,
          opacity: Math.min(1, pop * 1.5),
          textShadow: "0 0 3px #000, 0 4px 14px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)",
        }}
      >
        {g.map((w, i) => {
          const on = t >= w.a && t < (g[i + 1]?.a ?? groups[gi + 1]?.[0].a ?? end);
          return (
            <span key={i} style={{ color: on ? GOLD_LIGHT : IVORY, display: "inline-block", margin: "0 12px", transform: on ? "scale(1.06)" : undefined }}>
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// A short italic line in gold, for places and dates inside a scene.
export const Tag: React.FC<{ text: string; y: number; opacity: number; size?: number }> = ({ text, y, opacity, size = 54 }) => (
  <div style={{ position: "absolute", top: y, left: 0, width: W, textAlign: "center", opacity, fontFamily: DISPLAY, fontStyle: "italic", fontSize: size, color: GOLD_LIGHT, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
    {text}
  </div>
);
