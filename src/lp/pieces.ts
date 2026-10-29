// Low-poly jewelry and props for the scenes in scenes2.tsx: rings, necklaces, earrings, brooches, tiaras, a crown and
// sceptre, a parcel, a ship, a full-length figure.
import { Mat, Obj, V3, rnd } from "./engine";
import { box, ico, jitter, lathe, paint, prism, shape, slab, torus, tube } from "./mesh";
import { DIAMOND, GOLD, GOLD_DARK, PearlLp, PearDrop, SILVER, Stone, Tr, group, shadeHex, stoneMat } from "./models";

export const ROSE: Mat = { color: "#d99a7c", spec: 0.55, shine: 18 };
export const metalMat = (m: string): Mat => (m === "white" ? SILVER : m === "rose" ? ROSE : GOLD);

// A small stone or a pearl, for the many little ones round a piece.
const small = (pearls: boolean, tone: string | undefined, pos: V3, r: number): Obj[] =>
  pearls ? PearlLp({ pos, scale: r }) : [{ mesh: ico(0, r), mat: stoneMat(tone), pos }];

// A ring standing up, facing the viewer, about 2 wide: band, head, prongs and the stone on top.
export const Ring = (metal: string, shapeName: string, tone: string | undefined, tr: Tr = {}): Obj[] => {
  const M = metalMat(metal);
  const objs: Obj[] = [
    { mesh: shape(torus(1, 0.13, 28, 6), ([x, y, z]) => [x, -z, y * 1.4]), mat: M },
    { mesh: lathe([[0.1, 0], [0.26, 0.25], [0.32, 0.3]], 8), mat: M, pos: [0, 1.05, 0] },
  ];
  objs.push(...Stone(shapeName, tone, { pos: [0, 1.55, 0], rot: [0.5, 0, 0], scale: 0.42 }, false));
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    objs.push({ mesh: tube([[Math.cos(a) * 0.2, 1.2, Math.sin(a) * 0.2], [Math.cos(a) * 0.36, 1.55, Math.sin(a) * 0.36 + 0.1], [Math.cos(a) * 0.3, 1.78, Math.sin(a) * 0.3 + 0.18]], 0.035, 4), mat: M });
  }
  return group(objs, tr);
};

// An open ring box in velvet, 2.6 wide, its top at y = 0: a puffed cushion with a slot for the ring, the lid open
// at the back with a dark puffed lining.
export const RingBox = (velvet: string, lid: number, tr: Tr = {}): Obj[] => {
  const outer: Mat = { color: shadeHex(velvet, -0.1), spec: 0.45, shine: 14, facets: 0.12 };
  const inner: Mat = { color: shadeHex(velvet, -0.1), spec: 0.1, facets: 0.25 };
  const lining: Mat = { color: shadeHex(velvet, -0.35), spec: 0.06, facets: 0.3 };
  const pad = jitter(lathe([[1.1, 0], [1.15, 0.12], [0.9, 0.24], [0, 0.28]], 4, Math.PI / 4), 0.02, 3);
  const objs: Obj[] = [
    { mesh: box(2.6, 1.3, 2.0), mat: outer, pos: [0, -0.65, 0] },
    { mesh: box(2.64, 0.05, 2.04), mat: GOLD, pos: [0, -0.03, 0] },
    { mesh: pad, mat: inner, pos: [0, 0, 0.05], scale: [1.05, 1, 0.78] },
    { mesh: box(0.12, 0.2, 1.4), mat: { color: shadeHex(velvet, -0.6) }, pos: [0, 0.22, 0.05] },
  ];
  // the lid, hinged on the back top edge: its own box and lining, then turned open
  const lidObjs: Obj[] = [
    { mesh: paint(box(2.6, 0.5, 2.0), (n) => (n[1] < -0.9 ? shadeHex(velvet, -0.45) : undefined)), mat: outer, pos: [0, 0.25, 1.0] },
    { mesh: pad, mat: lining, pos: [0, -0.01, 1.0], rot: [0, 0, Math.PI], scale: [1.05, 0.8, 0.78] },
  ];
  objs.push(...group(lidObjs, { pos: [0, 0, -1.0], rot: [-lid * 1.75, 0, 0] }));
  return group(objs, tr);
};

