import React from "react";
import { rand } from "../look";
import { CORAL, CREAM, INK, LILAC, LIME, MINT, PINK, SKY, SUN, metal, smooth, tint } from "./kit";

// The things the stories show, drawn flat in the paper look, each centred on (0, 0) about `s` pixels from its middle
// to its edge. Stones are flat facets in a tone with thin white facet lines; metal is two flat shades.

const DIAMOND = "#dceef6";

type Pt = [number, number];
const pts = (a: Pt[]) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const lerp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

// The outline of a stone shape, as points round its middle, about 1 tall.
const outline = (shape: string, n = 24): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a), sn = Math.sin(a);
    switch (shape) {
      case "oval":
        out.push([sn * 0.74, -c]);
        break;
      case "cushion": {
        const e = 0.38;
        out.push([Math.sign(sn) * Math.pow(Math.abs(sn), e) * 0.9, -Math.sign(c) * Math.pow(Math.abs(c), e) * 0.9]);
        break;
      }
      case "pear": {
        const w = Math.pow((1 - c) / 2, 0.42);
        out.push([sn * 0.78 * w, -c * 1.02 + 0.06]);
        break;
      }
      case "marquise":
        out.push([sn * 0.55 * Math.pow(Math.abs(sn), 0.25), -c]);
        break;
      case "heart": {
        const x = 16 * Math.pow(sn, 3), y = 13 * c - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
        out.push([x / 17, -y / 16 + 0.1]);
        break;
      }
      default:
        out.push([sn, -c]);
    }
  }
  return out;
};

// A polygon with cut corners: emerald, asscher, radiant, princess.
const stepOutline = (w: number, h: number, cut: number): Pt[] => [
  [-w + cut, -h], [w - cut, -h], [w, -h + cut], [w, h - cut], [w - cut, h], [-w + cut, h], [-w, h - cut], [-w, -h + cut],
];

