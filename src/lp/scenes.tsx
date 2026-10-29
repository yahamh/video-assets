import React from "react";
import { DISPLAY, GOLD, GOLD_LIGHT, IVORY, RED, SANS, eased, popped, shake } from "../look";
import { SceneProps, num, str } from "../scenes/types";
import { Cam, Obj, rnd } from "./engine";
import { Backdrop, LightCone, Scene3D } from "./Scene3D";
import { Chest, Cushion, FabergeEgg, GOLD as GOLD_M, GOLD_DARK, LookLp, PearDrop, PersonLp, PearlLp, Rough, Stone, group } from "./models";
import { box, ground, lathe, prism } from "./mesh";

// The story scenes in low poly (ali, 29 Oct 2026): the same scenes and options as src/scenes, drawn as flat-shaded 3D.

export const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920">
    {children}
  </svg>
);

// A faceted twinkle: eight thin triangles round a point.
export const LpSparkle: React.FC<{ x: number; y: number; r: number; k: number; color?: string }> = ({ x, y, r, k, color = "#fffaf0" }) => {
  if (k <= 0.01) return null;
  const s = r * (0.6 + 0.4 * k);
  const pts = [0, 1, 2, 3].map((i) => {
    const a = (i * Math.PI) / 2 - Math.PI / 2;
    return [Math.cos(a) * s, Math.sin(a) * s];
  });
  const w = s * 0.17;
  return (
    <g transform={`translate(${x} ${y})`} opacity={k}>
      {pts.map(([px, py], i) => {
        const a = (i * Math.PI) / 2;
        const side = [Math.cos(a) * w, Math.sin(a) * w];
        return (
          <g key={i}>
            <polygon points={`0,0 ${px},${py} ${side[0]},${side[1]}`} fill={color} />
            <polygon points={`0,0 ${px},${py} ${-side[0]},${-side[1]}`} fill={color} opacity={0.72} />
          </g>
        );
      })}
    </g>
  );
};

