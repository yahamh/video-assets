import React from "react";
import { rand } from "../look";
import { DIAMOND, MetalKit, RGB, SAPPHIRE, StoneProps, hex, rise } from "./common";
import { PieceStyle } from "./gem3d";

// Three full-colour looks for the stories. Each one gives the sample its background, its hero stone and metal,
// its frame, and its type. Nothing here is one-ink: every look keeps the story's own jewel colour and a second, warm colour.

export type Medal = { cy: number; rx: number; ry: number } | null;

export type Look = {
  id: "jewelbox" | "deco" | "gouache";
  label: string;
  base: string;
  Defs: React.FC;
  Bg: React.FC<{ t: number; beat: number; medal: Medal; floorY: number | null }>;
  Over: React.FC<{ t: number }>;
  stone: Partial<StoneProps> & { stops: RGB[] };
  metal: MetalKit;
  reflect: boolean;
  heroFilter?: string;
  render: PieceStyle;
  Hook: React.FC<{ lines: string[]; gold: string[]; t: number }>;
  Caption: React.FC<{ text: string; t: number }>;
  Title: React.FC<{ big: string; sub: string; t: number }>;
};

const W = 1080;
const H = 1920;
const wrapStyle: React.CSSProperties = { position: "absolute", left: 0, width: W, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" };

const isGold = (w: string, gold: string[]) => gold.some((g) => g.toLowerCase() === w.toLowerCase());

// ---------------------------------------------------------------------------------------------------------------------
// 1. Jewel Box: a luxury product still life. Saturated colour, glossy hero on a mirror floor, bokeh, light beams.
// ---------------------------------------------------------------------------------------------------------------------
const JbDefs: React.FC = () => (
  <defs>
    <linearGradient id="jbMetal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="0.28" stopColor="#aeb6c4" />
      <stop offset="0.5" stopColor="#f4f7fb" />
      <stop offset="0.74" stopColor="#707988" />
      <stop offset="1" stopColor="#dde3ea" />
    </linearGradient>
    <radialGradient id="jbBg" cx="0.5" cy="0.4" r="0.85">
      <stop offset="0" stopColor="#3b78ff" />
      <stop offset="0.32" stopColor="#1740b8" />
      <stop offset="0.68" stopColor="#081d66" />
      <stop offset="1" stopColor="#02081f" />
    </radialGradient>
    <linearGradient id="jbFloor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#10338f" />
      <stop offset="1" stopColor="#010514" />
    </linearGradient>
    <filter id="jbBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16" /></filter>
    <filter id="jbBlurBig" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="42" /></filter>
    <linearGradient id="jbFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </linearGradient>
  </defs>
);

const JbBg: Look["Bg"] = ({ t, beat, floorY }) => {
  const bokeh: React.ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const x = ((rand(i + beat * 3) * 1300 - 110 + Math.sin(t * 0.3 + i) * 40) % 1300);
    const y = rand(i + 40) * 1500 + Math.cos(t * 0.25 + i * 2) * 30;
    const r = 36 + rand(i + 80) * 120;
    bokeh.push(<circle key={i} cx={x} cy={y} r={r} fill={i % 4 === 0 ? "#ffe1a0" : "#9fc4ff"} opacity={0.05 + rand(i + 5) * 0.09} filter="url(#jbBlur)" />);
  }
  const beam = (rot: number, op: number) => (
    <polygon points="500,-100 580,-100 760,1500 320,1500" transform={`rotate(${rot} 540 -100)`} fill="#bcd4ff" opacity={op} filter="url(#jbBlurBig)" />
  );
  return (
    <g>
      <rect width={W} height={H} fill="url(#jbBg)" />
      {beam(-22 + Math.sin(t * 0.5) * 3, 0.16)}
      {beam(20 + Math.cos(t * 0.45) * 3, 0.12)}
      {bokeh}
      {floorY !== null && (
        <>
          <rect y={floorY} width={W} height={H - floorY} fill="url(#jbFloor)" />
          <rect y={floorY - 2} width={W} height={5} fill="#cfe0ff" opacity={0.5} filter="url(#jbBlur)" />
          <rect y={floorY} width={W} height={2} fill="#e8f0ff" opacity={0.55} />
        </>
      )}
    </g>
  );
};