// One cut stone, seen from above.
export const Gem: React.FC<{ shape?: string; tone?: string; s: number; t?: number; glint?: number }> = ({ shape = "round", tone, s, t = 0, glint = 1 }) => {
  const base = tone ?? DIAMOND;
  const clear = !tone;
  const flash = [PINK, SKY, LIME, SUN, LILAC];
  const faces: React.ReactNode[] = [];
  const lines: string[] = [];
  const shine = (i: number) => 0.5 + 0.5 * Math.sin(t * 2.4 + i * 1.7);
  const face = (i: number) => {
    if (clear) {
      const k = rand(i * 3.1);
      return k < 0.3 ? tint(flash[i % flash.length], 0.45) : k < 0.55 ? "#9fb8c6" : k < 0.7 ? "#5d7385" : tint(base, 0.4 * shine(i));
    }
    const k = rand(i * 2.3);
    return k < 0.3 ? tint(base, -0.35) : k < 0.55 ? tint(base, 0.25 + 0.25 * shine(i)) : k < 0.7 ? tint(base, -0.15) : base;
  };
  let edge: Pt[];
  if (shape === "emerald" || shape === "asscher") {
    const w = shape === "asscher" ? 0.82 : 0.68, h = 0.95, cut = 0.24;
    edge = stepOutline(w, h, cut);
    const rings = [0, 0.18, 0.36, 0.52].map((k) => stepOutline(w * (1 - k), h * (1 - k * (w / h) * 1.1), cut * (1 - k)));
    for (let r = 0; r < 3; r++)
      for (let i = 0; i < 8; i++) {
        const a = rings[r][i], b = rings[r][(i + 1) % 8], c = rings[r + 1][(i + 1) % 8], d = rings[r + 1][i];
        faces.push(<polygon key={`f${r}-${i}`} points={pts([a, b, c, d].map(([x, y]) => [x * s, y * s] as Pt))} fill={face(r * 8 + i)} />);
      }
    faces.push(<polygon key="table" points={pts(rings[3].map(([x, y]) => [x * s, y * s] as Pt))} fill={clear ? tint(base, 0.3) : tint(base, 0.12)} />);
    for (let i = 0; i < 8; i++) lines.push(`M${rings[0][i][0] * s} ${rings[0][i][1] * s}L${rings[3][i][0] * s} ${rings[3][i][1] * s}`);
    for (const r of rings) lines.push("M" + r.map(([x, y]) => `${(x * s).toFixed(1)} ${(y * s).toFixed(1)}`).join("L") + "Z");
  } else {
    edge =
      shape === "princess" ? stepOutline(0.86, 0.86, 0.02) : shape === "radiant" ? stepOutline(0.7, 0.95, 0.2) : outline(shape, shape === "round" ? 16 : 20);
    const n = edge.length;
    const mid: Pt = shape === "pear" ? [0, 0.18] : shape === "heart" ? [0, 0.05] : [0, 0];
    const table = edge.map((p) => lerp(mid, p, 0.5));
    const star = edge.map((p, i) => lerp(mid, lerp(p, edge[(i + 1) % n], 0.5), 0.78));
    for (let i = 0; i < n; i++) {
      const a = edge[i], b = edge[(i + 1) % n], st = star[i], ta = table[i], tb = table[(i + 1) % n];
      faces.push(<polygon key={`u${i}`} points={pts([a, st, ta].map(([x, y]) => [x * s, y * s] as Pt))} fill={face(i)} />);
      faces.push(<polygon key={`v${i}`} points={pts([b, st, tb].map(([x, y]) => [x * s, y * s] as Pt))} fill={face(i + 40)} />);
      faces.push(<polygon key={`w${i}`} points={pts([a, b, st].map(([x, y]) => [x * s, y * s] as Pt))} fill={face(i + 80)} />);
      faces.push(<polygon key={`x${i}`} points={pts([ta, st, tb].map(([x, y]) => [x * s, y * s] as Pt))} fill={face(i + 120)} />);
      lines.push(`M${a[0] * s} ${a[1] * s}L${st[0] * s} ${st[1] * s}L${b[0] * s} ${b[1] * s}M${ta[0] * s} ${ta[1] * s}L${st[0] * s} ${st[1] * s}L${tb[0] * s} ${tb[1] * s}`);
    }
    faces.push(<polygon key="table" points={pts(table.map(([x, y]) => [x * s, y * s] as Pt))} fill={clear ? "#eef7fb" : tint(base, 0.1)} />);
    lines.push("M" + table.map(([x, y]) => `${(x * s).toFixed(1)} ${(y * s).toFixed(1)}`).join("L") + "Z");
  }
  const edgePts = pts(edge.map(([x, y]) => [x * s, y * s] as Pt));
  return (
    <g>
      <polygon points={edgePts} fill={tint(base, -0.4)} transform={`translate(${s * 0.05} ${s * 0.07})`} opacity={0.3} />
      {faces}
      <path d={lines.join("")} fill="none" stroke={CREAM} strokeWidth={Math.max(1.5, s * 0.012)} strokeLinejoin="round" opacity={0.85} />
      <polygon points={edgePts} fill="none" stroke={CREAM} strokeWidth={Math.max(2, s * 0.02)} strokeLinejoin="round" />
      <ellipse cx={-s * 0.28} cy={-s * 0.42} rx={s * 0.16} ry={s * 0.07} transform={`rotate(-30 ${-s * 0.28} ${-s * 0.42})`} fill={CREAM} opacity={0.7 * glint} />
    </g>
  );
};

// A pearl: soft round light, a pink and green sheen, a bright spot.
export const Pearl: React.FC<{ s: number; tone?: string; drop?: boolean; id?: string }> = ({ s, tone = "#f6efe4", drop, id = "pl" }) => {
  const g = `${id}-pearl-${Math.round(s)}`;
  const d = drop ? smooth(outline("pear", 24).map(([x, y]) => [x * s * 0.95, y * s * 1.05])) : undefined;
  return (
    <g>
      <defs>
        <radialGradient id={g} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor={tone} />
          <stop offset="1" stopColor={tint(tone, -0.28)} />
        </radialGradient>
      </defs>
      {d ? <path d={d} fill={`url(#${g})`} /> : <circle r={s} fill={`url(#${g})`} />}
      <path d={`M${-s * 0.75} ${s * 0.2} Q0 ${s * 0.95} ${s * 0.75} ${s * 0.2}`} fill="none" stroke={PINK} strokeWidth={s * 0.06} opacity={0.25} />
      <path d={`M${-s * 0.55} ${s * 0.48} Q0 ${s * 0.95} ${s * 0.55} ${s * 0.48}`} fill="none" stroke={MINT} strokeWidth={s * 0.05} opacity={0.2} />
      <ellipse cx={-s * 0.32} cy={-s * 0.36} rx={s * 0.22} ry={s * 0.14} transform={`rotate(-35 ${-s * 0.32} ${-s * 0.36})`} fill="#ffffff" opacity={0.9} />
    </g>
  );
};