// A glow made of facets: rings of triangles, fainter outward.
export const FacetGlow: React.FC<{ x: number; y: number; r: number; color?: string; k?: number; t?: number; seed?: number; rings?: number; n?: number }> = ({
  x,
  y,
  r,
  color = GOLD_LIGHT,
  k = 1,
  t = 0,
  seed = 1,
  rings = 4,
  n = 14,
}) => {
  const pt = (ring: number, i: number): [number, number] => {
    if (ring === 0) return [x, y];
    const a = ((i % n) / n) * Math.PI * 2 + (ring % 2) * (Math.PI / n) + (rnd(ring * 31 + (i % n) + seed) - 0.5) * 0.25;
    const rr = (r * ring) / rings;
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
  };
  const tris: { p: [number, number][]; o: number }[] = [];
  for (let ring = 0; ring < rings; ring++)
    for (let i = 0; i < n; i++) {
      const base = Math.pow(1 - (ring + 0.5) / rings, 1.6);
      const tw = 0.75 + 0.25 * Math.sin(t * 1.3 + rnd(ring * 7 + i + seed) * 6.28);
      if (ring === 0) tris.push({ p: [pt(0, 0), pt(1, i), pt(1, i + 1)], o: base * tw });
      else {
        tris.push({ p: [pt(ring, i), pt(ring + 1, i), pt(ring + 1, i + 1)], o: base * tw * (0.8 + rnd(i * 3 + ring) * 0.2) });
        tris.push({ p: [pt(ring, i), pt(ring + 1, i + 1), pt(ring, i + 1)], o: base * tw * 0.85 });
      }
    }
  return (
    <g opacity={k}>
      {tris.map((tr, i) => (
        <polygon key={i} points={tr.p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ")} fill={color} opacity={tr.o * 0.5} />
      ))}
    </g>
  );
};

// Thin rays turning slowly behind the hero piece.
export const Rays: React.FC<{ x: number; y: number; t: number; color: string; k?: number }> = ({ x, y, t, color, k = 1 }) => (
  <g opacity={k}>
    {Array.from({ length: 16 }, (_, i) => {
      const a = ((i * 360) / 16 + t * 14) * (Math.PI / 180);
      const len = 560 + ((i * 97) % 260);
      return (
        <polygon
          key={i}
          points={`${x},${y} ${x + Math.cos(a - 0.05) * len},${y + Math.sin(a - 0.05) * len} ${x + Math.cos(a + 0.05) * len},${y + Math.sin(a + 0.05) * len}`}
          fill={color}
          opacity={i % 2 ? 0.07 : 0.12}
        />
      );
    })}
  </g>
);

// The piece a scene shows, about 2 tall, centred on the origin.
const piece = (show: string, t: number, shape: string, tone: string | undefined, spin = 1): Obj[] => {
  switch (show) {
    case "egg":
      return FabergeEgg(t * spin, { pos: [0, 0.24, 0] });
    case "gem":
    case "glass":
      return Stone(shape, tone, { rot: [0.18 + Math.sin(t * 1.1) * 0.08, Math.sin(t * 0.9) * 0.55 * spin, 0], scale: 1.05 });
    case "pearl":
      return PearDrop({ rot: [0, t * 0.4, Math.sin(t * 1.6) * 0.06], scale: 1.0 }, tone);
    case "round-pearl":
      return PearlLp({ scale: 0.9 }, tone);
    default:
      return Rough({ rot: [t * 0.25 * spin, t * 0.45 * spin, 0.2], scale: 1.05 });
  }
};

// ------------------------------------------------------------------ hook

// The opening shot: the payoff, big and already moving. Options as in scenes/Hook.tsx; parcel and sandwich use the drawn scene.
export const LpHook: React.FC<SceneProps> = ({ t, p }) => {
  const show = str(p.show, "rough");
  const shape = str(p.shape, "cushion");
  const tone = typeof p.tone === "string" ? p.tone : undefined;
  const halo = str(p.halo, "");
  const size = num(p.size, show === "chest" ? 470 : 600) / 600;
  const cy = 1090;
  const bob = Math.sin(t * 2.2) * 0.04;
  const cam: Cam = { pos: [0, 1.4, 11.5 / size], target: [0, 0.48 / size, 0], fov: 30 };
  let objs: Obj[];
  if (show === "chest") {
    objs = [...Chest(0.75, { pos: [0, -1.0, 0], rot: [0, -0.25 + Math.sin(t * 0.6) * 0.08, 0], scale: 0.9 }), ...piece(tone ? "gem" : "rough", t, "round", tone, 0.6).map((o) => ({ ...o, mesh: { ...o.mesh, v: o.mesh.v.map(([x, y, z]) => [x * 0.55, y * 0.55 + 0.25 + bob, z * 0.55] as [number, number, number]) } }))];
  } else objs = piece(show, t, shape, tone).map((o) => ({ ...o, mesh: { ...o.mesh, v: o.mesh.v.map(([x, y, z]) => [x, y + bob, z] as [number, number, number]) } }));
  const pulse = 0.85 + 0.15 * Math.sin(t * 5.3);
  return (
    <Frame>
      <Backdrop t={t} top="#05070e" bottom="#121a30" glow={halo || "#3a3a52"} gx={540} gy={cy} gr={900} />
      <Rays x={540} y={cy} t={t} color={halo || GOLD_LIGHT} k={halo ? 1.5 : 1} />
      <LightCone x={540} bottom={1500} w={900} k={0.9} />
      <FacetGlow x={540} y={cy} r={440 * pulse} color={halo || "#ffe7a8"} t={t} k={halo ? 1.1 : 0.8} />
      <Scene3D objs={objs} cam={cam} opts={{ t }} />
      <LpSparkle x={470} y={cy - 250} r={70 + 40 * Math.max(0, Math.sin(t * 5.2))} k={Math.max(0, Math.sin(t * 5.2))} />
      <LpSparkle x={300} y={cy - 160} r={44} k={0.5 + 0.5 * Math.sin(t * 6.1)} />
      <LpSparkle x={760} y={cy - 210} r={34} k={0.5 + 0.5 * Math.sin(t * 4.7 + 2)} />
      <LpSparkle x={810} y={cy + 60} r={28} k={0.5 + 0.5 * Math.sin(t * 5.3 + 4)} />
    </Frame>
  );
};

// ------------------------------------------------------------------ gift

// A faceted curtain: strips of triangles shaded like folds. `side` -1 is the left curtain, 1 the right.
const Curtain: React.FC<{ x0: number; w: number; t: number; side: number }> = ({ x0, w, t, side }) => {
  const cols = 6;
  const rows = 9;
  const pt = (i: number, j: number): [number, number] => {
    const y = (j / rows) * 1920;
    const sway = Math.sin(t * 0.9 + j * 0.6 + i) * 6 * (j / rows);
    const x = x0 + (i / cols) * w + (i > 0 && i < cols ? (rnd(i * 13 + j * 7 + side * 5) - 0.5) * (w / cols) * 0.35 + sway : 0);
    return [x, y];
  };
  const polys: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const [a, b, c, d] = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
      const lit = 0.55 + 0.45 * Math.sin((i + 0.5) * 1.9 + side);
      const base = [92 * lit + 40, 20 * lit + 9, 32 * lit + 14];
      const k1 = 1 + (rnd(i * 5 + j * 11 + side) - 0.5) * 0.12;
      const f1 = `rgb(${base.map((v) => Math.round(v * k1)).join(",")})`;
      const f2 = `rgb(${base.map((v) => Math.round(v * k1 * 0.82)).join(",")})`;
      const P = (q: [number, number][]) => q.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
      polys.push(<polygon key={`${i}a${j}`} points={P([a, b, c])} fill={f1} stroke={f1} strokeWidth={1} />);
      polys.push(<polygon key={`${i}b${j}`} points={P([a, c, d])} fill={f2} stroke={f2} strokeWidth={1} />);
    }
  const edge = side < 0 ? x0 + w : x0;
  return (
    <g>
      {polys}
      <polygon points={`${edge - 4},0 ${edge + 4},0 ${edge + 4},1920 ${edge - 4},1920`} fill={GOLD} />
    </g>
  );
};

