import React from "react";
import { rand } from "../look";

// Shared pieces for the three new full-colour looks (Jewel Box, Deco Poster, Gouache): colour ramps, a faceted gem that
// can be drawn glossy, flat or painted, a ring built from it, and sparkles. One script drives all three.

export type RGB = [number, number, number];
export const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const rgb = (c: RGB) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
export const ramp = (stops: RGB[], t: number): RGB => {
  const x = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(x);
  return mixc(stops[i], stops[i + 1], x - i);
};

export const SAPPHIRE = ["#06123a", "#0d2a7a", "#1d4fd0", "#4f86f5", "#a9c8ff", "#ffffff"].map(hex);
export const RUBY = ["#2a0410", "#7a0f26", "#c8203f", "#ff5a74", "#ffc0cb", "#ffffff"].map(hex);
export const EMERALD = ["#02261a", "#075a3b", "#12a56b", "#4fe0a0", "#c4ffe3", "#ffffff"].map(hex);
export const DIAMOND = ["#7480a0", "#aab6d4", "#dfe7fa", "#ffffff", "#ffffff"].map(hex);

export type Facet = { d: string; theta: number; r: number; key: number };

// A brilliant-cut stone seen from above: an outer ring of kites and stars, a middle ring, a table.
export function gemFacets(cx: number, cy: number, rx: number, ry: number, n: number, table = 0.4, mid = 0.7): Facet[] {
  const P = (s: number, a: number): [number, number] => [cx + rx * s * Math.cos(a), cy + ry * s * Math.sin(a)];
  const step = (Math.PI * 2) / n;
  const out: Facet[] = [];
  let key = 0;
  const add = (pts: [number, number][]) => {
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const nx = (mx - cx) / rx;
    const ny = (my - cy) / ry;
    out.push({
      d: "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") + "Z",
      theta: Math.atan2(ny, nx),
      r: Math.min(1, Math.hypot(nx, ny)),
      key: key++,
    });
  };
  for (let i = 0; i < n; i++) {
    const a0 = i * step;
    const a1 = (i + 1) * step;
    const am = a0 + step / 2;
    add([P(1, a0), P(1, a1), P(mid, am)]); // upper girdle, pointing in
    add([P(mid, am - step), P(mid, am), P(1, a0)]); // star, pointing out
    add([P(mid, am), P(table, a0), P(table, a1)]); // pointing out toward the girdle
    add([P(table, a1), P(mid, am), P(mid, am + step)]); // pointing in
  }
  add(Array.from({ length: n }, (_, i) => P(table, i * step)));
  return out;
}

export type GemProps = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  n?: number;
  stops: RGB[];
  t: number;
  levels?: number; // quantise the shading into this many flat tones (poster look)
  contrast?: number;
  stroke?: string;
  strokeW?: number;
  seed?: number;
  sweep?: number; // how fast the light turns
};

export const Gem: React.FC<GemProps> = ({ cx, cy, rx, ry, n = 12, stops, t, levels, contrast = 1, stroke, strokeW = 0, seed = 0, sweep = 0.9 }) => {
  const facets = React.useMemo(() => gemFacets(cx, cy, rx, ry, n), [cx, cy, rx, ry, n]);
  const L = 0.7 + t * sweep;
  return (
    <g>
      {facets.map((f) => {
        const lit = 0.5 + 0.5 * Math.cos(f.theta - L);
        const isTable = f.r < 0.05;
        let s = isTable ? 0.64 + 0.14 * Math.sin(t * 2 + seed) : 0.12 + (0.55 + 0.45 * f.r) * lit * 0.92 + (rand(f.key + seed * 13) - 0.5) * 0.24 + ((f.key % 2) * 0.1 - 0.05);
        s = 0.5 + (s - 0.5) * contrast;
        if (levels) s = Math.round(Math.min(1, Math.max(0, s)) * (levels - 1)) / (levels - 1);
        return <path key={f.key} d={f.d} fill={rgb(ramp(stops, s))} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />;
      })}
    </g>
  );
};

// A four-point sparkle that blinks.
export const Spark: React.FC<{ x: number; y: number; s: number; t: number; phase?: number; color?: string; speed?: number }> = ({ x, y, s, t, phase = 0, color = "#fff", speed = 2.4 }) => {
  const k = Math.pow(Math.max(0, Math.sin(t * speed + phase)), 3);
  if (k < 0.02) return null;
  const z = s * k;
  return <path transform={`translate(${x} ${y}) rotate(${(t * 20 + phase * 30) % 90})`} d={`M0 ${-z} Q0 0 ${z} 0 Q0 0 0 ${z} Q0 0 ${-z} 0 Q0 0 0 ${-z}Z`} fill={color} opacity={0.95} />;
};

export type StoneProps = {
  t: number;
  stops: RGB[];
  dia?: RGB[];
  rx?: number;
  ry?: number;
  halo?: number; // how many small stones circle it (0 for none)
  haloShown?: number; // how many have appeared so far (for the count-up)
  levels?: number;
  contrast?: number;
  stroke?: string;
  strokeW?: number;
  seed?: number;
  sparkles?: boolean;
  cy?: number;
  diaStroke?: string;
};