// A rough stone straight from the ground: a frosted, slightly lopsided octahedron (the shape diamonds grow in), its
// faces in flat shades with soft corners, thin white edges and a glint.
export const Rough: React.FC<{ s: number; tone?: string; seed?: number }> = ({ s, tone = "#d3e4ea", seed = 3 }) => {
  const j = (i: number, k = 0.08) => (rand(seed * 11 + i) - 0.5) * 2 * k * s;
  const T: Pt = [j(1), -s + j(2)];
  const B: Pt = [j(3), s * 0.92 + j(4)];
  const L: Pt = [-s * 0.86 + j(5), s * 0.04 + j(6)];
  const R: Pt = [s * 0.84 + j(7), -s * 0.06 + j(8)];
  const F: Pt = [-s * 0.14 + j(9, 0.05), s * 0.12 + j(10, 0.05)];
  const faces: [Pt[], string][] = [
    [[T, L, F], tint(tone, 0.45)],
    [[T, F, R], tint(tone, 0.05)],
    [[B, F, L], tint(tone, -0.22)],
    [[B, R, F], tint(tone, -0.38)],
  ];
  const outlinePts = pts([T, R, B, L]);
  return (
    <g>
      <polygon points={outlinePts} fill={tint(tone, -0.1)} stroke={tint(tone, -0.1)} strokeWidth={s * 0.14} strokeLinejoin="round" />
      {faces.map(([f, c], i) => (
        <polygon key={i} points={pts(f)} fill={c} stroke={c} strokeWidth={s * 0.02} strokeLinejoin="round" />
      ))}
      <polygon points={pts([lerp(T, L, 0.3), lerp(T, F, 0.35), lerp(L, F, 0.45)])} fill={PINK} opacity={0.18} />
      <polygon points={pts([lerp(R, F, 0.25), lerp(B, F, 0.3), lerp(B, R, 0.4)])} fill={SKY} opacity={0.22} />
      <path d={`M${T[0]} ${T[1]}L${F[0]} ${F[1]}L${B[0]} ${B[1]}M${L[0]} ${L[1]}L${F[0]} ${F[1]}L${R[0]} ${R[1]}`} stroke={CREAM} strokeWidth={Math.max(2, s * 0.022)} fill="none" strokeLinejoin="round" opacity={0.85} />
      <path d={`M${lerp(T, L, 0.22)[0]} ${lerp(T, L, 0.22)[1]} L${lerp(F, L, 0.3)[0] + s * 0.06} ${lerp(F, L, 0.3)[1] - s * 0.1}`} stroke="#ffffff" strokeWidth={s * 0.06} strokeLinecap="round" opacity={0.75} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={j(20 + i, 0.5)} cy={j(30 + i, 0.45)} r={s * 0.018} fill={CREAM} opacity={0.6} />
      ))}
    </g>
  );
};

// An opal: a milky stone with patches of color that come and go as it turns.
export const Opal: React.FC<{ s: number; t: number; dark?: boolean }> = ({ s, t, dark }) => {
  const base = dark ? "#26304a" : "#e6eef2";
  const cols = [PINK, LIME, SKY, CORAL, LILAC, MINT, SUN];
  return (
    <g>
      <ellipse rx={s * 0.8} ry={s} fill={base} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = rand(i * 5) * Math.PI * 2, r = Math.sqrt(rand(i * 7)) * 0.7;
        const x = Math.sin(a) * r * s * 0.8, y = Math.cos(a) * r * s;
        const on = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * 2 + i * 1.3), 2);
        const blob = Array.from({ length: 7 }, (_, j) => {
          const b = (j / 7) * Math.PI * 2;
          const q = s * (0.1 + rand(i * 11 + j) * 0.12);
          return [x + Math.cos(b) * q, y + Math.sin(b) * q * 0.8] as Pt;
        });
        return <path key={i} d={smooth(blob)} fill={cols[i % cols.length]} opacity={on * 0.85} />;
      })}
      <ellipse rx={s * 0.8} ry={s} fill="none" stroke={CREAM} strokeWidth={4} />
      <ellipse cx={-s * 0.3} cy={-s * 0.45} rx={s * 0.2} ry={s * 0.1} transform={`rotate(-30 ${-s * 0.3} ${-s * 0.45})`} fill="#ffffff" opacity={0.75} />
    </g>
  );
};