// A pelmet of triangles along the top with a gold edge.
const Pelmet: React.FC = () => {
  const n = 8;
  const w = 1080 / n;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={232} fill="#4a1019" />
      {Array.from({ length: n * 2 }, (_, i) => (
        <polygon key={`f${i}`} points={`${(i * w) / 2},0 ${((i + 1) * w) / 2},0 ${((i + 1) * w) / 2},232 ${(i * w) / 2},232`} fill={i % 2 ? "#521320" : "#45101a"} />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <polygon points={`${i * w},230 ${(i + 1) * w},230 ${(i + 0.5) * w},312`} fill={i % 2 ? "#5c1522" : "#4a1019"} />
          <polygon points={`${(i + 0.5) * w},312 ${(i + 1) * w},230 ${(i + 1) * w - 8},230 ${(i + 0.5) * w},300`} fill={GOLD} />
          <polygon points={`${i * w},230 ${(i + 0.5) * w},312 ${(i + 0.5) * w},300 ${i * w + 8},230`} fill={GOLD_LIGHT} opacity={0.8} />
        </g>
      ))}
    </g>
  );
};

// A handwritten tag on a string, the words written in.
const Tag: React.FC<{ x: number; y: number; t: number; to: string; date: string; write: number; id: string }> = ({ x, y, t, to, date, write, id }) => (
  <g transform={`translate(${x} ${y}) rotate(${-6 + Math.sin(t * 1.8) * 2})`}>
    <polyline points="-150,-90 -80,-70 -24,-8" stroke={GOLD} strokeWidth={4} fill="none" />
    <polygon points="0,-70 240,-70 240,60 0,60 -30,-5" fill="#f3ead6" />
    <polygon points="0,-70 240,-70 240,-20 0,-20 -30,-5" fill="#fbf4e4" />
    <polygon points="-8,-13 0,-5 -8,3 -16,-5" fill="#3b3326" opacity={0.45} />
    <clipPath id={id}>
      <rect x={0} y={-80} width={250 * write} height={160} />
    </clipPath>
    <g clipPath={`url(#${id})`}>
      <text x={122} y={-14} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={to.length > 14 ? 26 : 32} fill="#1d1712">
        {to}
      </text>
      <text x={122} y={34} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={date.length > 15 ? 24 : 28} fill="#1d1712">
        {date}
      </text>
    </g>
  </g>
);