const JbOver: Look["Over"] = ({ t }) => {
  const dust: React.ReactNode[] = [];
  for (let i = 0; i < 30; i++) {
    const x = rand(i + 11) * W + Math.sin(t * 0.5 + i) * 24;
    const y = H - ((rand(i + 51) * H + t * (14 + rand(i + 9) * 26)) % H);
    const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.9 + rand(i + 3)) + i));
    dust.push(<circle key={i} cx={x} cy={y} r={1.6 + rand(i + 7) * 2.6} fill="#fff" opacity={0.55 * tw} />);
  }
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="jbVig" cx="0.5" cy="0.46" r="0.74">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#jbVig)" />
      {dust}
    </svg>
  );
};

const JbHook: Look["Hook"] = ({ lines, gold, t }) => (
  <div style={{ ...wrapStyle, top: 150 }}>
    {lines.map((ln, li) => (
      <div key={li} style={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, fontSize: 104, lineHeight: 1.08, color: "#fff", textShadow: "0 6px 30px rgba(2,8,40,.7)" }}>
        {ln.split(" ").map((w, i) => (
          <span key={i} style={{ color: isGold(w, gold) ? "#ffd978" : "#fff", marginRight: 22 }}>{w}</span>
        ))}
      </div>
    ))}
  </div>
);

const JbCaption: Look["Caption"] = ({ text, t }) => (
  <div style={{ ...wrapStyle, top: 1560, padding: "0 70px", boxSizing: "border-box", ...rise(t, 0.1, 0.3) }}>
    <div style={{ fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: 64, lineHeight: 1.18, color: "#fff", textShadow: "0 4px 22px rgba(1,6,30,.9)" }}>{text}</div>
  </div>
);

