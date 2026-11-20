import React from "react";
import { rand } from "../look";
import { RGB, hex, ramp, rgb, mixc, Spark } from "./common";

// A small 3D jewelry kit for the full-colour looks. Real cuts (round, oval, pear, marquise, heart, cushion, emerald) with a
// crown, a girdle and a pavilion, seen in a three-quarter view; a ring built around them (shank with shoulders, prongs, or a
// halo of small stones on a tray); everything is turned and lit as solid faces and painted back to front.

export type V3 = [number, number, number];
export type Cut = "round" | "oval" | "pear" | "marquise" | "heart" | "cushion" | "emerald";
export type MetalName = "platinum" | "yellow" | "rose";

const TAU = Math.PI * 2;
const BAND_TH = 0.3;
const BAND_W = 0.62;
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const mod = (i: number, n: number) => ((i % n) + n) % n;

type Face = { v: V3[]; n: V3; key: number; part: 0 | 1 | 2 | 3 }; // 0 crown, 1 girdle, 2 pavilion, 3 table

function faceNormal(v: V3[], inside: V3): V3 {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  const m: V3 = [0, 0, 0];
  for (let i = 0; i < v.length; i++) {
    const a = v[i];
    const b = v[(i + 1) % v.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
    m[0] += a[0] / v.length;
    m[1] += a[1] / v.length;
    m[2] += a[2] / v.length;
  }
  let n = unit([nx, ny, nz]);
  if (dot(n, [m[0] - inside[0], m[1] - inside[1], m[2] - inside[2]]) < 0) n = [-n[0], -n[1], -n[2]];
  return n;
}

// ---------------------------------------------------------------------------------------------------------------------
// Outlines of the cuts. x is across (half width 1), y runs along the long axis.
// ---------------------------------------------------------------------------------------------------------------------
export function outlineAt(cut: Cut, t: number): [number, number] {
  switch (cut) {
    case "round":
      return [Math.cos(t), Math.sin(t)];
    case "oval":
      return [Math.cos(t), 1.3 * Math.sin(t)];
    case "cushion": {
      const p = 2.9;
      const c = Math.cos(t);
      const s = Math.sin(t);
      return [Math.sign(c) * Math.pow(Math.abs(c), 2 / p), 0.97 * Math.sign(s) * Math.pow(Math.abs(s), 2 / p)];
    }
    case "pear":
      return [1.3 * Math.sin(t) * Math.cos(t / 2), -1.5 * Math.cos(t)];
    case "marquise":
      return [Math.sin(t) * Math.abs(Math.sin(t)), 1.75 * Math.cos(t)];
    case "heart":
      return [Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16];
    default:
      return [Math.cos(t), Math.sin(t)];
  }
}
const cutCenter = (cut: Cut): [number, number] => (cut === "pear" ? [0, -0.28] : cut === "heart" ? [0, -0.06] : [0, 0]);

const GEM_CACHE = new Map<string, Face[]>();
const INSIDE: V3 = [0, 0, -0.25];

function brilliantFaces(cut: Cut): Face[] {
  const n = 8;
  const m = 2 * n;
  const O: [number, number][] = [];
  for (let i = 0; i < m; i++) O.push(outlineAt(cut, (i / m) * TAU));
  const c = cutCenter(cut);
  const P = (s: number, k: number, z: number): V3 => {
    const o = O[mod(k, m)];
    return [c[0] + s * (o[0] - c[0]), c[1] + s * (o[1] - c[1]), z];
  };
  const hc = 0.36;
  const hp = 0.92;
  const g = 0.05;
  const st = 0.56;
  const sm = 0.8;
  const zc = (s: number) => (hc * (1 - s)) / (1 - st);
  const faces: Face[] = [];
  const add = (v: V3[], part: Face["part"]) => faces.push({ v, n: faceNormal(v, INSIDE), key: faces.length, part });
  for (let i = 0; i < n; i++) {
    const k0 = 2 * i;
    const k1 = 2 * i + 2;
    const km = 2 * i + 1;
    add([P(1, k0, 0), P(1, k1, 0), P(sm, km, zc(sm))], 0);
    add([P(sm, km - 2, zc(sm)), P(sm, km, zc(sm)), P(1, k0, 0)], 0);
    add([P(sm, km, zc(sm)), P(st, k0, hc), P(st, k1, hc)], 0);
    add([P(st, k1, hc), P(sm, km, zc(sm)), P(sm, km + 2, zc(sm))], 0);
  }
  const table: V3[] = [];
  for (let i = 0; i < n; i++) table.push(P(st, 2 * i, hc));
  faces.push({ v: table, n: [0, 0, 1], key: faces.length, part: 3 });
  for (let k = 0; k < m; k++) add([P(1, k, 0), P(1, k + 1, 0), P(1, k + 1, -g), P(1, k, -g)], 1);
  const culet: V3 = [c[0], c[1], -hp];
  for (let k = 0; k < m; k++) add([P(1, k, -g), P(1, k + 1, -g), culet], 2);
  return faces;
}

function stepFaces(): Face[] {
  const L = 1.38;
  const k = 0.36;
  const base: [number, number][] = [[1, -(L - k)], [1, L - k], [1 - k, L], [-(1 - k), L], [-1, L - k], [-1, -(L - k)], [-(1 - k), -L], [1 - k, -L]];
  const ring = (s: number, z: number): V3[] => base.map((p) => [p[0] * s, p[1] * s, z] as V3);
  const faces: Face[] = [];
  const add = (v: V3[], part: Face["part"]) => faces.push({ v, n: faceNormal(v, INSIDE), key: faces.length, part });
  const crown = [ring(1, 0), ring(0.84, 0.1), ring(0.69, 0.21), ring(0.55, 0.32)];
  for (let r = 0; r < 3; r++) for (let j = 0; j < 8; j++) add([crown[r][j], crown[r][(j + 1) % 8], crown[r + 1][(j + 1) % 8], crown[r + 1][j]], 0);
  faces.push({ v: crown[3], n: [0, 0, 1], key: faces.length, part: 3 });
  const g = 0.05;
  const gi = ring(1, -g);
  for (let j = 0; j < 8; j++) add([crown[0][j], crown[0][(j + 1) % 8], gi[(j + 1) % 8], gi[j]], 1);
  const hp = 0.8;
  const pav = [ring(1, -g), ring(0.74, -0.28 * hp), ring(0.48, -0.62 * hp), ring(0.16, -hp)];
  for (let r = 0; r < 3; r++) for (let j = 0; j < 8; j++) add([pav[r][j], pav[r][(j + 1) % 8], pav[r + 1][(j + 1) % 8], pav[r + 1][j]], 2);
  add(pav[3], 2);
  return faces;
}

export function gemFaces(cut: Cut): Face[] {
  let f = GEM_CACHE.get(cut);
  if (!f) {
    f = cut === "emerald" ? stepFaces() : brilliantFaces(cut);
    GEM_CACHE.set(cut, f);
  }
  return f;
}

// Moves a gem's faces into another frame: origin o, axes bx by bz, uniform scale s. Pavilions can be dropped for stones set flat.
function place(faces: Face[], o: V3, bx: V3, by: V3, bz: V3, s: number, crownOnly = false): Face[] {
  const T = (p: V3): V3 => [o[0] + s * (p[0] * bx[0] + p[1] * by[0] + p[2] * bz[0]), o[1] + s * (p[0] * bx[1] + p[1] * by[1] + p[2] * bz[1]), o[2] + s * (p[0] * bx[2] + p[1] * by[2] + p[2] * bz[2])];
  const R = (n: V3): V3 => [n[0] * bx[0] + n[1] * by[0] + n[2] * bz[0], n[0] * bx[1] + n[1] * by[1] + n[2] * bz[1], n[0] * bx[2] + n[1] * by[2] + n[2] * bz[2]];
  const out: Face[] = [];
  for (const f of faces) {
    if (crownOnly && f.part === 2) continue;
    out.push({ v: f.v.map(T), n: R(f.n), key: f.key, part: f.part });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Camera: the piece turns by `yaw` about the vertical, and we look down at it from `elev`.
// ---------------------------------------------------------------------------------------------------------------------
type Xf = { yaw: number; elev: number; k: number; ox: number; oy: number };
const proj = (xf: Xf, p: V3): V3 => {
  const cy = Math.cos(xf.yaw);
  const sy = Math.sin(xf.yaw);
  const x = p[0] * cy - p[1] * sy;
  const y = p[0] * sy + p[1] * cy;
  const ce = Math.cos(xf.elev);
  const se = Math.sin(xf.elev);
  return [xf.ox + xf.k * x, xf.oy - xf.k * (y * se + p[2] * ce), -y * ce + p[2] * se];
};
const rotN = (xf: Xf, n: V3): V3 => {
  const cy = Math.cos(xf.yaw);
  const sy = Math.sin(xf.yaw);
  return [n[0] * cy - n[1] * sy, n[0] * sy + n[1] * cy, n[2]];
};
const camVec = (xf: Xf): V3 => [0, -Math.cos(xf.elev), Math.sin(xf.elev)];
const depthOf = (xf: Xf, p: V3) => proj(xf, p)[2];

// A few soft light boxes around the piece: where a facet's mirror direction lands decides how bright it is.
const LIGHTS: { d: V3; w: number; p: number }[] = [
  { d: unit([-0.55, -0.5, 0.7]), w: 1.0, p: 16 },
  { d: unit([0.75, -0.15, 0.45]), w: 0.75, p: 9 },
  { d: unit([0.1, 0.8, 0.55]), w: 0.8, p: 12 },
  { d: unit([0, 0, 1]), w: 0.55, p: 5 },
  { d: unit([-0.8, 0.3, 0.1]), w: 0.45, p: 7 },
  { d: unit([0.4, -0.85, 0.25]), w: 0.5, p: 10 },
];
const env = (r: V3, sharp = 1) => {
  let s = 0;
  for (const L of LIGHTS) s += L.w * Math.pow(Math.max(0, dot(r, L.d)), L.p * sharp);
  return s;
};
const reflect = (n: V3, c: V3): V3 => {
  const d = 2 * dot(n, c);
  return [d * n[0] - c[0], d * n[1] - c[1], d * n[2] - c[2]];
};

// ---------------------------------------------------------------------------------------------------------------------
// Looks of the paint
// ---------------------------------------------------------------------------------------------------------------------
export type GemStyle = { levels?: number; contrast?: number; stroke?: string; strokeW?: number; fire?: boolean; sparkles?: boolean };
export type PieceStyle = { gem: GemStyle; metalLevels?: number; outline?: string; outlineW?: number; metals?: Partial<Record<MetalName, RGB[]>> };

export const METALS: Record<MetalName, RGB[]> = {
  platinum: ["#1d2433", "#586379", "#b0bbce", "#eef3fb", "#ffffff"].map(hex),
  yellow: ["#5e3d08", "#b57a1f", "#e8b94a", "#fbe08c", "#fff8d6"].map(hex),
  rose: ["#5f2c2a", "#a8605a", "#dd9a8b", "#f6c9ba", "#fff0e8"].map(hex),
};
const FIRE: RGB[] = [hex("#7fb2ff"), hex("#ffb27a"), hex("#d9a0ff")];

const pathOf = (pts: [number, number, number][]) => "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") + "Z";
const quant = (s: number, levels?: number) => (levels ? Math.round(clamp01(s) * (levels - 1)) / (levels - 1) : s);

function gemTone(nW: V3, cam: V3, key: number, seed: number, st: GemStyle, inner: boolean): number {
  const d = dot(nW, cam);
  const e = env(reflect(nW, cam));
  let s = inner ? 0.2 + 0.6 * Math.min(1, e * 0.85 + 0.3 * Math.max(0, d)) : 0.3 + 0.6 * Math.min(1, e + 0.2 * Math.max(0, d));
  s += (rand(key * 7 + seed * 13) - 0.5) * 0.24;
  s = 0.5 + (s - 0.5) * (st.contrast ?? 1);
  return quant(s, st.levels);
}

function gemColor(stops: RGB[], s: number, key: number, seed: number, st: GemStyle): string {
  let c = ramp(stops, s);
  if (st.fire && s > 0.55 && rand(key * 3 + seed * 5) > 0.7) c = mixc(c, FIRE[key % 3], 0.34);
  return rgb(c);
}

// One cut stone, painted back to front; the table shows the far pavilion facets through it.
function gemNodes(faces: Face[], xf: Xf, stops: RGB[], st: GemStyle, uid: string, seed: number, t: number): React.ReactNode {
  const cam = camVec(xf);
  const vis: { d: string; depth: number; fill: string }[] = [];
  const inner: { d: string; depth: number; fill: string }[] = [];
  let tablePts: [number, number, number][] | null = null;
  for (const f of faces) {
    const nW = rotN(xf, f.n);
    const pr = f.v.map((p) => proj(xf, p));
    const depth = pr.reduce((s, p) => s + p[2], 0) / pr.length;
    const front = dot(nW, cam) > 0.001;
    if (f.part === 3) {
      if (front) tablePts = pr;
      continue;
    }
    const d = pathOf(pr);
    if (f.part === 2) inner.push({ d, depth, fill: gemColor(stops, gemTone([-nW[0], -nW[1], -nW[2]], cam, f.key, seed, st, true), f.key, seed, st) });
    if (!front) continue;
    vis.push({ d, depth, fill: gemColor(stops, gemTone(nW, cam, f.key, seed, st, false), f.key, seed, st) });
  }
  vis.sort((a, b) => a.depth - b.depth);
  inner.sort((a, b) => a.depth - b.depth);
  const stroke = st.stroke;
  const sw = st.strokeW ?? 0;
  const sparks: React.ReactNode[] = [];
  let tbl: React.ReactNode = null;
  if (tablePts) {
    const pts = tablePts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const id = `tbl_${uid}`;
    const cx = tablePts.reduce((s, p) => s + p[0], 0) / tablePts.length;
    const cy = tablePts.reduce((s, p) => s + p[1], 0) / tablePts.length;
    const w = Math.max(...tablePts.map((p) => p[0])) - Math.min(...tablePts.map((p) => p[0]));
    tbl = (
      <g>
        <clipPath id={id}>
          <polygon points={pts} />
        </clipPath>
        <polygon points={pts} fill={rgb(ramp(stops, quant(0.46, st.levels)))} />
        <g clipPath={`url(#${id})`}>
          {inner.map((q, i) => (
            <path key={i} d={q.d} fill={q.fill} stroke={stroke ?? q.fill} strokeWidth={stroke ? Math.min(1.4, sw * 0.4) : 0.6} strokeLinejoin="round" />
          ))}
          <ellipse cx={cx - w * 0.16} cy={cy - w * 0.1} rx={w * 0.2} ry={w * 0.08} fill="#fff" opacity={0.2 + 0.12 * Math.sin(t * 2 + seed)} transform={`rotate(-24 ${cx} ${cy})`} />
        </g>
        <polygon points={pts} fill="none" stroke={stroke ?? "rgba(255,255,255,0.55)"} strokeWidth={stroke ? sw : 1.4} strokeLinejoin="round" />
      </g>
    );
    if (st.sparkles) {
      sparks.push(<Spark key="a" x={cx - w * 0.3} y={cy - w * 0.06} s={w * 0.34} t={t} phase={seed + 0.2} />);
      sparks.push(<Spark key="b" x={cx + w * 0.34} y={cy + w * 0.12} s={w * 0.26} t={t} phase={seed + 2.1} />);
      sparks.push(<Spark key="c" x={cx + w * 0.02} y={cy - w * 0.4} s={w * 0.2} t={t} phase={seed + 4.0} />);
    }
  }
  return (
    <g>
      {vis.map((q, i) => (
        <path key={i} d={q.d} fill={q.fill} stroke={stroke ?? q.fill} strokeWidth={stroke ? sw : 0.6} strokeLinejoin="round" />
      ))}
      {tbl}
      {sparks}
    </g>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// The shank: a band with a slight taper, soft edges, and shoulders that rise toward the head.
// ---------------------------------------------------------------------------------------------------------------------
function bandFaces(Rin: number, th: number, bw: number, rise: number, seg: number): Face[] {
  const faces: Face[] = [];
  const rOut = (a: number) => Rin + th + rise * Math.exp(-Math.pow(a / 0.62, 2));
  const wAt = (a: number) => bw * (0.62 + 0.38 * ((1 - Math.cos(a)) / 2));
  const vert = (a: number, ax: number, r: number): V3 => [r * Math.sin(a), ax, r * Math.cos(a)];
  const prof = (a: number): [number, number][] => {
    const w = wAt(a) / 2;
    const ro = rOut(a);
    const bev = Math.min(0.12, w * 0.5);
    return [[-w, Rin], [-w, ro - bev], [-w + bev, ro], [w - bev, ro], [w, ro - bev], [w, Rin]];
  };
  for (let i = 0; i < seg; i++) {
    const t0 = -Math.PI + (i / seg) * TAU;
    const t1 = -Math.PI + ((i + 1) / seg) * TAU;
    const p0 = prof(t0);
    const p1 = prof(t1);
    const tm = (t0 + t1) / 2;
    const core: V3 = [Math.sin(tm) * (Rin + th / 2), 0, Math.cos(tm) * (Rin + th / 2)];
    for (let j = 0; j < 6; j++) {
      const j2 = (j + 1) % 6;
      const v: V3[] = [vert(t0, p0[j][0], p0[j][1]), vert(t0, p0[j2][0], p0[j2][1]), vert(t1, p1[j2][0], p1[j2][1]), vert(t1, p1[j][0], p1[j][1])];
      faces.push({ v, n: faceNormal(v, core), key: faces.length, part: 0 });
    }
  }
  return faces;
}

function metalTone(nW: V3, cam: V3, levels?: number): number {
  const d = Math.max(0, dot(nW, cam));
  const r = reflect(nW, cam);
  const e = env(r, 0.7);
  const s = 0.16 + 0.58 * Math.min(1, e) + 0.18 * Math.max(0, nW[2]) + 0.12 * d - 0.2 * Math.max(0, -r[2]);
  return quant(s, levels);
}

// ---------------------------------------------------------------------------------------------------------------------
// The piece
// ---------------------------------------------------------------------------------------------------------------------
export type PieceSpec = {
  cut: Cut;
  stops: RGB[];
  metal: MetalName;
  prongs?: number; // 4 or 6 claws (none with a halo)
  halo?: { n: number; stops: RGB[]; shown?: number };
  shoulder?: { n: number; stops: RGB[] }; // small stones down each shoulder
  rr?: number; // the inner radius of the band, in half widths of the stone
  rise?: number;
  hh?: number;
  band?: boolean; // false: the stone alone (with its halo)
};

const prongPoints = (cut: Cut, count: number): [number, number][] => {
  const c = cutCenter(cut);
  if (cut === "emerald") return [[0.84, 1.2], [-0.84, 1.2], [-0.84, -1.2], [0.84, -1.2]];
  if (cut === "marquise") return [[0, 1.75], [0, -1.75], [0.62, 0.0], [-0.62, 0.0]].slice(0, Math.max(4, count)) as [number, number][];
  const out: [number, number][] = [];
  const off = cut === "pear" || cut === "heart" ? 0 : TAU / count / 2;
  for (let j = 0; j < count; j++) out.push(outlineAt(cut, off + (j / count) * TAU));
  return out.map((o) => [c[0] + (o[0] - c[0]), c[1] + (o[1] - c[1])] as [number, number]);
};

export function ringBottom(spec: PieceSpec, yaw: number, elev: number, oy: number, k: number): number {
  const rr = spec.rr ?? 1.85;
  const ro = rr + BAND_TH;
  const A = Math.sin(yaw) * Math.sin(elev);
  const B = Math.cos(elev);
  return oy + k * (ro * Math.sqrt(A * A + B * B) + (BAND_W / 2) * Math.abs(Math.cos(yaw)) * Math.sin(elev));
}

// Where the stone's girdle centre sits above the middle of the band, in half widths.
export function stoneHeight(spec: PieceSpec): number {
  const rr = spec.rr ?? 1.85;
  const rise = spec.rise ?? 0.3;
  const hp = spec.cut === "emerald" ? 0.8 : 0.92;
  return spec.band === false ? 0 : rr + BAND_TH + rise * 0.55 + (spec.halo ? 0.15 + 0.55 : (spec.hh ?? 0.3) + hp);
}

export const Piece: React.FC<{ spec: PieceSpec; yaw: number; elev: number; ox: number; oy: number; k: number; t: number; style: PieceStyle; uid: string; seed?: number }> = ({ spec, yaw, elev, ox, oy, k, t, style, uid, seed = 1 }) => {
  const xf: Xf = { yaw, elev, k, ox, oy };
  const cam = camVec(xf);
  const metal = style.metals?.[spec.metal] ?? METALS[spec.metal];
  const mc = (s: number) => rgb(ramp(metal, s));
  const rr = spec.rr ?? 1.85;
  const th = BAND_TH;
  const bw = BAND_W;
  const rise = spec.rise ?? 0.3;
  const hh = spec.hh ?? 0.3;
  const hasBand = spec.band !== false;
  const hp = spec.cut === "emerald" ? 0.8 : 0.92;
  const zBase = hasBand ? rr + th + rise * 0.55 : -1.2;
  const zg = hasBand ? (spec.halo ? zBase + 0.15 + 0.55 : zBase + hh + hp) : 0;
  const c = cutCenter(spec.cut);
  const gemFs = place(gemFaces(spec.cut), [0, 0, zg], [1, 0, 0], [0, 1, 0], [0, 0, 1], 1, !!spec.halo && hasBand);
  const gemDepth = depthOf(xf, [c[0], c[1], zg - 0.3]);
  const edgeW = (style.outlineW ?? 0) * (k / 130);

  // band
  const bandNodes: React.ReactNode[] = [];
  const shoulderBack: { depth: number; node: React.ReactNode }[] = [];
  const shoulderFront: { depth: number; node: React.ReactNode }[] = [];
  if (hasBand) {
    const fs = bandFaces(rr, th, bw, rise, k < 100 ? 80 : 120);
    const items: { d: string; depth: number; fill: string }[] = [];
    for (const f of fs) {
      const nW = rotN(xf, f.n);
      if (dot(nW, cam) <= 0.001) continue;
      const pr = f.v.map((p) => proj(xf, p));
      items.push({ d: pathOf(pr), depth: pr.reduce((s, p) => s + p[2], 0) / pr.length, fill: mc(metalTone(nW, cam, style.metalLevels)) });
    }
    items.sort((a, b) => a.depth - b.depth);
    if (style.outline) bandNodes.push(<g key="ol">{items.map((q, i) => <path key={i} d={q.d} fill={style.outline} stroke={style.outline} strokeWidth={edgeW} strokeLinejoin="round" />)}</g>);
    bandNodes.push(<g key="fill">{items.map((q, i) => <path key={i} d={q.d} fill={q.fill} stroke={q.fill} strokeWidth={0.7} strokeLinejoin="round" />)}</g>);
    if (spec.shoulder) {
      const sh = spec.shoulder;
      const rOut = (a: number) => rr + th + rise * Math.exp(-Math.pow(a / 0.62, 2));
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < sh.n; i++) {
          const a = side * (0.5 + i * 0.2);
          const r = rOut(a) - 0.01;
          const bz: V3 = [Math.sin(a), 0, Math.cos(a)];
          const by: V3 = [0, 1, 0];
          const bx = cross(by, bz);
          const sc = 0.15 - i * 0.012;
          const fs2 = place(gemFaces("round"), [r * bz[0], 0, r * bz[2]], bx, by, bz, sc, true);
          const o: V3 = [r * bz[0], 0, r * bz[2]];
          const dep = depthOf(xf, o);
          const node = <g key={`sh${side}${i}`}>{gemNodes(fs2, xf, sh.stops, { ...style.gem, strokeW: (style.gem.strokeW ?? 0) * 0.35, sparkles: false }, `${uid}s${side}${i}`, seed + i + side * 3, t)}</g>;
          (dep < gemDepth ? shoulderBack : shoulderFront).push({ depth: dep, node });
        }
      }
    }
  }

  // halo: a cup under a flat tray that carries a ring of small stones
  const haloBack: { depth: number; node: React.ReactNode }[] = [];
  const haloFront: { depth: number; node: React.ReactNode }[] = [];
  let cupNode: React.ReactNode = null;
  let tray: React.ReactNode = null;
  if (spec.halo) {
    const dOut = 0.6;
    const hs = 0.23;
    const offPt = (t: number, d: number, z: number): V3 => {
      const o = outlineAt(spec.cut, t);
      const vx = o[0] - c[0];
      const vy = o[1] - c[1];
      const l = Math.hypot(vx, vy) || 1;
      return [o[0] + (d * vx) / l, o[1] + (d * vy) / l, z];
    };
    const NN = 40;
    const ringsDef: [number, number][] = [[dOut, zg - 0.06], [dOut, zg - 0.26], [0.2, zg - 0.5], [-0.45, zBase]];
    const rings = ringsDef.map(([d, z]) => Array.from({ length: NN }, (_, i) => offPt((i / NN) * TAU, d, z)));
    const cupItems: { d: string; depth: number; fill: string }[] = [];
    for (let r = 0; r < rings.length - 1; r++) {
      for (let i = 0; i < NN; i++) {
        const v: V3[] = [rings[r][i], rings[r][(i + 1) % NN], rings[r + 1][(i + 1) % NN], rings[r + 1][i]];
        const zm = (v[0][2] + v[2][2]) / 2;
        const n = faceNormal(v, [c[0], c[1], zm]);
        const nW = rotN(xf, n);
        if (dot(nW, cam) <= 0.001) continue;
        const pr = v.map((p) => proj(xf, p));
        cupItems.push({ d: pathOf(pr), depth: pr.reduce((s2, p) => s2 + p[2], 0) / 4, fill: mc(metalTone(nW, cam, style.metalLevels)) });
      }
    }
    cupItems.sort((a2, b2) => a2.depth - b2.depth);
    cupNode = (
      <g>
        {style.outline && cupItems.map((q, i) => <path key={`o${i}`} d={q.d} fill={style.outline} stroke={style.outline} strokeWidth={edgeW} strokeLinejoin="round" />)}
        {cupItems.map((q, i) => <path key={i} d={q.d} fill={q.fill} stroke={q.fill} strokeWidth={0.7} strokeLinejoin="round" />)}
      </g>
    );
    const ringPath = (d: number, z: number) => "M" + rings[0].map((_, i) => { const p = proj(xf, offPt((i / NN) * TAU, d, z)); return `${p[0].toFixed(1)} ${p[1].toFixed(1)}`; }).join("L") + "Z";
    const topPath = ringPath(dOut, zg - 0.06) + ringPath(0, zg - 0.06);
    tray = (
      <g>
        {style.outline && <path d={ringPath(dOut, zg - 0.06)} fill="none" stroke={style.outline} strokeWidth={edgeW} strokeLinejoin="round" />}
        <path d={topPath} fill={mc(0.64)} fillRule="evenodd" />
        <path d={ringPath(dOut - 0.04, zg - 0.06)} fill="none" stroke={mc(0.95)} strokeWidth={2.2} opacity={0.75} />
        <path d={ringPath(0.04, zg - 0.06)} fill="none" stroke={mc(0.2)} strokeWidth={2.2} opacity={0.5} />
      </g>
    );
    const n = spec.halo.n;
    const shown = spec.halo.shown ?? n;
    for (let i = 0; i < n; i++) {
      if (i >= shown) continue;
      const org = offPt((i / n) * TAU - Math.PI / 2 + (spec.cut === "pear" ? Math.PI / 2 : 0), dOut / 2, zg - 0.03);
      const fs2 = place(gemFaces("round"), org, [1, 0, 0], [0, 1, 0], [0, 0, 1], hs, true);
      const dep = depthOf(xf, org);
      const node = <g key={`h${i}`}>{gemNodes(fs2, xf, spec.halo.stops, { ...style.gem, strokeW: (style.gem.strokeW ?? 0) * 0.4, sparkles: false }, `${uid}h${i}`, i + 3, t)}</g>;
      (dep < gemDepth ? haloBack : haloFront).push({ depth: dep, node });
    }
  }

  // claws
  const prongBack: React.ReactNode[] = [];
  const prongFront: React.ReactNode[] = [];
  const gallery: { back: React.ReactNode[]; front: React.ReactNode[] } = { back: [], front: [] };
  if (hasBand && !spec.halo && (spec.prongs ?? 4) > 0) {
    const pts = prongPoints(spec.cut, spec.prongs ?? 4);
    pts.forEach((o, j) => {
      const P = (s: number, z: number): V3 => [c[0] + s * (o[0] - c[0]), c[1] + s * (o[1] - c[1]), z];
      const path = [P(0.16, zBase - 0.05), P(0.5, zg - hp * 0.62), P(0.9, zg - hp * 0.2), P(1.03, zg - 0.04), P(0.93, zg + 0.1)].map((p) => proj(xf, p));
      const d = "M" + path.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L");
      const dep = depthOf(xf, P(1, zg));
      const w = 0.17 * k;
      const node = (
        <g key={`p${j}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} stroke={style.outline ?? mc(0.1)} strokeWidth={w + (style.outline ? edgeW : 3)} />
          <path d={d} stroke={mc(0.5)} strokeWidth={w} />
          <path d={d} stroke={mc(0.92)} strokeWidth={w * 0.3} transform={`translate(${-w * 0.14} ${-w * 0.1})`} opacity={0.85} />
        </g>
      );
      (dep < gemDepth ? prongBack : prongFront).push(node);
    });
    // the gallery rail under the stone
    const segs = 40;
    for (let i = 0; i < segs; i++) {
      const a0 = outlineAt(spec.cut, (i / segs) * TAU);
      const a1 = outlineAt(spec.cut, ((i + 1) / segs) * TAU);
      const s = 0.62;
      const zr = zg - hp * 0.46;
      const p0 = proj(xf, [c[0] + s * (a0[0] - c[0]), c[1] + s * (a0[1] - c[1]), zr]);
      const p1 = proj(xf, [c[0] + s * (a1[0] - c[0]), c[1] + s * (a1[1] - c[1]), zr]);
      const dep = (p0[2] + p1[2]) / 2;
      const node = (
        <g key={`g${i}`} strokeLinecap="round">
          {style.outline && <path d={`M${p0[0]} ${p0[1]}L${p1[0]} ${p1[1]}`} stroke={style.outline} strokeWidth={0.1 * k + edgeW} />}
          <path d={`M${p0[0]} ${p0[1]}L${p1[0]} ${p1[1]}`} stroke={mc(0.55 + 0.3 * Math.sin(i * 0.5))} strokeWidth={0.1 * k} />
        </g>
      );
      (dep < gemDepth ? gallery.back : gallery.front).push(node);
    }
  }

  haloBack.sort((a, b) => a.depth - b.depth);
  haloFront.sort((a, b) => a.depth - b.depth);
  shoulderBack.sort((a, b) => a.depth - b.depth);
  shoulderFront.sort((a, b) => a.depth - b.depth);
  return (
    <g>
      {bandNodes}
      {cupNode}
      {tray}
      {shoulderBack.map((s) => s.node)}
      {gallery.back}
      {prongBack}
      {haloBack.map((s) => s.node)}
      {gemNodes(gemFs, xf, spec.stops, style.gem, `${uid}m`, seed, t)}
      {gallery.front}
      {prongFront}
      {haloFront.map((s) => s.node)}
      {shoulderFront.map((s) => s.node)}
    </g>
  );
};