export const LpGift: React.FC<SceneProps> = ({ t, p }) => {
  const to = str(p.to, "For the King");
  const date = str(p.date, "");
  const stone = str(p.stone, "rough");
  const tone = typeof p.tone === "string" ? p.tone : undefined;
  const open = eased(t, 0, 1.0);
  const write = eased(t, 0.5, 1.6);
  const rise = popped(t, 0.15, 0.9);
  const cw = 380 - open * 150;
  const cam: Cam = { pos: [0, 1.7, 14], target: [0, -0.7, 0], fov: 30 };
  const plinth: Obj[] = [
    { mesh: prism(8, 2.3, 0.8), mat: { color: "#2a0d14", spec: 0.15 }, pos: [0, -2.02, 0] },
    { mesh: lathe([[2.42, -0.07], [2.42, 0.07], [2.2, 0.07]], 8, 0, false), mat: GOLD_M, pos: [0, -1.62, 0] },
    { mesh: lathe([[2.42, -0.06], [2.42, 0.06]], 8, 0, false), mat: GOLD_M, pos: [0, -2.42, 0] },
  ];
  const lift = rise * 0.18;
  const item =
    stone === "egg"
      ? FabergeEgg(t, { pos: [0, -0.02, 0], scale: 0.62 })
      : stone === "rough"
        ? Rough({ pos: [0, -0.35 + lift, 0], rot: [t * 0.2, t * 0.4, 0.2], scale: 0.62 })
        : Stone(stone, tone, { pos: [0, -0.3 + lift, 0.1], rot: [0.12, Math.sin(t * 0.9) * 0.4, 0], scale: 0.65 });
  const objs = [...plinth, ...Cushion({ pos: [0, -1.27, 0], rot: [0, 0.35, 0], scale: 0.95 }), ...item];
  return (
    <Frame>
      <Backdrop t={t} top="#06080f" bottom="#141b30" glow="#2b2f48" gx={540} gy={1050} gr={700} />
      <LightCone x={540} bottom={1180} w={720} k={0.95} />
      <FacetGlow x={540} y={1000} r={330} color="#ffe7a8" t={t} k={0.55} />
      <Scene3D objs={objs} cam={cam} opts={{ t }} />
      <LpSparkle x={475} y={880} r={38} k={0.5 + 0.5 * Math.sin(t * 3.6)} />
      <LpSparkle x={625} y={1000} r={28} k={0.5 + 0.5 * Math.sin(t * 2.9 + 2)} />
      <Tag x={600} y={1470} t={t} to={to} date={date} write={write} id="lpGiftTag" />
      <Curtain x0={0} w={cw} t={t} side={-1} />
      <Curtain x0={1080 - cw} w={cw} t={t} side={1} />
      <Pelmet />
    </Frame>
  );
};

// ------------------------------------------------------------------ cast

type Member = LookLp & { expression?: string; react?: { at: number; expression: string }; look?: number };

// The skyline of a town at night: blocks with pointed roofs and lit windows.
export const Skyline: React.FC<{ y: number; seed: number; t: number; x0?: number; x1?: number; roofs?: boolean; color?: string; lights?: number }> = ({ y, seed, t, x0 = 0, x1 = 1080, roofs = true, color = "#0b1020", lights = 1 }) => {
  const out: React.ReactNode[] = [];
  let x = x0 - 20;
  let i = 0;
  while (x < x1) {
    const w = 110 + rnd(seed + i * 3) * 110;
    const h = 160 + rnd(seed + i * 5) * 240;
    const top = y - h;
    const peak = roofs ? 50 + rnd(seed + i * 7) * 70 : 0;
    const c = i % 2 ? color : shadeRgb(color, 1.25);
    out.push(<polygon key={`b${i}`} points={`${x},${y} ${x},${top} ${x + w / 2},${top - peak} ${x + w},${top} ${x + w},${y}`} fill={c} />);
    if (roofs) out.push(<polygon key={`r${i}`} points={`${x + w / 2},${top - peak} ${x + w},${top} ${x + w / 2},${top}`} fill={shadeRgb(color, 0.7)} />);
    for (let r = 0; r < 3; r++)
      for (let q = 0; q < 2; q++) {
        const on = rnd(seed + i * 11 + r * 3 + q) > 0.45;
        const wx = x + w * (0.25 + q * 0.32);
        const wy = top + 40 + r * 70;
        if (wy + 40 > y) continue;
        out.push(<rect key={`w${i}${r}${q}`} x={wx} y={wy} width={24} height={36} fill={on && lights > 0.5 ? "#e9b95e" : "#141b2d"} opacity={on && lights > 0.5 ? 0.55 + 0.15 * Math.sin(t * 0.7 + i + r) : 0.9} />);
      }
    x += w;
    i++;
  }
  return <g>{out}</g>;
};

export const shadeRgb = (c: string, k: number) => {
  const n = parseInt(c.replace("#", ""), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.min(255, Math.round(v * k)));
  return `rgb(${ch.join(",")})`;
};

// Faceted stars: little diamonds that twinkle.
export const LpStars: React.FC<{ t: number; n?: number; top?: number; bottom?: number; x0?: number; x1?: number; seed?: number }> = ({ t, n = 30, top = 80, bottom = 700, x0 = 0, x1 = 1080, seed = 3 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const x = x0 + rnd(i * 7 + seed) * (x1 - x0);
      const y = top + rnd(i * 13 + seed) * (bottom - top);
      const s = 2 + rnd(i * 3 + seed) * 4;
      const k = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + rnd(i)) + i));
      return <polygon key={i} points={`${x},${y - s} ${x + s * 0.6},${y} ${x},${y + s} ${x - s * 0.6},${y}`} fill="#f4e6c4" opacity={k} />;
    })}
  </g>
);