const JbTitle: Look["Title"] = ({ big, sub, t }) => (
  <div style={{ ...wrapStyle, top: 170 }}>
    <div style={{ ...rise(t, 0.02, 0.3), fontFamily: '"Playfair Display", serif', fontWeight: 900, fontSize: 230, lineHeight: 1, background: "linear-gradient(180deg,#fffbe8,#ffd978 60%,#e3a93a)", WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 8px 24px rgba(2,8,40,.6))" }}>{big}</div>
    <div style={{ ...rise(t, 0.15, 0.3), fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: 40, letterSpacing: "0.26em", textTransform: "uppercase", color: "#dbe8ff", marginTop: 14 }}>{sub}</div>
  </div>
);

export const JEWELBOX: Look = {
  id: "jewelbox",
  label: "Jewel Box",
  base: "#02081f",
  Defs: JbDefs,
  Bg: JbBg,
  Over: JbOver,
  stone: { stops: SAPPHIRE, contrast: 1.12 },
  metal: { band: "url(#jbMetal)", light: "#ffffff", shade: "#4b5463", shine: true },
  reflect: true,
  render: { gem: { contrast: 1.12, fire: true, sparkles: true } },
  Hook: JbHook,
  Caption: JbCaption,
  Title: JbTitle,
};

// ---------------------------------------------------------------------------------------------------------------------
// 2. Deco Poster: 1920s jewelry-house poster. Flat bold colour, sunburst, gold stepped frame, a medallion for the hero.
// ---------------------------------------------------------------------------------------------------------------------
const GOLD = "#f3c34f";
const GOLD_D = "#9a6d17";
const CREAM = "#fff3d3";
const NAVY = "#0b2a73";

const DecoDefs: React.FC = () => <defs />;

const DecoBg: Look["Bg"] = ({ t, medal }) => {
  const rays: React.ReactNode[] = [];
  const cx = 540;
  const cy = medal ? medal.cy : 960;
  const n = 28;
  for (let i = 0; i < n; i += 2) {
    const a0 = ((i / n) * 360 + t * 2.5) * (Math.PI / 180);
    const a1 = (((i + 1) / n) * 360 + t * 2.5) * (Math.PI / 180);
    const R = 2600;
    rays.push(<polygon key={i} points={`${cx},${cy} ${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)}`} fill="#1a50b8" />);
  }
  return (
    <g>
      <rect width={W} height={H} fill="#123f9c" />
      {rays}
      {medal && (
        <g>
          <ellipse cx={540} cy={medal.cy} rx={medal.rx + 26} ry={medal.ry + 26} fill={GOLD} />
          <ellipse cx={540} cy={medal.cy} rx={medal.rx + 6} ry={medal.ry + 6} fill="#0c2f80" />
          <ellipse cx={540} cy={medal.cy} rx={medal.rx - 14} ry={medal.ry - 14} fill="#0a2469" stroke={GOLD} strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

const DecoOver: Look["Over"] = ({ t }) => {
  const corner = (
    <g fill="none" stroke={GOLD} strokeWidth={4}>
      <path d="M44 210 V100 L100 44 H210" strokeWidth={8} />
      <path d="M70 190 V112 L112 70 H190" />
      {[0.5, 0.9, 1.3].map((k, i) => (
        <path key={i} d={`M44 ${44 + 120 * k} A${120 * k} ${120 * k} 0 0 0 ${44 + 120 * k} 44`} opacity={0.0} />
      ))}
      <path d="M120 120 L190 190 M120 150 L170 200 M150 120 L200 170" strokeWidth={3} opacity={0.9} />
    </g>
  );
  const star = (x: number, y: number, s: number, ph: number) => {
    const k = 0.55 + 0.45 * Math.sin(t * 2 + ph);
    const z = s * k;
    return <path key={ph} transform={`translate(${x} ${y})`} d={`M0 ${-z} L${z * 0.22} ${-z * 0.22} L${z} 0 L${z * 0.22} ${z * 0.22} L0 ${z} L${-z * 0.22} ${z * 0.22} L${-z} 0 L${-z * 0.22} ${-z * 0.22}Z`} fill={CREAM} opacity={0.9} />;
  };
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <path d={`M80 44 H${W - 80} L${W - 44} 80 V${H - 80} L${W - 80} ${H - 44} H80 L44 ${H - 80} V80Z`} fill="none" stroke={GOLD} strokeWidth={8} />
      <path d={`M104 70 H${W - 104} L${W - 70} 104 V${H - 104} L${W - 104} ${H - 70} H104 L70 ${H - 104} V104Z`} fill="none" stroke={GOLD} strokeWidth={2.5} opacity={0.8} />
      {corner}
      <g transform={`translate(${W} 0) scale(-1 1)`}>{corner}</g>
      <g transform={`translate(0 ${H}) scale(1 -1)`}>{corner}</g>
      <g transform={`translate(${W} ${H}) scale(-1 -1)`}>{corner}</g>
      {star(150, 760, 30, 0)}
      {star(940, 1180, 24, 2)}
      {star(120, 1260, 18, 4)}
      {star(960, 700, 20, 1)}
    </svg>
  );
};

const DecoHook: Look["Hook"] = ({ lines, gold, t }) => (
  <div style={{ ...wrapStyle, top: 150 }}>
    <div style={{ width: 640, height: 6, background: GOLD, marginBottom: 26 }} />
    {lines.map((ln, li) => (
      <div key={li} style={{ fontFamily: '"Playfair Display", serif', fontWeight: 900, fontSize: 84, lineHeight: 1.1, letterSpacing: "0.04em", textTransform: "uppercase", color: CREAM, textShadow: "0 6px 0 #07205e" }}>
        {ln.split(" ").map((w, i) => (
          <span key={i} style={{ color: isGold(w, gold) ? GOLD : CREAM, marginRight: 20 }}>{w}</span>
        ))}
      </div>
    ))}
    <div style={{ width: 640, height: 6, background: GOLD, marginTop: 26 }} />
  </div>
);

const DecoCaption: Look["Caption"] = ({ text, t }) => (
  <div style={{ ...wrapStyle, top: 1500, ...rise(t, 0.1, 0.3) }}>
    <div style={{ width: 880, boxSizing: "border-box", padding: "40px 46px", background: CREAM, border: `8px solid ${GOLD}`, outline: `3px solid ${NAVY}`, outlineOffset: -20, fontFamily: '"Playfair Display", serif', fontWeight: 800, fontSize: 56, lineHeight: 1.2, color: NAVY, textAlign: "center" }}>{text}</div>
  </div>
);

const DecoTitle: Look["Title"] = ({ big, sub, t }) => (
  <div style={{ ...wrapStyle, top: 160 }}>
    <div style={{ ...rise(t, 0.02, 0.3), fontFamily: '"Playfair Display", serif', fontWeight: 900, fontSize: 220, lineHeight: 1, letterSpacing: "0.02em", color: GOLD, textShadow: "0 10px 0 #07205e" }}>{big}</div>
    <div style={{ ...rise(t, 0.15, 0.3), fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: 38, letterSpacing: "0.34em", textTransform: "uppercase", color: CREAM, marginTop: 22 }}>{sub}</div>
  </div>
);

export const DECO: Look = {
  id: "deco",
  label: "Deco Poster",
  base: "#123f9c",
  Defs: DecoDefs,
  Bg: DecoBg,
  Over: DecoOver,
  stone: { stops: ["#0a1f6b", "#1642b8", "#2f6af0", "#7fb0ff", "#e3f0ff"].map(hex), levels: 5, contrast: 1.2, stroke: GOLD, strokeW: 4, diaStroke: GOLD },
  metal: { band: GOLD, edge: GOLD_D, light: "#fff2b8", shade: "#c8901f", flat: true },
  reflect: false,
  render: { gem: { levels: 5, contrast: 1.2, stroke: GOLD, strokeW: 4 }, metalLevels: 4, outline: "#071a52", outlineW: 11, metals: { platinum: ["#33508f", "#7e9fe0", "#cfe0ff", "#f4f8ff", "#ffffff"].map(hex) } },
  Hook: DecoHook,
  Caption: DecoCaption,
  Title: DecoTitle,
};

// ---------------------------------------------------------------------------------------------------------------------
// 3. Gouache: hand-painted still life. Warm light on a teal wall and a plum cloth, wobbly edges, paper grain, serif italics.
// ---------------------------------------------------------------------------------------------------------------------
const GouacheDefs: React.FC = () => (
  <defs>
    <filter id="gPaint" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="turbulence" baseFrequency="0.016" numOctaves={2} seed={4} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={14} xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id="gWall" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves={3} seed={9} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={46} xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id="gSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26" /></filter>
    <radialGradient id="gLight" cx="0.28" cy="0.18" r="0.9">
      <stop offset="0" stopColor="#ffd98a" stopOpacity="0.55" />
      <stop offset="0.5" stopColor="#ffb866" stopOpacity="0.12" />
      <stop offset="1" stopColor="#ffb866" stopOpacity="0" />
    </radialGradient>
    <filter id="gGrain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={2} />
      <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.22  0 0 0 1.1 -0.38" />
    </filter>
  </defs>
);

const GouacheBg: Look["Bg"] = ({ t, beat, floorY }) => {
  const wall: React.ReactNode[] = [];
  const cols = ["#164752", "#1f5964", "#2a707c", "#123b46", "#34808a"];
  for (let i = 0; i < 34; i++) {
    const x0 = rand(i + beat) * 1500 - 200;
    const y0 = rand(i + 30) * 1500;
    const len = 380 + rand(i + 60) * 520;
    const ang = -0.5 + rand(i + 90) * 0.6;
    const x1 = x0 + Math.cos(ang) * len;
    const y1 = y0 + Math.sin(ang) * len;
    wall.push(<path key={i} d={`M${x0} ${y0} Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + (rand(i + 120) - 0.5) * 120} ${x1} ${y1}`} stroke={cols[i % cols.length]} strokeWidth={90 + rand(i + 150) * 150} strokeLinecap="round" fill="none" opacity={0.42} />);
  }
  const fy = floorY ?? 1500;
  const folds: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const x = -100 + i * 150 + rand(i) * 60;
    folds.push(<path key={i} d={`M${x} ${fy - 20 + rand(i + 4) * 40} Q${x + 80 + rand(i + 8) * 80} ${fy + 220} ${x + 40 + (rand(i + 2) - 0.5) * 200} ${H + 40}`} stroke={i % 2 ? "#8a4480" : "#4a1c47"} strokeWidth={50 + rand(i + 6) * 50} strokeLinecap="round" fill="none" opacity={0.5} />);
  }
  return (
    <g>
      <rect width={W} height={H} fill="#1d5560" />
      <g filter="url(#gWall)">{wall}</g>
      <rect width={W} height={H} fill="url(#gLight)" />
      <g filter="url(#gPaint)">
        <path d={`M-60 ${fy + 16} Q270 ${fy - 70} 540 ${fy - 14} T1140 ${fy - 30} V${H + 60} H-60Z`} fill="#6d2f66" />
        {folds}
        <path d={`M-60 ${fy + 16} Q270 ${fy - 70} 540 ${fy - 14} T1140 ${fy - 30}`} stroke="#f0b27a" strokeWidth={8} fill="none" opacity={0.6} />
      </g>
      <ellipse cx={540 + Math.sin(t * 0.4) * 6} cy={fy + 14} rx={400} ry={46} fill="#2a0f2b" opacity={0.5} filter="url(#gSoft)" />
    </g>
  );
};

const GouacheOver: Look["Over"] = ({ t }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="gVig" cx="0.5" cy="0.46" r="0.74">
        <stop offset="0.6" stopColor="#1a0a1a" stopOpacity="0" />
        <stop offset="1" stopColor="#1a0a1a" stopOpacity="0.5" />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#gVig)" />
    <rect width={W} height={H} filter="url(#gGrain)" opacity={0.55} style={{ mixBlendMode: "multiply" }} />
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const k = Math.pow(Math.max(0, Math.sin(t * 1.6 + i * 1.7)), 2);
      return <circle key={i} cx={140 + rand(i + 3) * 800} cy={300 + rand(i + 9) * 1000} r={5 + k * 7} fill="#ffe7b0" opacity={0.15 + k * 0.5} />;
    })}
  </svg>
);

