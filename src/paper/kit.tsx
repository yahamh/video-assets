import React from "react";
import { rand } from "../look";

// The paper look (ali, 30 Oct 2026, from his reference reel): warm cream paper, one big painted shape per scene in a
// bright color, thin white line work, confetti, small typed captions. Everything keeps moving gently.

export const PAPER = "#f1e7d5";
export const PAPER_DARK = "#e3d3b8";
export const INK = "#2b211b";
export const INK_SOFT = "#6a5848";
export const CREAM = "#fffaf0";
export const PINK = "#ec6a9c";
export const CORAL = "#f0552e";
export const LIME = "#c8dc3c";
export const MINT = "#4cc3a8";
export const SKY = "#5bb4e8";
export const SUN = "#f7c23a";
export const LILAC = "#a98be0";
export const BRIGHTS = [PINK, MINT, SUN, SKY, CORAL, LIME, LILAC];

export const MONO = '"Space Mono", "Courier New", monospace';
export const SERIF = '"Instrument Serif", Georgia, serif';

// The metals, light and dark.
export const METAL: Record<string, [string, string]> = {
  yellow: ["#f2c64e", "#c48d1c"],
  white: ["#e4e9ee", "#9aa6b0"],
  rose: ["#f3ad92", "#c8775c"],
  platinum: ["#e4e9ee", "#9aa6b0"],
};
export const metal = (m: unknown) => METAL[typeof m === "string" ? m : "yellow"] ?? METAL.yellow;

// A color picked from the scene's own settings, so neighbouring scenes differ and the same scene always looks the same.
export const pick = (p: Record<string, unknown>, avoid?: string) => {
  if (typeof p.color === "string") return p.color;
  const s = JSON.stringify(p);
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  let c = BRIGHTS[h % BRIGHTS.length];
  if (avoid && c.toLowerCase() === avoid.toLowerCase()) c = BRIGHTS[(h + 1) % BRIGHTS.length];
  return c;
};

// Mixes a hex color toward white (k > 0) or toward ink (k < 0).
export const tint = (hex: string, k: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const to = k > 0 ? [255, 250, 240] : [43, 33, 27];
  const a = Math.abs(k);
  return "#" + c.map((v, i) => Math.round(v + (to[i] - v) * a).toString(16).padStart(2, "0")).join("");
};

// A smooth closed path through points (Catmull-Rom as cubic Béziers).
export const smooth = (pts: [number, number][]) => {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
};

// An organic loop round (cx, cy): a painted shape's outline, slowly breathing.
export const blobPath = (cx: number, cy: number, rx: number, ry: number, seed: number, t: number, wobble = 1) => {
  const pts: [number, number][] = [];
  const n = 56;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let r = 1;
    for (let k = 2; k <= 5; k++) r += wobble * (0.012 + rand(seed * 7 + k) * 0.03) * Math.sin(k * a + rand(seed + k * 13) * 6.28 + t * (0.25 + rand(seed + k) * 0.3));
    r += wobble * 0.006 * Math.sin(13 * a + rand(seed + 3) * 6) + wobble * 0.004 * Math.sin(19 * a + seed);
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  return smooth(pts);
};

// The filters every scene shares: paper grain, the painted mottling and the rough edge of a brushed shape.
export const Defs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <filter id={`${id}-paint`} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={3} result="edge" />
      <feDisplacementMap in="SourceGraphic" in2="edge" scale={9} xChannelSelector="R" yChannelSelector="G" result="shape" />
      <feTurbulence type="fractalNoise" baseFrequency="0.0045 0.007" numOctaves={3} seed={11} result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.94  1.25 0 0 0 -0.62" result="light" />
      <feComposite in="light" in2="shape" operator="in" result="lightIn" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.1  0 0 0 0 0.12  0 -1.2 0 0 0.52" result="dark" />
      <feComposite in="dark" in2="shape" operator="in" result="darkIn" />
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={1} seed={5} result="fine" />
      <feColorMatrix in="fine" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 -0.22" result="specks" />
      <feComposite in="specks" in2="shape" operator="in" result="specksIn" />
      <feMerge>
        <feMergeNode in="shape" />
        <feMergeNode in="lightIn" />
        <feMergeNode in="darkIn" />
        <feMergeNode in="specksIn" />
      </feMerge>
    </filter>
    <filter id={`${id}-rough`} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={8} result="e" />
      <feDisplacementMap in="SourceGraphic" in2="e" scale={4} xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={18} />
    </filter>
    <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={10} />
    </filter>
  </defs>
);