const LpSetting: React.FC<{ kind: string; t: number }> = ({ kind, t }) => {
  switch (kind) {
    case "workshop":
      return (
        <g>
          <Backdrop t={t} top="#0d0a08" bottom="#1a120c" glow="#5a3a1a" gx={880} gy={1000} gr={520} seed={11} />
          <svg x={160} y={300} width={760} height={600} viewBox="160 300 760 600" overflow="hidden">
            <Backdrop t={t} top="#04060b" bottom="#1c2742" cell={110} seed={5} />
            <LpStars t={t} n={18} top={320} bottom={520} x0={170} x1={910} />
            <Skyline y={900} seed={21} t={t} x0={160} x1={920} />
          </svg>
          {[
            [160, 300, 760, 12],
            [160, 888, 760, 12],
            [160, 300, 12, 600],
            [908, 300, 12, 600],
            [534, 300, 12, 600],
          ].map(([x, y, w, h], i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} fill={GOLD_DARK.color} />
              <polygon points={`${x},${y} ${x + w},${y} ${x + w - Math.min(w, h) / 2},${y + Math.min(w, h) / 2} ${x + Math.min(w, h) / 2},${y + Math.min(w, h) / 2}`} fill={GOLD} />
            </g>
          ))}
          <FacetGlow x={900} y={1000} r={330} color="#ffcf7a" t={t} k={0.75} seed={4} />
        </g>
      );
    case "street":
      return (
        <g>
          <Backdrop t={t} top="#04060b" bottom="#1c2742" seed={7} />
          <LpStars t={t} n={25} top={80} bottom={500} />
          <Skyline y={1000} seed={41} t={t} roofs={false} />
          <polygon points="0,1000 1080,1000 1080,1920 0,1920" fill="#080b14" />
          <FacetGlow x={170} y={760} r={260} color="#ffd98a" t={t} k={0.85} seed={9} />
          <polygon points="160,780 176,780 182,1980 154,1980" fill="#07090f" />
          <polygon points="148,736 188,736 182,782 154,782" fill="#ffe2a0" />
          <polygon points="148,736 168,720 188,736" fill="#07090f" />
        </g>
      );
    case "study":
      return (
        <g>
          <Backdrop t={t} top="#100c0a" bottom="#1a1310" glow="#4a3418" gx={820} gy={900} gr={600} seed={13} />
          {[0, 1, 2, 3, 4].map((r) => (
            <g key={r}>
              {Array.from({ length: 22 }, (_, i) => {
                const w = 26 + rnd(r * 30 + i) * 22;
                const h = 110 + rnd(r * 30 + i + 9) * 60;
                const x = 70 + i * 43;
                const base = 420 + r * 190;
                const lean = rnd(r * 17 + i) > 0.85 ? 10 : 0;
                const c = ["#3a1a1e", "#1d2a3a", "#2f2a1a", "#1e2e24"][(r + i) % 4];
                return (
                  <g key={i}>
                    <polygon points={`${x},${base} ${x + lean},${base - h} ${x + w + lean},${base - h} ${x + w},${base}`} fill={c} />
                    <polygon points={`${x + w * 0.55 + lean * 0.5},${base - h} ${x + w + lean},${base - h} ${x + w},${base} ${x + w * 0.55},${base}`} fill="#000" opacity={0.25} />
                    <rect x={x + 4} y={base - h * 0.75} width={w - 8} height={6} fill={GOLD} opacity={0.35} />
                  </g>
                );
              })}
              <polygon points={`60,${420 + r * 190} 1020,${420 + r * 190} 1010,${436 + r * 190} 70,${436 + r * 190}`} fill={GOLD_DARK.color} />
            </g>
          ))}
          <FacetGlow x={820} y={900} r={380} color="#ffd38a" t={t} k={0.6} seed={6} />
        </g>
      );
    case "palace":
      return (
        <g>
          <Backdrop t={t} top="#170a10" bottom="#2a1018" glow="#6a3a20" gx={540} gy={360} gr={500} seed={15} />
          {[120, 380, 700, 960].map((x) => (
            <g key={x}>
              <polygon points={`${x - 40},0 ${x + 40},0 ${x + 40},1920 ${x - 40},1920`} fill="#24101a" />
              <polygon points={`${x},0 ${x + 40},0 ${x + 40},1920 ${x},1920`} fill="#1a0a12" />
              <polygon points={`${x - 44},0 ${x - 36},0 ${x - 36},1920 ${x - 44},1920`} fill={GOLD} opacity={0.6} />
            </g>
          ))}
          <FacetGlow x={540} y={300} r={260} color="#ffe2a0" t={t} k={0.8} seed={2} />
        </g>
      );
    case "vault":
      return (
        <g>
          <Backdrop t={t} top="#0c0f16" bottom="#151b28" seed={17} />
          {Array.from({ length: 16 }, (_, i) => {
            const a0 = (i / 16) * Math.PI * 2;
            const a1 = ((i + 1) / 16) * Math.PI * 2;
            const R = 420;
            return (
              <polygon
                key={i}
                points={`540,760 ${540 + Math.cos(a0) * R},${760 + Math.sin(a0) * R} ${540 + Math.cos(a1) * R},${760 + Math.sin(a1) * R}`}
                fill={i % 2 ? "#1a2232" : "#141b28"}
                stroke={GOLD}
                strokeOpacity={0.3}
                strokeWidth={2}
              />
            );
          })}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x = 540 + Math.cos(a) * 380;
            const y = 760 + Math.sin(a) * 380;
            return <polygon key={i} points={`${x},${y - 12} ${x + 12},${y} ${x},${y + 12} ${x - 12},${y}`} fill={GOLD} opacity={0.7} />;
          })}
        </g>
      );
    case "mine":
      return (
        <g>
          <Backdrop t={t} top="#04060b" bottom="#1c2742" seed={19} />
          <LpStars t={t} n={40} top={80} bottom={760} />
          <polygon points="830,376 868,394 884,430 868,466 830,484 792,466 776,430 792,394" fill="#f6ecd2" />
          <polygon points="0,880 180,830 360,860 560,820 760,870 940,830 1080,860 1080,1920 0,1920" fill="#0d121e" />
          <polygon points="0,880 180,830 260,1920 0,1920" fill="#101827" />
          <polygon points="560,820 760,870 820,1920 500,1920" fill="#0f1625" />
        </g>
      );
    case "ship":
      return (
        <g>
          <Backdrop t={t} top="#04060b" bottom="#1c2742" seed={23} />
          <LpStars t={t} n={40} top={80} bottom={760} />
          <polygon points="840,362 880,380 898,420 880,460 840,478 800,460 782,420 800,380" fill="#f6ecd2" />
          {Array.from({ length: 5 }, (_, r) =>
            Array.from({ length: 10 }, (_, i) => {
              const y = 880 + r * 60;
              const x = i * 120 - ((t * 60 + r * 40) % 120);
              return <polygon key={`${r}-${i}`} points={`${x},${y + 60} ${x + 60},${y} ${x + 120},${y + 60}`} fill={r % 2 ? "#0c1424" : "#101b30"} stroke={GOLD} strokeOpacity={0.3} strokeWidth={2} />;
            }),
          )}
          <rect y={1150} width={1080} height={800} fill="#120e0a" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={0} y={1000 + i * 50} width={1080} height={6} fill={GOLD} opacity={0.7} />
          ))}
        </g>
      );
    default:
      return <Backdrop t={t} top="#06080f" bottom="#141b30" glow="#2a3356" gx={540} gy={760} gr={800} seed={29} />;
  }
};

