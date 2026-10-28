import React from "react";

// Colour helpers: mix two hex colours, and lighten (k > 0) or darken (k < 0) one.
const hex = (c: string) => {
  const h = c.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
export const shade = (c: string, k: number) => (k >= 0 ? mix(c, "#ffffff", k) : mix(c, "#000000", -k));

// Gradients for the three gold colours and platinum.
export const METALS: Record<string, [string, string, string]> = {
  yellow: ["#a87b2c", "#f0cf75", "#8a6420"],
  white: ["#8b949c", "#f1f4f6", "#6f7880"],
  rose: ["#a5684f", "#f3c4ab", "#8a503b"],
};
export const MetalGradient: React.FC<{ id: string; metal?: string; vertical?: boolean }> = ({ id, metal = "yellow", vertical }) => {
  const [a, b, c] = METALS[metal] ?? METALS.yellow;
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
      <stop offset="0" stopColor={a} />
      <stop offset="0.45" stopColor={b} />
      <stop offset="0.7" stopColor={a} />
      <stop offset="1" stopColor={c} />
    </linearGradient>
  );
};

// Small drawing pieces the scenes share.

// A four-point twinkle. `k` 0..1 is its brightness.
export const Sparkle: React.FC<{ x: number; y: number; r: number; k: number; color?: string }> = ({
  x,
  y,
  r,
  k,
  color = "#fffaf0",
}) => {
  if (k <= 0.01) return null;
  const s = r * (0.6 + 0.4 * k);
  const w = s * 0.16;
  return (
    <g transform={`translate(${x} ${y})`} opacity={k}>
      <circle r={s * 0.9} fill={color} opacity={0.18} />
      <path
        d={`M0 ${-s} Q${w} ${-w} ${s} 0 Q${w} ${w} 0 ${s} Q${-w} ${w} ${-s} 0 Q${-w} ${-w} 0 ${-s}Z`}
        fill={color}
      />
    </g>
  );
};