// A velvet bust from the waist up with a necklace round its neck. `pearls`: a string of pearls; else a chain of beads.
export const NecklaceOnBust = (velvet: string, metal: string, shapeName: string, tone: string | undefined, pearls: boolean, drop: string, sway: number, tr: Tr = {}): Obj[] => {
  const prof: [number, number][] = [
    [1.5, -2.6],
    [1.48, -1.4],
    [1.38, -0.3],
    [1.0, 0.28],
    [0.62, 0.55],
    [0.5, 1.0],
    [0.52, 1.45],
    [0, 1.52],
  ];
  const SZ = 0.55;
  const radius = (y: number) => {
    for (let i = 0; i < prof.length - 1; i++) {
      const [r0, y0] = prof[i];
      const [r1, y1] = prof[i + 1];
      if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
    }
    return 0;
  };
  const front = (x: number, y: number) => SZ * radius(y) * Math.sqrt(Math.max(0, 1 - (x / Math.max(1e-6, radius(y))) ** 2));
  const objs: Obj[] = [{ mesh: shape(lathe(prof, 16, Math.PI / 2), ([x, y, z]) => [x, y, z * SZ]), mat: { color: velvet, spec: 0.3, shine: 8, facets: 0.1 } }];
  const M = metalMat(metal);
  const n = pearls ? 21 : 31;
  const pts: V3[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = (u - 0.5) * 1.5;
    const y = 0.55 - Math.sin(u * Math.PI) * 0.75 + (1 - Math.sin(u * Math.PI)) * 0.05;
    pts.push([x + sway * Math.sin(u * Math.PI) * 0.1, y, front(x, y) + 0.07]);
  }
  if (pearls) pts.forEach((p) => objs.push(...PearlLp({ pos: p, scale: 0.075 })));
  else {
    objs.push({ mesh: tube(pts, 0.025, 4), mat: { ...M, bias: 0.2 } });
    pts.forEach((p, i) => i % 3 === 0 && objs.push({ mesh: ico(0, 0.045), mat: { ...M, bias: 0.2 }, pos: p }));
  }
  const bottom = pts[Math.floor(n / 2)];
  const hang: V3 = [bottom[0], bottom[1] - 0.12, bottom[2] + 0.06];
  objs.push({ mesh: ico(0, 0.05), mat: { ...M, bias: 0.25 }, pos: hang });
  if (drop === "pearl") objs.push(...group(PearDrop({ rot: [0, 0, Math.PI] , scale: 0.22 }), { pos: [hang[0], hang[1] - 0.3, hang[2] + 0.05], rot: [0, 0, sway * 0.05] }));
  else objs.push(...Stone(shapeName === "round" ? "pear" : shapeName, tone, { pos: [hang[0], hang[1] - 0.3, hang[2] + 0.08], rot: [0, 0, Math.PI + sway * 0.05], scale: 0.24 }));
  return group(objs, tr);
};

// A pair of drop earrings: hook, a small stone, a wire and a pear-shaped drop.
export const Earrings = (metal: string, shapeName: string, tone: string | undefined, pearls: boolean, sway: number, tr: Tr = {}): Obj[] => {
  const M = metalMat(metal);
  const objs: Obj[] = [];
  for (const s of [-1, 1]) {
    const one: Obj[] = [
      { mesh: tube([[0, 1.15, 0], [0.18, 1.5, 0], [0.05, 1.75, 0], [-0.15, 1.6, 0.02]], 0.03, 4), mat: M },
      ...small(pearls, tone, [0, 1.0, 0.05], 0.17),
      { mesh: tube([[0, 0.85, 0], [0, 0.45, 0]], 0.025, 4), mat: M },
      ...Stone(shapeName === "round" ? "pear" : shapeName, tone, { pos: [0, -0.05, 0.05], rot: [0, 0, Math.PI], scale: 0.45 }),
    ];
    objs.push(...group(one, { pos: [s * 0.75, 0, 0], rot: [0, s * 0.15, sway * s * 0.04] }));
  }
  return group(objs, tr);
};