export const LpCast: React.FC<SceneProps> = ({ t, p }) => {
  const cast = (Array.isArray(p.cast) ? (p.cast as Member[]) : [{}]).slice(0, 3);
  const setting = str(p.setting, "plain");
  const name = str(p.name, "");
  const role = str(p.role, "");
  const gaspAt = num(p.gasp, -1);
  const gasp = gaspAt >= 0 ? Math.sin(Math.min(1, Math.max(0, (t - gaspAt) / 0.5)) * Math.PI) : 0;
  const n = cast.length;
  const enter = popped(t, 0, 0.45);
  const card = eased(t, 0.25, 0.6);
  const spots = n === 1 ? [[0, 0]] : n === 2 ? [[-3.3, 0.6], [3.3, 0.6]] : [[-4.6, 1.4], [0, 0.4], [4.6, 1.4]];
  const dist = n === 1 ? 20 : n === 2 ? 26 : 31;
  const cam: Cam = { pos: [0, 2.6, dist], target: [0, 1.2 - (1 - enter) * 0.5, 0], fov: 30 };
  const objs: Obj[] = cast.flatMap((m, i) => {
    const [x, z] = spots[i];
    const ex = m.react && t >= m.react.at ? m.react.expression : m.expression ?? "neutral";
    const face = n > 1 ? (x < 0 ? 0.35 : x > 0 ? -0.35 : 0) : 0;
    const look = (m.look ?? 0) + face;
    return group(PersonLp(m, ex, t + i * 0.7, look, i === 0 ? gasp : 0, i * 7 + 1), {
      pos: [x + (i === 0 ? -gasp * 0.15 : 0), 0, -z],
      rot: [i === 0 ? -gasp * 0.06 : 0, face * 0.6, 0],
    });
  });
  return (
    <Frame>
      <LpSetting kind={setting} t={t} />
      <Scene3D objs={objs} cam={cam} opts={{ t }} />
      {name && (
        <g opacity={card} transform={`translate(${(1 - card) * -40} 0)`}>
          <polygon points={`70,300 76,300 76,${300 + (role ? 118 : 70)} 70,${300 + (role ? 118 : 70)}`} fill={GOLD} />
          <text x={96} y={352} fontFamily={DISPLAY} fontStyle="italic" fontWeight={700} fontSize={56} fill={GOLD_LIGHT}>
            {name}
          </text>
          {role && (
            <text x={98} y={404} fontFamily={SANS} fontWeight={700} fontSize={28} letterSpacing={6} fill={IVORY}>
              {role.toUpperCase()}
            </text>
          )}
        </g>
      )}
    </Frame>
  );
};