// Rows of little arcs, the woodblock way of drawing the sea. `shift` moves them sideways.
export const Waves: React.FC<{
  top: number;
  bottom: number;
  shift: number;
  color: string;
  stroke: string;
  rowGap?: number;
  arc?: number;
}> = ({ top, bottom, shift, color, stroke, rowGap = 70, arc = 60 }) => {
  const rows = [];
  for (let y = top + rowGap * 0.7, r = 0; y < bottom + rowGap; y += rowGap, r++) {
    const off = ((shift * (1 + r * 0.15)) % arc) - arc + (r % 2 ? arc / 2 : 0);
    let d = "";
    for (let x = off - arc; x < 1080 + arc; x += arc) d += `M${x} ${y} q${arc / 2} ${-arc * 0.42} ${arc} 0 `;
    rows.push(<path key={r} d={d} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" opacity={0.55} />);
  }
  return (
    <g>
      <rect x={0} y={top} width={1080} height={bottom - top} fill={color} />
      {rows}
    </g>
  );
};

// A faceted cut stone seen from the front. `shape`: round, pear, cushion, emerald, marquise, heart, oval.
export const CutGem: React.FC<{
  x: number;
  y: number;
  size: number;
  shape: string;
  tone?: string;
  rot?: number;
}> = ({ x, y, size, shape, tone = "#e9f1f6", rot = 0 }) => {
  const s = size / 2;
  let outline = "";
  switch (shape) {
    case "pear":
      outline = `M0 ${-s * 1.25} C${s * 0.55} ${-s * 0.55} ${s} ${s * 0.1} ${s} ${s * 0.4} A${s} ${s * 0.85} 0 0 1 ${-s} ${s * 0.4} C${-s} ${s * 0.1} ${-s * 0.55} ${-s * 0.55} 0 ${-s * 1.25}Z`;
      break;
    case "cushion":
      outline = `M${-s * 0.7} ${-s} H${s * 0.7} Q${s} ${-s} ${s} ${-s * 0.7} V${s * 0.7} Q${s} ${s} ${s * 0.7} ${s} H${-s * 0.7} Q${-s} ${s} ${-s} ${s * 0.7} V${-s * 0.7} Q${-s} ${-s} ${-s * 0.7} ${-s}Z`;
      break;
    case "emerald":
      outline = `M${-s * 0.55} ${-s * 0.8} H${s * 0.55} L${s * 0.75} ${-s * 0.6} V${s * 0.6} L${s * 0.55} ${s * 0.8} H${-s * 0.55} L${-s * 0.75} ${s * 0.6} V${-s * 0.6}Z`;
      break;
    case "marquise":
      outline = `M0 ${-s * 1.2} Q${s * 0.95} 0 0 ${s * 1.2} Q${-s * 0.95} 0 0 ${-s * 1.2}Z`;
      break;
    case "heart":
      outline = `M0 ${s * 0.95} C${-s * 1.3} ${-s * 0.1} ${-s * 0.6} ${-s * 1.2} 0 ${-s * 0.45} C${s * 0.6} ${-s * 1.2} ${s * 1.3} ${-s * 0.1} 0 ${s * 0.95}Z`;
      break;
    case "oval":
      outline = `M0 ${-s * 1.15} A${s * 0.8} ${s * 1.15} 0 1 1 0 ${s * 1.15} A${s * 0.8} ${s * 1.15} 0 1 1 0 ${-s * 1.15}Z`;
      break;
    default:
      outline = `M0 ${-s} A${s} ${s} 0 1 1 0 ${s} A${s} ${s} 0 1 1 0 ${-s}Z`;
  }
  const id = `g${shape}${Math.round(x)}${Math.round(y)}${tone.replace("#", "")}`;
  const clear = tone === "#e9f1f6";
  // Facet lines: a table in the middle and spokes to the edge.
  const spokes = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    spokes.push(
      <line key={i} x1={Math.cos(a) * s * 0.42} y1={Math.sin(a) * s * 0.42} x2={Math.cos(a) * s * 1.3} y2={Math.sin(a) * s * 1.3} />,
    );
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <defs>
        <clipPath id={id}>
          <path d={outline} />
        </clipPath>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(tone, 0.7)} />
          <stop offset="0.45" stopColor={tone} />
          <stop offset="1" stopColor={clear ? "#9fb3c4" : shade(tone, -0.45)} />
        </linearGradient>
      </defs>
      <path d={outline} fill={`url(#${id}f)`} />
      <g clipPath={`url(#${id})`} stroke="#ffffff" strokeOpacity={clear ? 0.7 : 0.45} strokeWidth={Math.max(1, size / 60)}>
        <polygon
          points={Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
            return `${Math.cos(a) * s * 0.42},${Math.sin(a) * s * 0.42}`;
          }).join(" ")}
          fill="#ffffff"
          fillOpacity={0.25}
        />
        {spokes}
        <path d={`M${-s * 1.5} ${s * 0.2} L${s * 1.5} ${-s * 0.6}`} strokeOpacity={0.25} strokeWidth={size / 12} />
      </g>
      <path d={outline} fill="none" stroke={clear ? "#5f7486" : shade(tone, -0.55)} strokeOpacity={0.55} strokeWidth={Math.max(1.5, size / 45)} />
    </g>
  );
};