// The cream paper behind everything, with its grain and a few faint stains.
export const PaperBg: React.FC<{ id: string }> = ({ id }) => (
  <g>
    <defs>
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={21} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.18  0 0 0 0.9 -0.42" />
      </filter>
      <filter id={`${id}-stain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0018 0.0025" numOctaves={3} seed={4} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.5  0 0 0 0 0.34  1.4 0 0 0 -0.62" />
      </filter>
    </defs>
    <rect width={1080} height={1920} fill={PAPER} />
    <rect width={1080} height={1920} filter={`url(#${id}-stain)`} opacity={0.35} />
    <rect width={1080} height={1920} filter={`url(#${id}-grain)`} opacity={0.5} />
  </g>
);

// One big painted shape in a bright color: the stage of a scene.
export const Blob: React.FC<{ id: string; cx: number; cy: number; rx: number; ry: number; color: string; seed: number; t: number; wobble?: number; opacity?: number }> = ({
  id,
  cx,
  cy,
  rx,
  ry,
  color,
  seed,
  t,
  wobble = 1,
  opacity = 1,
}) => {
  const d = blobPath(cx, cy, rx, ry, seed, t * 0.6, wobble);
  return (
    <g opacity={opacity}>
      <path d={d} fill={color} filter={`url(#${id}-paint)`} />
      <path d={d} fill="none" stroke={tint(color, -0.25)} strokeWidth={5} opacity={0.35} filter={`url(#${id}-rough)`} />
    </g>
  );
};

// Thin white lines that wander across a shape, each with a loop, drifting slowly.
export const Doodles: React.FC<{ t: number; seed: number; x0: number; x1: number; ys: number[]; color?: string; opacity?: number; clip?: string }> = ({
  t,
  seed,
  x0,
  x1,
  ys,
  color = CREAM,
  opacity = 0.8,
  clip,
}) => (
  <g opacity={opacity} clipPath={clip ? `url(#${clip})` : undefined}>
    {ys.map((y0, j) => {
      const loopAt = 0.25 + rand(seed + j * 5) * 0.5;
      const amp = 16 + rand(seed + j) * 18;
      const shift = (t * (22 + rand(seed + j * 3) * 18)) % 200;
      let d = "";
      const steps = 220;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        let x = x0 - 200 + shift + u * (x1 - x0 + 200);
        let y = y0 + Math.sin(u * 9 + j * 2 + t * 0.6) * amp;
        const l = (u - loopAt) / 0.05;
        if (Math.abs(l) < 1) {
          const a = (l + 1) * Math.PI;
          x += -Math.sin(a) * 34;
          y += (1 - Math.cos(a)) * -22;
        }
        d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      return <path key={j} d={d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />;
    })}
  </g>
);

// Small bits of colored paper: dots, rings, crosses and triangles, drifting and turning.
export const Confetti: React.FC<{ t: number; seed: number; n?: number; box?: [number, number, number, number]; burst?: number; k?: number; colors?: string[] }> = ({
  t,
  seed,
  n = 26,
  box = [60, 260, 1020, 1560],
  burst,
  k = 1,
  colors = [PINK, SUN, MINT, SKY, CORAL, LIME, LILAC, CREAM],
}) => (
  <g opacity={k}>
    {Array.from({ length: n }, (_, i) => {
      const r = (q: number) => rand(seed * 17 + i * 7 + q);
      let x = box[0] + r(1) * (box[2] - box[0]) + Math.sin(t * (0.5 + r(2)) + i) * 14;
      let y = box[1] + r(3) * (box[3] - box[1]) + Math.cos(t * (0.4 + r(4)) + i) * 12;
      let s = 1;
      if (burst !== undefined) {
        const u = Math.min(1, Math.max(0, (t - burst) / 0.6));
        const e = 1 - Math.pow(1 - u, 3);
        x = 540 + (x - 540) * e;
        y = 860 + (y - 860) * e;
        s = e;
      }
      const c = colors[Math.floor(r(5) * colors.length)];
      const rot = t * (30 + r(6) * 60) * (r(7) > 0.5 ? 1 : -1) + r(8) * 360;
      const kind = Math.floor(r(9) * 5);
      const z = (6 + r(10) * 9) * s;
      return (
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}>
          {kind === 0 && <circle r={z * 0.6} fill={c} />}
          {kind === 1 && <circle r={z * 0.75} fill="none" stroke={c} strokeWidth={3} />}
          {kind === 2 && <path d={`M${-z} 0H${z}M0 ${-z}V${z}`} stroke={c} strokeWidth={3.2} strokeLinecap="round" />}
          {kind === 3 && <polygon points={`0,${-z} ${z * 0.9},${z * 0.7} ${-z * 0.9},${z * 0.7}`} fill={c} />}
          {kind === 4 && <path d={`M${-z} 0 q${z / 2} ${-z} ${z} 0 t${z} 0`} fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" />}
        </g>
      );
    })}
  </g>
);

// Thin white rings spreading from a point, one after another.
export const Ripples: React.FC<{ x: number; y: number; t: number; r?: number; every?: number; color?: string; k?: number; flat?: number }> = ({
  x,
  y,
  t,
  r = 380,
  every = 1.4,
  color = CREAM,
  k = 1,
  flat = 1,
}) => (
  <g opacity={k}>
    {[0, 1, 2].map((i) => {
      const u = ((t + i * (every / 3)) % every) / every;
      return <ellipse key={i} cx={x} cy={y} rx={r * u} ry={r * u * flat} fill="none" stroke={color} strokeWidth={3 - 1.5 * u} opacity={(1 - u) * 0.75} />;
    })}
  </g>
);

// A four-pointed twinkle.
export const Sparkle: React.FC<{ x: number; y: number; r: number; k: number; color?: string }> = ({ x, y, r, k, color = CREAM }) => {
  if (k <= 0.02) return null;
  const s = r * (0.5 + 0.5 * k);
  const w = s * 0.18;
  return (
    <path
      transform={`translate(${x} ${y})`}
      d={`M0 ${-s} Q${w} ${-w} ${s} 0 Q${w} ${w} 0 ${s} Q${-w} ${w} ${-s} 0 Q${-w} ${-w} 0 ${-s}Z`}
      fill={color}
      opacity={k}
    />
  );
};

// A soft glow of color behind something.
export const Glow: React.FC<{ id: string; x: number; y: number; r: number; color: string; k?: number }> = ({ id, x, y, r, color, k = 1 }) => (
  <circle cx={x} cy={y} r={r} fill={color} opacity={0.55 * k} filter={`url(#${id}-soft)`} />
);

// A soft shadow on the paper under something.
export const Shadow: React.FC<{ id: string; x: number; y: number; rx: number; ry?: number; k?: number }> = ({ id, x, y, rx, ry, k = 1 }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry ?? rx * 0.18} fill={INK} opacity={0.16 * k} filter={`url(#${id}-shadow)`} />
);

// A small card of paper with a strip of tape: a name and a line under it.
export const Card: React.FC<{ x: number; y: number; name: string; role?: string; k: number; tape?: string; tilt?: number; width?: number }> = ({
  x,
  y,
  name,
  role,
  k,
  tape = LIME,
  tilt = -2,
  width,
}) => {
  if (k <= 0.01) return null;
  const size = name.length > 22 ? 52 : 62;
  const w = width ?? Math.min(940, Math.max(420, name.length * size * 0.46 + 120, (role ?? "").length * 19 + 120));
  const h = role ? 170 : 120;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${0.85 + 0.15 * k})`} opacity={Math.min(1, k * 1.4)}>
      <rect x={-w / 2 + 6} y={-h / 2 + 9} width={w} height={h} rx={6} fill={INK} opacity={0.12} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={CREAM} />
      <rect x={-60} y={-h / 2 - 16} width={120} height={32} fill={tape} opacity={0.85} transform="rotate(3)" />
      <text x={0} y={role ? -8 : 20} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={INK}>
        {name}
      </text>
      {role && (
        <text x={0} y={48} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={25} letterSpacing={3} fill={INK_SOFT}>
          {role.toUpperCase()}
        </text>
      )}
    </g>
  );
};

// A round rubber stamp that slams on.
export const Stamp: React.FC<{ x: number; y: number; text: string; k: number; color?: string; tilt?: number }> = ({ x, y, text, k, color = CORAL, tilt = -12 }) => {
  if (k <= 0.01) return null;
  const s = 1 + 1.2 * (1 - k);
  const r = Math.max(120, text.length * 17 + 40);
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`} opacity={Math.min(1, k * 1.5)}>
      <circle r={r} fill="none" stroke={color} strokeWidth={10} />
      <circle r={r - 20} fill="none" stroke={color} strokeWidth={3} />
      <text y={14} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={Math.min(46, (r * 1.5) / Math.max(4, text.length) * 1.4)} letterSpacing={3} fill={color}>
        {text.toUpperCase()}
      </text>
    </g>
  );
};

// The whole frame of a scene: paper, then what the scene draws.
export const Sheet: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920">
    <Defs id={id} />
    <PaperBg id={id} />
    {children}
  </svg>
);