// A round brooch: a ring of small stones, wire petals and a big stone in the middle.
export const Brooch = (metal: string, shapeName: string, tone: string | undefined, pearls: boolean, tr: Tr = {}): Obj[] => {
  const M = metalMat(metal);
  const objs: Obj[] = [
    { mesh: shape(torus(1.3, 0.07, 30, 5), ([x, y, z]) => [x, -z, y]), mat: M },
    { mesh: prism(12, 0.62, 0.14), mat: M, rot: [Math.PI / 2, 0, 0] },
  ];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const p: V3 = [Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0.08];
    objs.push(...small(pearls, tone, p, 0.2));
    objs.push({ mesh: tube([[0, 0, 0.05], [Math.cos(a + 0.35) * 0.75, Math.sin(a + 0.35) * 0.75, 0.08], p], 0.035, 4), mat: M });
  }
  objs.push(...Stone(shapeName, tone, { pos: [0, 0, 0.2], scale: 0.5 }));
  return group(objs, tr);
};

// A tiara, 3.4 wide: a curved band set with small stones, seven pointed loops rising from it (tallest in the middle),
// scrolls between them, a stone in each loop (the big one in the middle) and a small one on each point.
export const Tiara = (metal: string, shapeName: string, tone: string | undefined, pearls: boolean, tr: Tr = {}): Obj[] => {
  const M = metalMat(metal);
  const R = 1.7;
  const D = 0.9;
  const arc = (a: number): V3 => [-Math.cos(a) * R, 0, Math.sin(a) * D - D * 0.6];
  const along = (a: number): V3 => {
    const v: V3 = [Math.sin(a) * R, 0, Math.cos(a) * D];
    const l = Math.hypot(v[0], v[2]);
    return [v[0] / l, 0, v[2] / l];
  };
  const objs: Obj[] = [];
  const band: V3[] = [];
  for (let i = 0; i <= 24; i++) band.push(arc(Math.PI * (0.08 + (0.84 * i) / 24)));
  objs.push({ mesh: tube(band, 0.07, 5), mat: M });
  for (let i = 0; i <= 16; i++) {
    const [x, y, z] = arc(Math.PI * (0.1 + (0.8 * i) / 16));
    objs.push(...small(pearls, tone, [x, y, z + 0.07], 0.06));
  }
  const peaks = 7;
  const bases: { b: V3; e: V3; w: number }[] = [];
  for (let k = 0; k < peaks; k++) {
    const u = k / (peaks - 1);
    const a = Math.PI * (0.2 + 0.6 * u);
    const b = arc(a);
    const e = along(a);
    const h = 0.55 + 0.75 * Math.sin(u * Math.PI);
    const w = 0.2 + 0.07 * Math.sin(u * Math.PI);
    bases.push({ b, e, w });
    const loop: V3[] = [];
    for (let j = 0; j <= 18; j++) {
      const f = (j / 18) * Math.PI * 2;
      const lx = w * Math.sin(f) * Math.sin(f / 2);
      const ly = (h * (Math.cos(f) + 1)) / 2;
      loop.push([b[0] + e[0] * lx, b[1] + ly, b[2] + e[2] * lx]);
    }
    objs.push({ mesh: tube(loop, 0.035, 4), mat: M });
    const mid: V3 = [b[0], b[1] + h * 0.38, b[2] + 0.04];
    if (k === 3) objs.push(...Stone(shapeName, tone, { pos: mid, rot: [0.1, 0, 0], scale: 0.3 }));
    else objs.push(...small(pearls, tone, mid, 0.08 + Math.sin(u * Math.PI) * 0.05));
    objs.push(...small(pearls, tone, [b[0], b[1] + h + 0.05, b[2]], 0.05));
  }
  // scrolls joining each loop to the next
  for (let k = 0; k < peaks - 1; k++) {
    const p = bases[k];
    const q = bases[k + 1];
    const m: V3 = [(p.b[0] + q.b[0]) / 2, 0.32, (p.b[2] + q.b[2]) / 2 + 0.02];
    objs.push({ mesh: tube([[p.b[0] + p.e[0] * p.w * 0.6, 0.12, p.b[2] + p.e[2] * p.w * 0.6], m, [q.b[0] - q.e[0] * q.w * 0.6, 0.12, q.b[2] - q.e[2] * q.w * 0.6]], 0.025, 4), mat: M });
    objs.push(...small(pearls, tone, [m[0], m[1] + 0.06, m[2] + 0.03], 0.045));
  }
  return group(objs, tr);
};