// The big rough crystal, before cutting. `turn` -1..1 shifts the light across its faces.
export const RoughDiamond: React.FC<{ x: number; y: number; size: number; turn: number }> = ({ x, y, size, turn }) => {
  const k = size / 400;
  const P = (px: number, py: number) => `${px * k},${py * k}`;
  const faces: [string, number][] = [
    [[P(-190, -40), P(-60, -175), P(10, -60), P(-110, 40)].join(" "), 0.95],
    [[P(-60, -175), P(120, -150), P(10, -60)].join(" "), 0.75],
    [[P(120, -150), P(200, -10), P(70, 30), P(10, -60)].join(" "), 0.55],
    [[P(-110, 40), P(10, -60), P(70, 30), P(-20, 150)].join(" "), 0.82],
    [[P(70, 30), P(200, -10), P(150, 120), P(-20, 150)].join(" "), 0.45],
    [[P(-190, -40), P(-110, 40), P(-20, 150), P(-150, 95)].join(" "), 0.65],
    [[P(-150, 95), P(-20, 150), P(150, 120), P(30, 185)].join(" "), 0.38],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={210 * k} rx={190 * k} ry={22 * k} fill="#000" opacity={0.25} />
      {faces.map(([pts, base], i) => {
        const l = Math.min(1, Math.max(0.2, base + turn * (i % 2 ? 0.18 : -0.14)));
        const c = Math.round(150 + l * 100);
        return (
          <polygon
            key={i}
            points={pts}
            fill={`rgb(${c - 12},${c - 2},${Math.min(255, c + 8)})`}
            stroke="#ffffff"
            strokeOpacity={0.55}
            strokeWidth={2.5 * k}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
};

// A small standing figure, the same in every story: hat, coat, a dot for a face.
export const Figure: React.FC<{ x: number; y: number; h: number; coat?: string; hat?: boolean; flip?: boolean }> = ({
  x,
  y,
  h,
  coat = "#3d3a46",
  hat = true,
  flip = false,
}) => {
  const k = h / 100;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -k : k} ${k})`}>
      <rect x={-9} y={-52} width={18} height={50} rx={6} fill={coat} />
      <rect x={-8} y={-4} width={6} height={4} fill="#1d1a19" />
      <rect x={2} y={-4} width={6} height={4} fill="#1d1a19" />
      <circle cx={0} cy={-62} r={10} fill="#e8c9a8" />
      {hat && <path d="M-15 -66 H15 V-69 H9 V-82 H-9 V-69 H-15 Z" fill="#26211f" />}
    </g>
  );
};

// A pearl with a soft highlight. `tone` for coloured pearls (golden, black, pink).
export const Pearl: React.FC<{ x: number; y: number; r: number; tone?: string }> = ({ x, y, r, tone = "#f3eee4" }) => {
  const id = `pr${Math.round(x)}${Math.round(y)}${Math.round(r)}${tone.replace("#", "")}`;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="0.35" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor={tone} />
          <stop offset="1" stopColor={shade(tone, -0.35)} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} stroke={shade(tone, -0.5)} strokeOpacity={0.35} strokeWidth={Math.max(1, r / 14)} />
    </g>
  );
};

// A pear-shaped pearl hanging point up, `h` tall, centred on (x, y). `tone` as for Pearl.
export const PearPearl: React.FC<{ x: number; y: number; h: number; tone?: string }> = ({ x, y, h, tone = "#f3eee4" }) => {
  const id = `pp${Math.round(x)}${Math.round(y)}${Math.round(h)}${tone.replace("#", "")}`;
  const w = h * 0.36; // half width at the round end
  const top = y - h / 2;
  const d = `M${x} ${top} C${x + w * 0.35} ${top + h * 0.22} ${x + w} ${top + h * 0.42} ${x + w} ${top + h * 0.68}
    A${w} ${h * 0.32} 0 0 1 ${x - w} ${top + h * 0.68} C${x - w} ${top + h * 0.42} ${x - w * 0.35} ${top + h * 0.22} ${x} ${top}Z`;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="0.36" cy="0.62" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor={tone} />
          <stop offset="0.8" stopColor={shade(tone, -0.25)} />
          <stop offset="1" stopColor={shade(tone, -0.42)} />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} stroke={shade(tone, -0.5)} strokeOpacity={0.35} strokeWidth={Math.max(1, h / 90)} />
      <ellipse cx={x - w * 0.38} cy={top + h * 0.6} rx={w * 0.16} ry={h * 0.1} fill="#ffffff" opacity={0.55} />
    </g>
  );
};

// A cone of light from above, `k` 0..1 its strength.
export const Spotlight: React.FC<{ x: number; top?: number; bottom: number; w: number; k?: number; color?: string; id: string }> = ({
  x,
  top = 0,
  bottom,
  w,
  k = 1,
  color = "#fff3d6",
  id,
}) => (
  <g opacity={k}>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity={0.5} />
        <stop offset="1" stopColor={color} stopOpacity={0.05} />
      </linearGradient>
      <radialGradient id={`${id}p`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={color} stopOpacity={0.35} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <polygon points={`${x - 40},${top} ${x + 40},${top} ${x + w / 2},${bottom} ${x - w / 2},${bottom}`} fill={`url(#${id})`} />
    <ellipse cx={x} cy={bottom} rx={w * 0.6} ry={w * 0.12} fill={`url(#${id}p)`} />
  </g>
);

// Stars in a night sky, twinkling slowly.
export const Stars: React.FC<{ t: number; n?: number; top?: number; bottom?: number }> = ({ t, n = 40, top = 60, bottom = 900 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const r = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const q = (Math.sin(i * 78.233) * 12345.678) % 1;
      const x = Math.abs(r) * 1080;
      const y = top + Math.abs(q) * (bottom - top);
      const k = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + Math.abs(q)) + i));
      return <circle key={i} cx={x} cy={y} r={1.2 + Math.abs(r * 7) % 2} fill="#f6ecd2" opacity={k * 0.8} />;
    })}
  </g>
);

