import React from "react";
import { AbsoluteFill } from "remotion";
import { W, popped } from "../look";
import { Timed, chunk } from "../Frame";
import { CORAL, CREAM, INK, INK_SOFT, MONO, SERIF } from "./kit";

// What sits over every paper scene (ali, 30 Oct 2026): fine paper grain, the plate header at the top, the hook in big
// italic capitals and small typed captions. The dark look's versions are in ../Frame.tsx.

// Paper grain that shifts a little, so the paper feels alive. No vignette, no frame.
export const PaperOverlay: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="poGrain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={Math.floor(frame / 3) % 40} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0 0.15  0 0 0 0.7 -0.3" />
        </filter>
      </defs>
      <rect width={1080} height={1920} filter="url(#poGrain)" opacity={0.18} />
    </svg>
  </AbsoluteFill>
);

const ROMAN: [number, string][] = [[100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
export const roman = (n: number) => {
  let out = "";
  for (const [v, s] of ROMAN) while (n >= v) {
    out += s;
    n -= v;
  }
  return out;
};

// The plate header, like an old science book: "STORY XIV" between two rules, the story's name in italics under it.
export const PaperBadge: React.FC<{ number: number; plate?: string; opacity: number }> = ({ number, plate, opacity }) => (
  <div style={{ position: "absolute", top: 104, left: 0, width: W, display: "flex", flexDirection: "column", alignItems: "center", opacity }}>
    <div style={{ width: 300, height: 2, background: INK, opacity: 0.7 }} />
    <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 9, color: INK, padding: "10px 0 8px", marginLeft: 9 }}>
      JEWELRY STORY {roman(number)}
    </div>
    <div style={{ width: 300, height: 2, background: INK, opacity: 0.7 }} />
    {plate && <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: INK_SOFT, marginTop: 6 }}>{plate}</div>}
  </div>
);

// The hook: a few big italic capitals at the top, there from the very first frame (it is also the still people see in
// the feed). The words that carry the surprise are in coral and get a hand-drawn underline as they are said.
export const PaperHook: React.FC<{ text: string; gold: string[]; t: number; out: number; words?: Timed[] }> = ({ text, gold, t, out, words }) => {
  const leave = Math.min(1, Math.max(0, (t - (out - 0.12)) / 0.12));
  if (leave >= 1) return null;
  const list = text.split(/\s+/).filter(Boolean);
  const isGold = (w: string) => gold.some((g) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "") === g.toLowerCase());
  const size = text.length > 40 ? 112 : text.length > 30 ? 124 : 138;
  return (
    <div style={{ position: "absolute", left: 60, width: W - 120, top: 250, height: 420, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - leave, transform: `translateY(${-40 * leave}px)` }}>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: size, lineHeight: 0.98, textAlign: "center", textWrap: "balance", color: INK, textTransform: "uppercase" }}>
        {list.map((w, i) => {
          const hot = isGold(w);
          const at = words?.[i]?.a ?? 0.3;
          const line = hot ? Math.min(1, Math.max(0, (t - at) / 0.3)) : 0;
          return (
            <span key={i} style={{ display: "inline-block", margin: "0 0.1em", position: "relative", color: hot ? CORAL : INK }}>
              {w}
              {hot && (
                <svg viewBox="0 0 100 12" preserveAspectRatio="none" style={{ position: "absolute", left: "-2%", bottom: "-0.06em", width: "104%", height: "0.16em", overflow: "visible" }}>
                  <path d="M2 7 Q 25 1 50 6 T 98 5" fill="none" stroke={CORAL} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} />
                </svg>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Small typed captions that follow the voice, a few words at a time, in ink; the word being said sits on a scrap of
// cream paper.
export const PaperCaptions: React.FC<{ words: Timed[]; t: number; end: number }> = ({ words, t, end }) => {
  const groups = chunk(words);
  const gi = groups.findIndex((g, i) => t < (groups[i + 1]?.[0].a ?? end));
  if (gi < 0) return null;
  const g = groups[gi];
  const pop = popped(t, g[0].a - 0.05, g[0].a + 0.1);
  return (
    <div style={{ position: "absolute", left: 50, width: W - 100, top: 1200, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 62, lineHeight: 1.3, textAlign: "center", textTransform: "uppercase", color: INK, transform: `scale(${0.9 + 0.1 * pop})`, opacity: Math.min(1, pop * 1.6) }}>
        {g.map((w, i) => {
          const on = t >= w.a && t < (g[i + 1]?.a ?? groups[gi + 1]?.[0].a ?? end);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "4px 6px",
                padding: "0 12px",
                borderRadius: 6,
                background: on ? CREAM : "transparent",
                boxShadow: on ? "0 4px 0 rgba(43,33,27,0.18)" : undefined,
                transform: on ? "rotate(-1.5deg)" : undefined,
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