// A state crown on a velvet cap with an ermine band, arches of pearls and a cross on an orb.
export const CrownLp = (tr: Tr = {}): Obj[] => {
  const objs: Obj[] = [
    { mesh: lathe([[1.0, 0], [1.06, 0.45], [0.92, 1.05], [0.5, 1.42], [0, 1.5]], 14), mat: { color: "#6a2777", spec: 0.15 } },
    { mesh: lathe([[1.12, -0.05], [1.12, 0.42], [1.05, 0.42], [1.05, -0.05]], 16, 0, false), mat: GOLD },
  ];
  const ermine = torus(1.15, 0.16, 24, 6);
  objs.push({ mesh: { v: ermine.v, f: ermine.f.map((f, i) => ({ idx: f.idx, color: rnd(i * 7) > 0.88 ? "#1b1b1b" : "#f3efe6" })) }, mat: { color: "#f3efe6", spec: 0.05 }, pos: [0, -0.12, 0] });
  const tones = ["red", "blue", "green", "blue", "green", "blue", "red", "blue"];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    objs.push({ mesh: ico(0, i % 2 ? 0.1 : 0.14), mat: i === 0 ? DIAMOND : stoneMat(tones[i]), pos: [Math.cos(a) * 1.15, 0.2, Math.sin(a) * 1.15] });
    // crosses and fleurs on the band
    if (i % 2 === 0) objs.push(...group([{ mesh: box(0.12, 0.42, 0.06), mat: GOLD }, { mesh: box(0.34, 0.12, 0.06), mat: GOLD, pos: [0, 0.06, 0] }], { pos: [Math.cos(a) * 1.1, 0.62, Math.sin(a) * 1.1], rot: [0, -a + Math.PI / 2, 0] }));
    else objs.push({ mesh: lathe([[0.12, 0], [0.16, 0.12], [0, 0.34]], 4), mat: GOLD, pos: [Math.cos(a) * 1.1, 0.42, Math.sin(a) * 1.1] });
  }
  // two arches crossing over the top, with pearls along them
  for (const r of [0, Math.PI / 2]) {
    const pts: V3[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI;
      pts.push([Math.cos(a) * 1.08, 0.42 + Math.sin(a) * 1.25, 0]);
    }
    const arch = pts.map(([x, y]) => [x * Math.cos(r), y, x * Math.sin(r)] as V3);
    objs.push({ mesh: tube(arch, 0.07, 5), mat: GOLD });
    arch.forEach((p, i) => i % 2 === 1 && objs.push(...PearlLp({ pos: [p[0] * 1.06, p[1] + 0.06, p[2] * 1.06], scale: 0.07 })));
  }
  objs.push({ mesh: ico(1, 0.2), mat: GOLD, pos: [0, 1.85, 0] });
  objs.push({ mesh: box(0.1, 0.4, 0.08), mat: GOLD, pos: [0, 2.2, 0] }, { mesh: box(0.3, 0.1, 0.08), mat: GOLD, pos: [0, 2.24, 0] });
  objs.push(...Stone("cushion", undefined, { pos: [0, 0.2, 1.17], scale: 0.18 }));
  return group(objs, tr);
};

// A sceptre lying on a slant, its big pear-shaped stone at the top right.
export const SceptreLp = (tr: Tr = {}): Obj[] => {
  const a: V3 = [-2.4, -1.4, 0];
  const b: V3 = [1.9, 1.15, 0];
  const at = (u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 0];
  const objs: Obj[] = [{ mesh: tube([a, b], 0.1, 6), mat: GOLD }];
  for (const u of [0.2, 0.45, 0.7]) objs.push({ mesh: ico(0, 0.17), mat: GOLD, pos: at(u) });
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
  objs.push(...Stone("pear", undefined, { pos: at(1.07), rot: [0, 0, ang + Math.PI], scale: 0.42 }));
  objs.push({ mesh: ico(1, 0.24), mat: { color: "#7b4aa8", spec: 0.6, shine: 16, facets: 0.4 }, pos: at(1.2) });
  objs.push(...group([{ mesh: box(0.09, 0.42, 0.08), mat: GOLD }, { mesh: box(0.3, 0.09, 0.08), mat: GOLD, pos: [0, 0.06, 0] }], { pos: at(1.3), rot: [0, 0, ang] }));
  return group(objs, tr);
};