// The sapphire with its ring of diamonds, centred on (0, cy).
export const Stone: React.FC<StoneProps> = ({ t, stops, dia = DIAMOND, rx = 230, ry = 180, halo = 14, haloShown, levels, contrast, stroke, strokeW, seed = 1, sparkles = true, cy = 0, diaStroke }) => {
  const dr = 50;
  const a = rx + dr * 0.92;
  const b = ry + dr * 0.92;
  const shown = haloShown ?? halo;
  const stars: React.ReactNode[] = [];
  for (let i = 0; i < halo; i++) {
    if (i >= shown) continue;
    const ang = (i / halo) * Math.PI * 2 - Math.PI / 2;
    const x = a * Math.cos(ang);
    const y = cy + b * Math.sin(ang);
    stars.push(<Gem key={i} cx={x} cy={y} rx={dr} ry={dr} n={8} stops={dia} t={t} stroke={diaStroke ?? stroke} strokeW={strokeW ? strokeW * 0.6 : 0} seed={i + 3} levels={levels} contrast={contrast} sweep={1.3} />);
  }
  return (
    <g>
      {stars}
      <Gem cx={0} cy={cy} rx={rx} ry={ry} n={12} stops={stops} t={t} levels={levels} contrast={contrast} stroke={stroke} strokeW={strokeW} seed={seed} />
      {sparkles && (
        <g>
          <Spark x={-rx * 0.42} y={cy - ry * 0.4} s={rx * 0.32} t={t} phase={0.2} />
          <Spark x={rx * 0.5} y={cy + ry * 0.1} s={rx * 0.24} t={t} phase={2.1} />
          <Spark x={rx * 0.05} y={cy - ry * 0.95} s={rx * 0.2} t={t} phase={4.0} />
          <Spark x={-rx * 0.1} y={cy + ry * 0.55} s={rx * 0.18} t={t} phase={5.3} />
        </g>
      )}
    </g>
  );
};

export type MetalKit = {
  band: string; // fill/stroke for the band (a gradient url or a colour)
  edge?: string; // outline colour (flat looks)
  light: string; // highlight colour
  shade: string; // shadow colour
  shine?: boolean; // draw the soft highlight arcs
  flat?: boolean;
};

// A ring seen from the front: the band, the setting and the stone on top. Origin is the centre of the band.
export const Ring: React.FC<StoneProps & { R?: number; bw?: number; metal: MetalKit }> = ({ R = 230, bw = 62, metal, ...stone }) => {
  const rx = stone.rx ?? 230;
  const ry = stone.ry ?? 180;
  const dr = 50;
  const gy = -R - bw / 2 - ry - dr * 1.25;
  const arc = (r: number, a0: number, a1: number) => {
    const p = (a: number) => [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  return (
    <g>
      {metal.edge && <circle r={R} fill="none" stroke={metal.edge} strokeWidth={bw + 16} />}
      <circle r={R} fill="none" stroke={metal.band} strokeWidth={bw} />
      {metal.shine && (
        <>
          <circle r={R - bw * 0.36} fill="none" stroke={metal.shade} strokeWidth={bw * 0.2} opacity={0.35} />
          <path d={arc(R + bw * 0.12, 195, 285)} fill="none" stroke={metal.light} strokeWidth={bw * 0.2} strokeLinecap="round" opacity={0.85} />
          <path d={arc(R + bw * 0.12, 300, 320)} fill="none" stroke={metal.light} strokeWidth={bw * 0.14} strokeLinecap="round" opacity={0.55} />
          <path d={arc(R - bw * 0.1, 20, 80)} fill="none" stroke={metal.light} strokeWidth={bw * 0.1} strokeLinecap="round" opacity={0.4} />
        </>
      )}
      {metal.flat && (
        <>
          <path d={arc(R + bw * 0.2, 190, 290)} fill="none" stroke={metal.light} strokeWidth={bw * 0.24} strokeLinecap="butt" />
          <path d={arc(R - bw * 0.22, 20, 150)} fill="none" stroke={metal.shade} strokeWidth={bw * 0.3} strokeLinecap="butt" />
        </>
      )}
      <path d={`M${-rx * 0.5} ${gy + ry * 0.7} L${rx * 0.5} ${gy + ry * 0.7} L${rx * 0.22} ${-R + bw * 0.1} L${-rx * 0.22} ${-R + bw * 0.1}Z`} fill={metal.band} stroke={metal.edge} strokeWidth={metal.edge ? 8 : 0} strokeLinejoin="round" />
      <Stone {...stone} cy={gy} />
    </g>
  );
};

// Fades text up. `t` is the time since the beat began.
export const rise = (t: number, at: number, dur = 0.35) => {
  const u = Math.min(1, Math.max(0, (t - at) / dur));
  const e = 1 - Math.pow(1 - u, 3);
  return { opacity: e, transform: `translateY(${(1 - e) * 28}px)` } as React.CSSProperties;
};