// A jewelled Easter egg: enamel with gold bands and dots.
export const Egg: React.FC<{ s: number; tone?: string; t?: number; id?: string }> = ({ s, tone = CORAL, t = 0, id = "eg" }) => {
  const [g, gd] = metal("yellow");
  const egg = smooth(Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const k = Math.cos(a) < 0 ? 0.92 : 1;
    return [Math.sin(a) * s * 0.74 * k, -Math.cos(a) * s] as Pt;
  }));
  const clip = `${id}-egg-${Math.round(s)}`;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={egg} />
        </clipPath>
      </defs>
      <path d={egg} fill={tone} />
      <path d={egg} fill={tint(tone, -0.3)} opacity={0.25} transform={`translate(${s * 0.12} 0) scale(0.85 1)`} />
      {[-0.35, 0.3].map((y, i) => (
        <rect key={i} x={-s} y={y * s - s * 0.05} width={s * 2} height={s * 0.1} fill={g} clipPath={`url(#${clip})`} />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx={(i - 3) * s * 0.2} cy={-0.35 * s} r={s * 0.04} fill={gd} />
      ))}
      <path d={`M0 ${-s * 0.15} l${s * 0.12} ${s * 0.12} l${-s * 0.12} ${s * 0.12} l${-s * 0.12} ${-s * 0.12}Z`} fill={CREAM} opacity={0.6 + 0.4 * Math.sin(t * 3)} />
      <ellipse cx={-s * 0.3} cy={-s * 0.55} rx={s * 0.14} ry={s * 0.08} transform={`rotate(-30 ${-s * 0.3} ${-s * 0.55})`} fill="#ffffff" opacity={0.6} />
    </g>
  );
};

// A carrot, with a ring grown round its middle when `ring` is on.
export const Carrot: React.FC<{ s: number; ring?: boolean; metalName?: string }> = ({ s, ring, metalName = "white" }) => {
  const [m, md] = metal(metalName);
  const body = smooth([
    [-s * 0.32, -s * 0.55], [0, -s * 0.62], [s * 0.32, -s * 0.55], [s * 0.22, 0], [s * 0.08, s * 0.7], [0, s * 0.95], [-s * 0.08, s * 0.7], [-s * 0.22, 0],
  ]);
  return (
    <g>
      {[-0.18, 0, 0.18].map((dx, i) => (
        <path key={i} d={`M${dx * s} ${-s * 0.58} Q${(dx * 2.4) * s} ${-s * 0.95} ${(dx * 1.6 + (i - 1) * 0.12) * s} ${-s * 1.15}`} stroke={i === 1 ? "#3f9b47" : "#5bb55a"} strokeWidth={s * 0.09} fill="none" strokeLinecap="round" />
      ))}
      {ring && <ellipse cx={0} cy={-s * 0.05} rx={s * 0.3} ry={s * 0.09} fill="none" stroke={md} strokeWidth={s * 0.07} />}
      <path d={body} fill="#f07a2a" />
      <path d={body} fill="#d85e17" opacity={0.5} transform={`translate(${s * 0.08} 0) scale(0.6 1)`} />
      {[-0.3, 0.1, 0.4].map((y, i) => (
        <path key={i} d={`M${-s * 0.15} ${y * s} q${s * 0.08} ${s * 0.04} ${s * 0.16} 0`} stroke="#c2510f" strokeWidth={3} fill="none" strokeLinecap="round" />
      ))}
      {ring && (
        <g>
          <path d={`M${-s * 0.3} ${-s * 0.05} A${s * 0.3} ${s * 0.09} 0 0 0 ${s * 0.3} ${-s * 0.05}`} fill="none" stroke={m} strokeWidth={s * 0.08} />
          <g transform={`translate(${-s * 0.04} ${s * 0.05})`}>
            <Gem s={s * 0.09} />
          </g>
        </g>
      )}
    </g>
  );
};