const SERIF_I = '"Instrument Serif", "Playfair Display", serif';

const GouacheHook: Look["Hook"] = ({ lines, gold, t }) => (
  <div style={{ ...wrapStyle, top: 110 }}>
    {lines.map((ln, li) => (
      <div key={li} style={{ fontFamily: SERIF_I, fontStyle: "italic", fontWeight: 400, fontSize: 126, lineHeight: 1.0, color: "#fff1d0", textShadow: "0 4px 22px rgba(20,8,24,.65)" }}>
        {ln.split(" ").map((w, i) => (
          <span key={i} style={{ color: isGold(w, gold) ? "#ffb347" : "#fff1d0", marginRight: 26 }}>{w}</span>
        ))}
      </div>
    ))}
  </div>
);

const GouacheCaption: Look["Caption"] = ({ text, t }) => (
  <div style={{ ...wrapStyle, top: 1560, padding: "0 80px", boxSizing: "border-box", ...rise(t, 0.1, 0.3) }}>
    <div style={{ fontFamily: SERIF_I, fontStyle: "italic", fontSize: 82, lineHeight: 1.08, color: "#fff1d0", textShadow: "0 3px 18px rgba(20,8,24,.8)" }}>{text}</div>
  </div>
);

const GouacheTitle: Look["Title"] = ({ big, sub, t }) => (
  <div style={{ ...wrapStyle, top: 130 }}>
    <div style={{ ...rise(t, 0.02, 0.3), fontFamily: SERIF_I, fontSize: 280, lineHeight: 1, color: "#fff1d0", textShadow: "0 6px 26px rgba(20,8,24,.6)" }}>{big}</div>
    <div style={{ ...rise(t, 0.15, 0.3), fontFamily: SERIF_I, fontStyle: "italic", fontSize: 74, color: "#ffc77a", marginTop: 4 }}>{sub}</div>
  </div>
);

export const GOUACHE: Look = {
  id: "gouache",
  label: "Gouache",
  base: "#1d5560",
  Defs: GouacheDefs,
  Bg: GouacheBg,
  Over: GouacheOver,
  stone: { stops: ["#14275a", "#26489a", "#4a78cc", "#86aee6", "#d6e5f8", "#fff8e8"].map(hex), contrast: 0.92, dia: ["#aab0c2", "#d9dde8", "#f8f3e6", "#fffaf0"].map(hex) } as StoneProps & { stops: RGB[] },
  metal: { band: "#e0dbcd", light: "#fffaf0", shade: "#6f7683", shine: true },
  reflect: false,
  heroFilter: "url(#gPaint)",
  render: { gem: { contrast: 0.92, sparkles: true }, metals: { platinum: ["#4d4a5a", "#8d8a99", "#cfc9c6", "#f4eee4", "#fffaf0"].map(hex) } },
  Hook: GouacheHook,
  Caption: GouacheCaption,
  Title: GouacheTitle,
};

export const LOOKS = { jewelbox: JEWELBOX, deco: DECO, gouache: GOUACHE } as const;
export { DIAMOND };