// A brown paper parcel tied with string, 2.6 wide, sitting on y = 0. `open`: no string on top, the flaps folded back.
export const ParcelLp = (tr: Tr = {}, open = false): Obj[] => {
  const paper: Mat = { color: "#9a7650", spec: 0.05 };
  const string: Mat = { color: "#efe2c4", spec: 0.05 };
  if (open) {
    const objs: Obj[] = [
      { mesh: paint(box(2.6, 1.5, 1.8), (n) => (n[1] > 0.9 ? "#3a2a18" : undefined)), mat: paper, pos: [0, 0.75, 0] },
      { mesh: box(0.07, 1.54, 1.84), mat: string, pos: [0.45, 0.75, 0] },
    ];
    // four flaps hinged on the top edges, folded out and back
    const flap = (w: number, d: number): Obj["mesh"] => shape(box(w, 0.04, d), ([x, y, z]) => [x, y, z + d / 2]);
    objs.push({ mesh: flap(2.6, 0.8), mat: paper, pos: [0, 1.5, 0.9], rot: [0.5, 0, 0] });
    objs.push({ mesh: flap(2.6, 0.8), mat: paper, pos: [0, 1.5, -0.9], rot: [-0.9, Math.PI, 0] });
    objs.push({ mesh: flap(1.8, 0.7), mat: { color: "#86643f", spec: 0.05 }, pos: [1.3, 1.5, 0], rot: [0, Math.PI / 2, 0.0] });
    objs.push({ mesh: flap(1.8, 0.7), mat: { color: "#86643f", spec: 0.05 }, pos: [-1.3, 1.5, 0], rot: [0, -Math.PI / 2, 0.0] });
    return group(objs, tr);
  }
  const objs: Obj[] = [
    { mesh: box(2.6, 1.5, 1.8), mat: paper, pos: [0, 0.75, 0] },
    { mesh: box(2.64, 1.54, 0.07), mat: string, pos: [0.45, 0.75, 0] },
    { mesh: box(0.07, 1.54, 1.84), mat: string, pos: [0.45, 0.75, 0] },
    { mesh: box(2.64, 0.07, 1.84), mat: string, pos: [0, 1.5, 0] },
  ];
  for (const s of [-1, 1]) objs.push({ mesh: shape(torus(0.17, 0.035, 12, 4), ([x, y, z]) => [x * 1.3, -z, y]), mat: string, pos: [0.45 + s * 0.24, 1.66, 0.02], rot: [0, s * 0.35, s * 0.55] });
  objs.push({ mesh: ico(0, 0.07), mat: string, pos: [0.45, 1.57, 0.02] });
  objs.push({ mesh: tube([[0.45, 1.55, 0.05], [0.3, 1.52, 0.5], [0.22, 1.5, 0.92], [0.18, 1.2, 0.93]], 0.03, 4), mat: string });
  return group(objs, tr);
};

// A steamship side on, 7 long: hull, decks, two funnels, masts and lit windows. The bow points to +x.
export const ShipLp = (t: number, tr: Tr = {}): Obj[] => {
  const hullPts: [number, number][] = [
    [-3.3, 0.6],
    [-3.2, -0.25],
    [-2.8, -0.55],
    [2.7, -0.55],
    [3.6, 0.75],
  ];
  const hull = shape(slab(hullPts, 1.5), ([x, y, z]) => [x, y, z * Math.min(1, Math.max(0.05, (3.65 - x) / 1.6)) * (y < 0 ? 0.75 : 1)]);
  const dark: Mat = { color: "#121826", spec: 0.25, shine: 10 };
  const objs: Obj[] = [
    { mesh: hull, mat: dark },
    { mesh: box(6.3, 0.1, 1.42), mat: GOLD_DARK, pos: [0.1, 0.12, 0] },
    { mesh: box(3.8, 0.5, 1.1), mat: { color: "#1b2235", spec: 0.2 }, pos: [-0.2, 0.85, 0] },
    { mesh: box(2.4, 0.4, 0.9), mat: { color: "#1b2235", spec: 0.2 }, pos: [-0.2, 1.3, 0] },
  ];
  for (const x of [-0.85, 0.45]) {
    objs.push({ mesh: prism(8, 0.26, 1.2, 0.24), mat: { color: "#0f1420", spec: 0.2 }, pos: [x, 2.05, 0] });
    objs.push({ mesh: prism(8, 0.27, 0.22), mat: { color: "#7a2a24", spec: 0.2 }, pos: [x, 2.55, 0] });
  }
  for (const x of [-2.6, 2.6]) objs.push({ mesh: tube([[x, 0.6, 0], [x, 3.1, 0]], 0.04, 4), mat: GOLD_DARK });
  const lit: Mat = { color: "#f2c56e", glow: 0.9 };
  for (let i = 0; i < 9; i++) objs.push({ mesh: box(0.16, 0.14, 0.04), mat: { ...lit, glow: 0.6 + 0.3 * Math.abs(Math.sin(t * 1.3 + i)) }, pos: [-1.9 + i * 0.42, 0.85, 0.56] });
  for (let i = 0; i < 5; i++) objs.push({ mesh: box(0.2, 0.13, 0.04), mat: lit, pos: [-1.0 + i * 0.4, 1.3, 0.46] });
  objs.push({ mesh: box(0.14, 0.14, 0.14), mat: { color: "#fff3d0", glow: 1 }, pos: [2.9, 0.85, 0] });
  return group(objs, tr);
};