// A man in a long coat and hat seen as a dark shape, lit from one side in gold.
export const Silhouette: React.FC<{ x: number; y: number; h: number; hat?: string; flip?: boolean; rim?: string; lantern?: boolean; t?: number }> = ({
  x,
  y,
  h,
  hat = "bowler",
  flip = false,
  rim = "#d9b45f",
  lantern = false,
  t = 0,
}) => {
  const k = h / 400;
  const body = "M-62 -250 Q-70 -150 -78 0 H78 Q70 -150 62 -250 Q40 -285 0 -288 Q-40 -285 -62 -250Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -k : k} ${k})`}>
      <path d={body} fill="#06080e" stroke={rim} strokeOpacity={0.6} strokeWidth={4} />
      <rect x={-46} y={-6} width={30} height={10} fill="#06080e" />
      <rect x={16} y={-6} width={30} height={10} fill="#06080e" />
      <ellipse cx={0} cy={-322} rx={36} ry={42} fill="#06080e" stroke={rim} strokeOpacity={0.6} strokeWidth={4} />
      {hat === "bowler" && <path d="M-58 -338 H58 Q48 -350 34 -352 Q34 -400 0 -402 Q-34 -400 -34 -352 Q-48 -350 -58 -338Z" fill="#06080e" stroke={rim} strokeOpacity={0.6} strokeWidth={4} />}
      {hat === "top" && <path d="M-60 -340 H60 V-352 H36 V-420 H-36 V-352 H-60Z" fill="#06080e" stroke={rim} strokeOpacity={0.6} strokeWidth={4} />}
      {hat === "cap" && <path d="M-40 -350 Q0 -390 40 -350 L70 -340 H-40Z" fill="#06080e" stroke={rim} strokeOpacity={0.6} strokeWidth={4} />}
      <path d="M62 -250 Q70 -150 78 0" fill="none" stroke={rim} strokeWidth={6} opacity={0.9} />
      {lantern && (
        <g transform="translate(96 -120)">
          <circle r={70} fill="#ffd27a" opacity={0.18 + 0.05 * Math.sin(t * 9)} />
          <rect x={-14} y={-22} width={28} height={40} rx={4} fill="#ffd98a" stroke="#06080e" strokeWidth={4} />
          <line x1={-30} y1={-40} x2={0} y2={-22} stroke="#06080e" strokeWidth={4} />
        </g>
      )}
    </g>
  );
};