// A ring seen from a little above the front: the band, the head and its stone. `prongs` 4 or 6.
export const Ring: React.FC<{ s: number; shape?: string; tone?: string; metalName?: string; t?: number; prongs?: number; halo?: boolean; noStone?: boolean }> = ({
  s,
  shape = "round",
  tone,
  metalName = "yellow",
  t = 0,
  prongs = 4,
  halo,
  noStone,
}) => {
  const [m, md] = metal(metalName);
  const rx = s * 0.78, ry = s * 0.3, cy = s * 0.42, w = s * 0.13;
  const stone = s * (shape === "emerald" || shape === "oval" || shape === "pear" ? 0.36 : 0.33);
  const top = cy - ry - stone * 0.55;
  return (
    <g>
      <ellipse cx={0} cy={cy} rx={rx} ry={ry} fill="none" stroke={md} strokeWidth={w} />
      <path d={`M${-rx} ${cy} A${rx} ${ry} 0 0 0 ${rx} ${cy}`} fill="none" stroke={m} strokeWidth={w} />
      <path d={`M${-rx * 0.8} ${cy + ry * 0.55} A${rx} ${ry} 0 0 0 ${rx * 0.35} ${cy + ry * 0.97}`} fill="none" stroke={CREAM} strokeWidth={w * 0.18} opacity={0.6} strokeLinecap="round" />
      <path d={`M${-s * 0.2} ${cy - ry + w * 0.2} L${-s * 0.1} ${top + stone * 0.4} H${s * 0.1} L${s * 0.2} ${cy - ry + w * 0.2}Z`} fill={md} />
      {!noStone && (
        <g transform={`translate(0 ${top}) scale(1 0.62)`}>
          {halo && Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return <circle key={i} cx={Math.sin(a) * stone * 1.18} cy={-Math.cos(a) * stone * 1.18} r={stone * 0.14} fill={DIAMOND} stroke={CREAM} strokeWidth={2} />;
          })}
          <Gem shape={shape} tone={tone} s={stone} t={t} />
          {Array.from({ length: prongs }, (_, i) => {
            const a = ((i + 0.5) / prongs) * Math.PI * 2;
            return <circle key={i} cx={Math.sin(a) * stone * 0.86} cy={-Math.cos(a) * stone * 0.92} r={stone * 0.1} fill={m} stroke={md} strokeWidth={2} />;
          })}
        </g>
      )}
      {noStone && (
        <g transform={`translate(0 ${top + stone * 0.5})`}>
          <ellipse cx={0} cy={0} rx={stone * 0.82} ry={stone * 0.28} fill={md} />
          <ellipse cx={0} cy={-stone * 0.04} rx={stone * 0.58} ry={stone * 0.17} fill={tint(md, -0.35)} />
          {Array.from({ length: prongs }, (_, i) => {
            const a = ((i + 0.5) / prongs) * Math.PI * 2;
            const x = Math.sin(a) * stone * 0.72;
            const y = -Math.cos(a) * stone * 0.22;
            const h = stone * 1.05;
            const front = Math.cos(a) < 0;
            return (
              <g key={i}>
                <path d={`M${x} ${y} Q${x * 1.12} ${y - h * 0.6} ${x * 0.82} ${y - h}`} fill="none" stroke={front ? m : md} strokeWidth={stone * 0.17} strokeLinecap="round" />
                <circle cx={x * 0.82} cy={y - h} r={stone * 0.11} fill={front ? m : md} />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};

// A necklace hanging from the top corners: a chain or a row of pearls, and a pendant stone or pearl.
export const Necklace: React.FC<{ s: number; pearls?: boolean; drop?: string; shape?: string; tone?: string; metalName?: string; t?: number; id?: string }> = ({
  s,
  pearls,
  drop,
  shape = "pear",
  tone,
  metalName = "yellow",
  t = 0,
  id = "nk",
}) => {
  const [m, md] = metal(metalName);
  const n = pearls ? 21 : 34;
  const beads: Pt[] = Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const a = Math.PI * (1 - u);
    return [Math.cos(a) * s, -s * 0.55 + Math.sin(a) * s * 1.05];
  });
  const bottom: Pt = [0, s * 0.5];
  return (
    <g>
      {beads.map(([x, y], i) =>
        pearls ? (
          <g key={i} transform={`translate(${x} ${y})`}>
            <Pearl s={s * 0.07} id={`${id}${i}`} />
          </g>
        ) : (
          <ellipse key={i} cx={x} cy={y} rx={s * 0.035} ry={s * 0.022} transform={`rotate(${(i / n) * 180 - 90} ${x} ${y})`} fill="none" stroke={i % 2 ? md : m} strokeWidth={s * 0.016} />
        ),
      )}
      <g transform={`translate(0 ${bottom[1] + s * 0.2}) rotate(${Math.sin(t * 1.8) * 4} 0 ${-s * 0.2})`}>
        <path d={`M0 ${-s * 0.2} V${-s * 0.1}`} stroke={md} strokeWidth={s * 0.02} />
        {drop === "pearl" ? (
          <g transform={`translate(0 ${s * 0.08})`}>
            <Pearl s={s * 0.17} drop id={`${id}-drop`} />
          </g>
        ) : drop !== "none" ? (
          <g transform={`translate(0 ${s * 0.07})`}>
            <circle r={s * 0.24} fill={m} opacity={shape === "pear" ? 0 : 0} />
            <Gem shape={shape} tone={tone} s={s * 0.2} t={t} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

// A pair of drop earrings.
export const Earrings: React.FC<{ s: number; shape?: string; tone?: string; pearls?: boolean; metalName?: string; t?: number; id?: string }> = ({
  s,
  shape = "pear",
  tone,
  pearls,
  metalName = "yellow",
  t = 0,
  id = "er",
}) => {
  const [m, md] = metal(metalName);
  return (
    <g>
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${side * s * 0.45} 0) rotate(${Math.sin(t * 2 + side) * 5} 0 ${-s * 0.6})`}>
          <path d={`M0 ${-s * 0.75} q${s * 0.12} ${-s * 0.12} ${s * 0.08} ${s * 0.12} V${-s * 0.35}`} fill="none" stroke={md} strokeWidth={s * 0.03} />
          <circle cx={s * 0.08} cy={-s * 0.33} r={s * 0.06} fill={m} />
          <g transform={`translate(${s * 0.08} ${s * 0.05})`}>{pearls ? <Pearl s={s * 0.22} drop id={`${id}${side}`} /> : <Gem shape={shape} tone={tone} s={s * 0.26} t={t + side} />}</g>
        </g>
      ))}
    </g>
  );
};

// A brooch: a big stone with a ring of small ones and petals of metal.
export const Brooch: React.FC<{ s: number; shape?: string; tone?: string; metalName?: string; t?: number }> = ({ s, shape = "oval", tone, metalName = "yellow", t = 0 }) => {
  const [m, md] = metal(metalName);
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} rx={s * 0.22} ry={s * 0.5} transform={`rotate(${i * 45 + Math.sin(t) * 3}) translate(0 ${-s * 0.45})`} fill={i % 2 ? m : md} />
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return <circle key={i} cx={Math.sin(a) * s * 0.52} cy={-Math.cos(a) * s * 0.52} r={s * 0.07} fill={DIAMOND} stroke={CREAM} strokeWidth={2} />;
      })}
      <Gem shape={shape} tone={tone} s={s * 0.4} t={t} />
    </g>
  );
};

// A tiara: a band rising to points, a stone or a pearl at each.
export const Tiara: React.FC<{ s: number; shape?: string; tone?: string; metalName?: string; t?: number; id?: string }> = ({ s, shape = "pear", tone, metalName = "white", t = 0, id = "ti" }) => {
  const [m, md] = metal(metalName);
  const peaks = [-0.8, -0.4, 0, 0.4, 0.8];
  return (
    <g>
      <path d={`M${-s} ${s * 0.4} Q0 ${s * 0.05} ${s} ${s * 0.4}`} fill="none" stroke={md} strokeWidth={s * 0.08} />
      {peaks.map((x, i) => {
        const h = (1 - Math.abs(x) * 0.6) * s * 0.75;
        const by = s * 0.4 - (1 - x * x) * s * 0.3;
        return (
          <g key={i}>
            <path d={`M${(x - 0.17) * s} ${by} Q${x * s} ${by - h * 0.4} ${x * s} ${by - h} Q${x * s} ${by - h * 0.4} ${(x + 0.17) * s} ${by}`} fill={m} stroke={md} strokeWidth={3} />
            <g transform={`translate(${x * s} ${by - h - s * 0.08})`}>{i % 2 ? <Pearl s={s * 0.07} id={`${id}${i}`} /> : <Gem shape={shape} tone={tone} s={s * (i === 2 ? 0.15 : 0.09)} t={t + i} />}</g>
          </g>
        );
      })}
    </g>
  );
};

// A crown: a band of gold, arches, an orb and cross, stones of every color.
export const Crown: React.FC<{ s: number; t?: number; id?: string }> = ({ s, t = 0, id = "cr" }) => {
  const [g, gd] = metal("yellow");
  const stones = [CORAL, MINT, SKY, CORAL, MINT];
  return (
    <g>
      <path d={`M${-s * 0.75} ${s * 0.2} Q${-s * 0.8} ${-s * 0.6} 0 ${-s * 0.62} Q${s * 0.8} ${-s * 0.6} ${s * 0.75} ${s * 0.2}Z`} fill={CORAL} />
      <path d={`M${-s * 0.75} ${s * 0.2} Q${-s * 0.75} ${-s * 0.62} 0 ${-s * 0.66}`} fill="none" stroke={g} strokeWidth={s * 0.07} />
      <path d={`M${s * 0.75} ${s * 0.2} Q${s * 0.75} ${-s * 0.62} 0 ${-s * 0.66}`} fill="none" stroke={g} strokeWidth={s * 0.07} />
      <path d={`M0 ${s * 0.2} V${-s * 0.66}`} stroke={g} strokeWidth={s * 0.07} />
      <circle cy={-s * 0.78} r={s * 0.11} fill={g} />
      <path d={`M0 ${-s * 0.88} V${-s * 1.08} M${-s * 0.08} ${-s * 0.99} H${s * 0.08}`} stroke={gd} strokeWidth={s * 0.05} strokeLinecap="round" />
      <rect x={-s * 0.82} y={s * 0.15} width={s * 1.64} height={s * 0.34} rx={s * 0.05} fill={g} />
      <rect x={-s * 0.82} y={s * 0.15} width={s * 1.64} height={s * 0.08} fill={CREAM} opacity={0.5} />
      {stones.map((c, i) => (
        <g key={i} transform={`translate(${(i - 2) * s * 0.33} ${s * 0.33})`}>
          <Gem shape={i % 2 ? "oval" : "cushion"} tone={c} s={s * 0.1} t={t + i} />
        </g>
      ))}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
        <g key={i} transform={`translate(${x * s} ${s * 0.1})`}>
          <Pearl s={s * 0.05} id={`${id}${i}`} />
        </g>
      ))}
    </g>
  );
};

// A sceptre: a gold rod with a big stone and a little cross on top.
export const Sceptre: React.FC<{ s: number; t?: number }> = ({ s, t = 0 }) => {
  const [g, gd] = metal("yellow");
  return (
    <g>
      <rect x={-s * 0.04} y={-s * 0.6} width={s * 0.08} height={s * 1.6} rx={s * 0.03} fill={g} />
      {[-0.2, 0.3, 0.8].map((y, i) => (
        <rect key={i} x={-s * 0.07} y={y * s} width={s * 0.14} height={s * 0.06} rx={s * 0.02} fill={gd} />
      ))}
      <g transform={`translate(0 ${-s * 0.75})`}>
        <Gem shape="pear" s={s * 0.2} t={t} />
      </g>
      <path d={`M0 ${-s * 0.98} V${-s * 1.15} M${-s * 0.06} ${-s * 1.07} H${s * 0.06}`} stroke={gd} strokeWidth={s * 0.035} strokeLinecap="round" />
    </g>
  );
};

// A chest whose lid opens by `open` (0 shut, 1 open): the domed lid flips back and its dark inside stands up behind.
export const Chest: React.FC<{ s: number; open: number; color?: string; inside?: React.ReactNode }> = ({ s, open, color = "#c8743a", inside }) => {
  const [g, gd] = metal("yellow");
  const w = s, h = s * 0.62, lid = s * 0.32;
  const ly = -h / 2;
  const dome = Math.max(0, 1 - open * 2);
  const back = Math.max(0, open * 2 - 1);
  const bh = lid * 1.5 * back;
  return (
    <g>
      {back > 0 && (
        <g>
          <path d={`M${-w * 0.98} ${ly} L${-w * 0.92} ${ly - bh} Q0 ${ly - bh - lid * 0.25 * back} ${w * 0.92} ${ly - bh} L${w * 0.98} ${ly}Z`} fill={tint(color, -0.45)} />
          <path d={`M${-w * 0.92} ${ly - bh} Q0 ${ly - bh - lid * 0.25 * back} ${w * 0.92} ${ly - bh}`} fill="none" stroke={g} strokeWidth={s * 0.05} />
          {[-0.7, 0.7].map((x, i) => (
            <path key={i} d={`M${x * w - s * 0.05} ${ly} L${x * w * 0.95 - s * 0.05} ${ly - bh} h${s * 0.1} L${x * w + s * 0.05} ${ly}Z`} fill={gd} opacity={0.8} />
          ))}
        </g>
      )}
      <rect x={-w} y={ly - lid * 0.08} width={w * 2} height={lid * 0.16} fill={tint(color, -0.55)} opacity={open} />
      {inside}
      <rect x={-w} y={ly} width={w * 2} height={h} rx={s * 0.05} fill={color} />
      <rect x={w * 0.35} y={ly} width={w * 0.65} height={h} rx={s * 0.05} fill={tint(color, -0.25)} opacity={0.4} />
      {[-0.7, 0.7].map((x, i) => (
        <rect key={i} x={x * w - s * 0.05} y={ly} width={s * 0.1} height={h} fill={g} />
      ))}
      <rect x={-s * 0.08} y={ly + h * 0.12} width={s * 0.16} height={s * 0.2} rx={s * 0.03} fill={g} />
      <circle cx={0} cy={ly + h * 0.12 + s * 0.08} r={s * 0.025} fill={gd} />
      {dome > 0 && (
        <g transform={`translate(0 ${ly})`}>
          <path d={`M${-w} 0 L${-w * 0.98} ${-lid * dome} Q0 ${-lid * dome - lid * 0.5 * dome} ${w * 0.98} ${-lid * dome} L${w} 0Z`} fill={tint(color, 0.08)} />
          {[-0.7, 0.7].map((x, i) => (
            <path key={i} d={`M${x * w - s * 0.05} 0 V${-lid * dome * 1.15} h${s * 0.1} V0Z`} fill={gd} />
          ))}
        </g>
      )}
    </g>
  );
};

// A brown paper parcel tied with string, with an address label.
export const Parcel: React.FC<{ s: number; label?: string; open?: number }> = ({ s, label, open = 0 }) => {
  const w = s, h = s * 0.7;
  return (
    <g>
      <rect x={-w} y={-h / 2} width={w * 2} height={h} rx={6} fill="#c99a62" />
      <rect x={w * 0.2} y={-h / 2} width={w * 0.8} height={h} fill="#b5844c" opacity={0.6} />
      <rect x={-w} y={-h / 2 - open * s * 0.25} width={w * 2} height={s * 0.12} fill="#d8ad78" />
      <path d={`M${-w} 0 H${w} M0 ${-h / 2} V${h / 2}`} stroke={CREAM} strokeWidth={5} opacity={0.9} />
      <path d={`M0 ${-h / 2} q${-s * 0.2} ${-s * 0.18} ${-s * 0.25} 0 M0 ${-h / 2} q${s * 0.2} ${-s * 0.18} ${s * 0.25} 0`} stroke={CREAM} strokeWidth={5} fill="none" />
      {label && (
        <g transform={`translate(${-w * 0.55} ${h * 0.18}) rotate(-4)`}>
          <rect x={-s * 0.33} y={-s * 0.12} width={s * 0.66} height={s * 0.24} rx={4} fill={CREAM} />
          <text y={s * 0.04} textAnchor="middle" fontFamily={'"Instrument Serif", Georgia, serif'} fontStyle="italic" fontSize={s * 0.11} fill={INK}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
};

// Silica spheres stacked in rows, as in precious opal: each one catches a color. `big` spheres show every color, red
// included; small ones only blues and greens.
export const Spheres: React.FC<{ s: number; t: number; big?: boolean }> = ({ s, t, big = true }) => {
  const r = s * (big ? 0.16 : 0.105);
  const cols = big ? [CORAL, SUN, LIME, SKY, LILAC, PINK] : [SKY, MINT, "#3f8fd8", LIME];
  const out: React.ReactNode[] = [];
  const rows = Math.floor((s * 1.7) / (r * 1.75));
  for (let row = 0; row < rows; row++) {
    const y = -s * 0.85 + r + row * r * 1.75;
    const off = row % 2 ? r : 0;
    for (let x = -s + r + off; x <= s - r; x += r * 2.02) {
      if (Math.hypot(x, y) > s - r * 0.3) continue;
      const k = (Math.sin(t * 1.6 + x * 0.03 + y * 0.05) + 1) / 2;
      const c = cols[Math.floor(rand(Math.round(x * 7 + y * 13)) * cols.length)];
      out.push(
        <g key={`${row}-${x.toFixed(0)}`}>
          <circle cx={x} cy={y} r={r} fill="#eef2f4" stroke={tint("#eef2f4", -0.25)} strokeWidth={2} />
          <circle cx={x} cy={y} r={r * 0.62} fill={c} opacity={0.25 + 0.6 * k} />
          <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.2} fill="#ffffff" opacity={0.9} />
        </g>,
      );
    }
  }
  return <g>{out}</g>;
};

// One of the things a story shows, by name: gem, glass, rough, pearl, round-pearl, egg, opal, ring, carrot, empty.
export const Item: React.FC<{ kind: string; s: number; t: number; shape?: string; tone?: string; metalName?: string; id?: string; prongs?: number }> = ({ kind, s, t, shape, tone, metalName, id, prongs }) => {
  switch (kind) {
    case "gem":
    case "glass":
      return <Gem shape={shape ?? "cushion"} tone={tone} s={s} t={t} />;
    case "pearl":
      return <Pearl s={s * 0.8} drop tone={tone} id={id} />;
    case "round-pearl":
      return <Pearl s={s * 0.75} tone={tone} id={id} />;
    case "egg":
      return <Egg s={s} tone={tone} t={t} id={id} />;
    case "opal":
      return <Opal s={s * 0.9} t={t} dark={tone === "dark"} />;
    case "ring":
      return <Ring s={s * 1.1} shape={shape ?? "round"} tone={tone} metalName={metalName} t={t} prongs={prongs} />;
    case "carrot":
      return <Carrot s={s} ring metalName={metalName} />;
    case "empty":
      return null;
    default:
      return <Rough s={s} tone={tone} />;
  }
};

export { DIAMOND };
export const ACCENTS = { CORAL, LILAC, LIME, MINT, PINK, SKY, SUN };