// One person seen full length, dark against the light: coat, legs, arms and a hat. `walk` 0..1 swings the legs.
export const FigureLp = (hat: string, t: number, walk: number, lantern: boolean, tr: Tr = {}): Obj[] => {
  const coat: Mat = { color: "#161b28", spec: 0.25, shine: 8 };
  const dark: Mat = { color: "#0e121c", spec: 0.2, shine: 8 };
  const step = Math.sin(t * 5) * 0.25 * walk;
  const objs: Obj[] = [
    { mesh: tube([[-0.25, 2.4, 0], [-0.26 - step * 0.3, 1.2, step], [-0.28, 0.1, step * 1.4]], 0.17, 5), mat: dark },
    { mesh: tube([[0.25, 2.4, 0], [0.26 + step * 0.3, 1.2, -step], [0.28, 0.1, -step * 1.4]], 0.17, 5), mat: dark },
    { mesh: shape(lathe([[0.95, 1.25], [0.8, 2.4], [0.72, 3.5], [0.7, 4.1], [0.38, 4.38], [0, 4.42]], 10, Math.PI / 2), ([x, y, z]) => [x, y, z * 0.62]), mat: coat },
    { mesh: tube([[-0.68, 4.1, 0], [-0.82, 3.2, -step * 0.6], [-0.78, 2.35, -step]], 0.15, 5), mat: coat },
    { mesh: tube([[0.68, 4.1, 0], [0.82, 3.2, step * 0.6], [0.78, 2.35, step]], 0.15, 5), mat: coat },
    { mesh: prism(6, 0.16, 0.35), mat: dark, pos: [0, 4.5, 0] },
    { mesh: jitter(ico(1, 0.36), 0.03, 4), mat: { color: "#2a2420", spec: 0.1 }, pos: [0, 4.92, 0], scale: [0.92, 1.08, 0.95] },
  ];
  const hatMat: Mat = { color: "#0b0e16", spec: 0.3, shine: 10 };
  if (hat === "bowler") objs.push({ mesh: lathe([[0.4, 0], [0.38, 0.12], [0.3, 0.26], [0, 0.3]], 10), mat: hatMat, pos: [0, 5.08, 0] }, { mesh: prism(10, 0.56, 0.04), mat: hatMat, pos: [0, 5.1, 0] });
  else if (hat === "top") objs.push({ mesh: prism(10, 0.33, 0.6, 0.36), mat: hatMat, pos: [0, 5.4, 0] }, { mesh: prism(10, 0.54, 0.04), mat: hatMat, pos: [0, 5.1, 0] });
  else if (hat === "cap") objs.push({ mesh: lathe([[0.4, 0], [0.36, 0.14], [0, 0.22]], 8), mat: hatMat, pos: [0, 5.08, 0] }, { mesh: box(0.5, 0.04, 0.3), mat: hatMat, pos: [0, 5.1, 0.36] });
  if (lantern) objs.push({ mesh: box(0.24, 0.32, 0.24), mat: { color: "#ffd98a", glow: 0.9 + 0.1 * Math.sin(t * 9) }, pos: [0.8, 2.05, 0.05] });
  return group(objs, tr);
};