// ------------------------------------------------------------------ title

// Words alone, over facets, with a few gold shards drifting.
export const LpTitle: React.FC<SceneProps> = ({ t, p }) => {
  const text = str(p.text, "");
  const sub = str(p.sub, "");
  const a = popped(t, 0.02, 0.35);
  const spread = eased(t, 0, 2.5);
  const lines = text.split("\n");
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(longest > 10 ? 120 : 200, Math.round(1700 / longest));
  const lastY = 820 + (lines.length - 1) * size * 1.05;
  const shards = Array.from({ length: 9 }, (_, i) => {
    const x = 120 + rnd(i * 5 + 1) * 840;
    const y = 300 + rnd(i * 9 + 2) * 1100 - t * (10 + rnd(i) * 16);
    if (Math.abs(y - 700) < 230 && x > 140 && x < 940) return null;
    const s = 10 + rnd(i * 3) * 18;
    const r = t * (0.4 + rnd(i * 7)) + i;
    const pts = [0, 1, 2].map((k) => {
      const ang = r + (k * Math.PI * 2) / 3 + (k === 1 ? 0.4 : 0);
      return `${x + Math.cos(ang) * s},${y + Math.sin(ang) * s * 1.3}`;
    });
    return <polygon key={i} points={pts.join(" ")} fill={i % 2 ? GOLD : GOLD_LIGHT} opacity={0.35 + 0.3 * Math.sin(t * 2 + i)} />;
  });
  const bar = (y: number) => (
    <polygon points={`${540 - 260 * spread},${y} ${540},${y - 3} ${540 + 260 * spread},${y} ${540},${y + 3}`} fill={GOLD} />
  );
  return (
    <Frame>
      <defs>
        <linearGradient id="lpTiGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1c4" />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <Backdrop t={t} top="#0a0e18" bottom="#0a0e18" glow="#26305a" gx={540} gy={760} gr={900} seed={31} />
      {shards}
      {sub && (
        <text x={540} y={580} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={36} letterSpacing={12} fill={IVORY} opacity={a}>
          {sub.toUpperCase()}
        </text>
      )}
      {bar(620)}
      {lines.map((l, i) => (
        <text key={i} x={540} y={760 + i * size * 1.05} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontWeight={700} fontSize={size} fill="url(#lpTiGold)" opacity={a} letterSpacing={2 + 10 * (1 - spread)}>
          {l}
        </text>
      ))}
      {bar(lastY)}
      <LpSparkle x={540 + 260 * spread} y={620} r={26} k={a * (0.5 + 0.5 * Math.sin(t * 5))} />
    </Frame>
  );
};

// ------------------------------------------------------------------ reveal

// A chest under a light opens to show what's inside; a red word can slam on top. Options as in scenes/Reveal.tsx.
export const LpReveal: React.FC<SceneProps> = ({ t, p }) => {
  const item = str(p.item, "rough");
  const shape = str(p.shape, "round");
  const tone = typeof p.tone === "string" ? p.tone : item === "glass" ? "#dcebe4" : undefined;
  const openAt = num(p.openAt, 0.25);
  const stampText = str(p.stamp, "");
  const stampAt = num(p.stampAt, 1.2);
  const label = str(p.label, "");
  const halo = str(p.halo, "");
  const light = str(p.light, "");
  const dark = p.dark === true;
  const open = popped(t, openAt, openAt + 0.45);
  const stampK = stampText ? popped(t, stampAt, stampAt + 0.12) : 0;
  const [sx, sy] = stampText ? shake(t, stampAt + 0.05, 18) : [0, 0];
  const cam: Cam = { pos: [0, 4.6, 17], target: [0, 0.35, 0], fov: 30 };
  const floor: Obj = { mesh: ground(30, 14, 12, 6, () => 0), mat: { color: "#1a130d", spec: 0.05 }, pos: [0, -1.4, 2.5] };
  const rise = open * 1.0;
  const inside: Obj[] =
    item === "empty"
      ? [{ mesh: box(2.6, 0.05, 1.5), mat: { color: "#3a0f1a" }, pos: [0, 0.45, 0] }]
      : group(
          item === "egg"
            ? FabergeEgg(t, { scale: 0.5 })
            : item === "pearl"
              ? PearDrop({ rot: [0, t * 0.5, 0], scale: 0.55 }, tone)
              : item === "gem" || item === "glass"
                ? Stone(shape, tone, { rot: [0.25, Math.sin(t) * 0.4, 0], scale: 0.55 })
                : Rough({ rot: [t * 0.3, t * 0.5, 0.2], scale: 0.6 }),
          { pos: [0, 0.2 + rise, 0.1] },
        );
  if (item === "glass") inside.forEach((o) => (o.mat = { ...o.mat, sparkle: 0.2 }));
  const objs: Obj[] = [floor, ...Chest(open, { pos: [0, -0.7, 0], rot: [0, -0.42, 0], scale: 0.95 }), ...(open > 0.05 ? inside : [])];
  return (
    <Frame>
      <g transform={`translate(${sx} ${sy})`}>
        <Backdrop t={t} top="#05070e" bottom="#10141f" glow={light || "#2a2f48"} gx={540} gy={800} gr={700} seed={37} />
        <LightCone x={540} bottom={1250} w={820} k={dark ? 0.08 : 0.9} color={light || undefined} />
        {halo && open > 0 && <FacetGlow x={540} y={760} r={300 * (0.85 + 0.15 * Math.sin(t * 5))} color={halo} t={t} k={open * 1.2} />}
        {!halo && !dark && open > 0 && <FacetGlow x={540} y={780} r={260} color="#ffe7a8" t={t} k={open * 0.6} />}
        <Scene3D objs={objs} cam={cam} opts={{ t, ambient: dark ? 0.15 : 0.28 }} />
        {item !== "empty" && <LpSparkle x={500} y={720 - open * 120} r={36} k={open * (0.5 + 0.5 * Math.sin(t * 4)) * (item === "glass" ? 0.4 : 1)} />}
        {stampText && (
          <g transform={`translate(540 860) rotate(-12) scale(${2.4 - 1.4 * stampK})`} opacity={stampK}>
            <polygon points="-190,-62 190,-62 190,62 -190,62" fill="none" stroke={RED} strokeWidth={10} />
            <text x={0} y={30} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={96} letterSpacing={10} fill={RED}>
              {stampText.toUpperCase()}
            </text>
          </g>
        )}
      </g>
      {label && (
        <text x={540} y={340} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={58} fill={GOLD_LIGHT} opacity={eased(t, 0.05, 0.4)}>
          {label}
        </text>
      )}
    </Frame>
  );
};

// ------------------------------------------------------------------ end

export const LpEnd: React.FC<SceneProps> = ({ t, p }) => {
  const line = str(p.line, "A new jewelry story every day");
  const handle = str(p.handle, "HeyGema");
  const a = popped(t, 0.05, 0.45);
  const b = popped(t, 0.3, 0.7);
  const cam: Cam = { pos: [0, 0, 12], target: [0, 0, 0], fov: 30 };
  const gemObjs = group(Stone("round", undefined, { rot: [0, t * 0.8 + (1 - a) * -1.5, 0], scale: 0.95 * (0.8 + 0.2 * a) }, false), { pos: [0, 0.87, 0], rot: [0.62, 0, 0] });
  return (
    <Frame>
      <Backdrop t={t} top="#0a0e18" bottom="#0a0e18" glow="#26305a" gx={540} gy={760} gr={800} seed={41} />
      <g opacity={a}>
        <FacetGlow x={540} y={700} r={260} color="#ffe7a8" t={t} k={0.6} />
        <Scene3D objs={gemObjs} cam={cam} opts={{ t }} />
      </g>
      <LpSparkle x={590} y={650} r={50} k={a * (0.5 + 0.5 * Math.sin(t * 4))} />
      <polygon points={`340,900 540,897 740,900 540,903`} fill={GOLD} opacity={a} />
      <text x={540} y={1000} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={64} fill={IVORY} opacity={a}>
        {line}
      </text>
      <text x={540} y={1110} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={76} letterSpacing={2} fill={GOLD_LIGHT} opacity={b}>
        {handle}
      </text>
    </Frame>
  );
};
