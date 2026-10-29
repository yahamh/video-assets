// Low-poly models: the jewels, the props and the people of the stories.
import { Mat, Mesh, Obj, V3, place, rnd, rotate } from "./engine";
import { box, egg, gem, ico, jitter, lathe, paint, part, prism, shape, slab, tube } from "./mesh";

export type Tr = { pos?: V3; rot?: V3; scale?: V3 | number };

// Bakes each object's own placement into its points, then places the lot with `tr`.
export const group = (objs: Obj[], tr: Tr): Obj[] =>
  objs.map((o) => ({ mat: o.mat, key: o.key, mesh: shape(o.mesh, (p) => place(place(p, o), tr as Obj)) }));

export const GOLD: Mat = { color: "#d8a84a", spec: 0.55, shine: 18 };
export const GOLD_DARK: Mat = { color: "#9c7330", spec: 0.3, shine: 12 };
export const SILVER: Mat = { color: "#c9d0d6", spec: 0.6, shine: 22 };
export const DIAMOND: Mat = { color: "#b9cad8", spec: 0.9, shine: 22, sparkle: 0.9, glow: 0.04, facets: 0.7 };

const TONES: Record<string, string> = { blue: "#2546a8", red: "#b3203a", green: "#1f8a5b", pink: "#e58fb0", yellow: "#f2c84b" };
export const stoneMat = (tone?: string): Mat => {
  if (!tone || tone === "clear" || tone === "#e9f1f6") return DIAMOND;
  return { color: TONES[tone] ?? tone, spec: 0.8, shine: 22, sparkle: 0.6, glow: 0.06, facets: 0.55 };
};

// A cut stone, table toward the viewer (`face` true) or up. `shape`: round, oval, cushion, emerald, pear, marquise, heart.
export const Stone = (shapeName = "round", tone?: string, tr: Tr = {}, face = true): Obj[] => {
  const seg = shapeName === "cushion" || shapeName === "emerald" ? 8 : 16;
  let m: Mesh = gem(seg);
  const sx = { oval: 0.78, marquise: 0.5, pear: 0.72, emerald: 0.72, heart: 1 }[shapeName] ?? 1;
  m = shape(m, ([x, y, z]) => {
    let zz = z;
    if (shapeName === "pear" && z < 0) zz = z * 1.45;
    if (shapeName === "marquise") zz = z * 1.5;
    return [x * sx * (shapeName === "pear" ? 1 + z * 0.25 : 1), y, zz];
  });
  const o: Obj = { mesh: m, mat: stoneMat(tone), rot: face ? [Math.PI / 2, 0, 0] : [0, 0, 0] };
  return group([o], tr);
};

// A rough crystal: a lumpy, many-sided stone.
export const Rough = (tr: Tr = {}, tone = "#cfdde6"): Obj[] =>
  group([{ mesh: jitter(ico(1, 1), 0.35, 4), mat: { color: tone, spec: 0.5, shine: 14, sparkle: 0.35, glow: 0.05 } }], tr);

// A pearl.
export const PearlLp = (tr: Tr = {}, tone = "#f3eee4"): Obj[] =>
  group([{ mesh: ico(1, 1), mat: { color: tone, spec: 0.7, shine: 16, glow: 0.1 } }], tr);

// A pear-shaped pearl hanging from a gold cap, about 2 tall.
export const PearDrop = (tr: Tr = {}, tone = "#f3eee4"): Obj[] =>
  group(
    [
      {
        mesh: shape(ico(2, 1), ([x, y, z]) => {
          const k = y > 0 ? 1 - y * 0.5 : 1;
          return [x * k * 0.8, y * 1.15 - 0.2, z * k * 0.8];
        }),
        mat: { color: tone, spec: 0.7, shine: 16, glow: 0.1 },
      },
      { mesh: lathe([[0.22, 0], [0.18, 0.18], [0, 0.26]], 8), mat: GOLD, pos: [0, 0.82, 0] },
      { mesh: prism(6, 0.04, 0.9), mat: GOLD, pos: [0, 1.5, 0] },
    ],
    tr,
  );

// The ribbed gold Easter egg on its three-legged stand, 2 tall, standing on y = -1.45.
export const FabergeEgg = (t: number, tr: Tr = {}): Obj[] => {
  const turn = t * 0.5;
  const objs: Obj[] = [{ mesh: egg(14, 10), mat: GOLD, rot: [0, turn, 0] }];
  // the band of blue and white stones round its middle
  for (let i = 0; i < 14; i++) {
    const a = turn + (i / 14) * Math.PI * 2;
    const r = 0.73;
    objs.push({
      mesh: ico(0, i % 2 ? 0.07 : 0.09),
      mat: i % 2 ? DIAMOND : stoneMat("blue"),
      pos: [r * Math.cos(-a), 0.05, r * Math.sin(-a)],
    });
  }
  objs.push({ mesh: prism(10, 0.22, 0.12), mat: GOLD_DARK, pos: [0, -1.02, 0] });
  for (let k = 0; k < 3; k++) {
    const a = turn + (k / 3) * Math.PI * 2 + 0.5;
    const at = (r: number, y: number): V3 => [Math.cos(a) * r, y, Math.sin(a) * r];
    objs.push({ mesh: tube([at(0.16, -0.98), at(0.36, -1.08), at(0.5, -1.26), at(0.5, -1.42)], 0.055, 5), mat: GOLD });
    objs.push({ mesh: ico(0, 0.1), mat: GOLD, pos: at(0.5, -1.45) });
  }
  return group(objs, tr);
};

// A velvet cushion with tassels, 2.4 wide.
export const Cushion = (tr: Tr = {}, color = "#2b3f86"): Obj[] => {
  const m = lathe(
    [
      [0, -0.28],
      [1.25, -0.26],
      [1.52, -0.1],
      [1.56, 0.04],
      [1.38, 0.2],
      [0.85, 0.34],
      [0, 0.4],
    ],
    4,
    Math.PI / 4,
  );
  const objs: Obj[] = [{ mesh: jitter(m, 0.05, 9), mat: { color, spec: 0.18, shine: 8 } }];
  for (const [x, z] of [[1.1, 1.1], [-1.1, 1.1], [1.1, -1.1], [-1.1, -1.1]]) {
    objs.push({ mesh: prism(5, 0.03, 0.35, 0.09), mat: GOLD, pos: [x, -0.3, z] });
  }
  return group(objs, tr);
};

// A wooden chest, open by `lid` 0..1, 3 wide.
export const Chest = (lid: number, tr: Tr = {}): Obj[] => {
  const wood: Mat = { color: "#6b3f22", spec: 0.1 };
  const band: Mat = { color: "#b8913f", spec: 0.5, shine: 14 };
  const lining = "#30101a";
  const objs: Obj[] = [
    { mesh: paint(box(3, 1.4, 1.8), (n) => (n[1] > 0.9 ? lining : undefined)), mat: wood, pos: [0, 0, 0] },
    { mesh: box(3.06, 0.14, 1.86), mat: band, pos: [0, 0.4, 0] },
    { mesh: box(3.06, 0.14, 1.86), mat: band, pos: [0, -0.45, 0] },
    { mesh: box(0.36, 0.42, 0.1), mat: band, pos: [0, 0.38, 0.92] },
  ];
  // the lid: a half round along the chest, hinged at the back top edge, lined inside
  const arc: [number, number][] = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 6) * Math.PI;
    return [0.92 * Math.cos(a), 0.55 * Math.sin(a)];
  });
  const lidMesh = paint(
    shape(slab(arc, 3.04), (p) => {
      const [x, y, z] = rotate(p, [0, Math.PI / 2, 0]);
      return [x, y, z + 0.92];
    }),
    (n) => (n[1] < -0.9 ? lining : undefined),
  );
  objs.push({ mesh: lidMesh, mat: wood, pos: [0, 0.7, -0.92], rot: [-lid * 1.45, 0, 0] });
  return group(objs, tr);
};

// ---------------------------------------------------------------- people

export type LookLp = {
  skin?: string;
  hair?: string;
  hairColor?: string;
  facial?: string;
  hat?: string;
  outfit?: string;
  outfitColor?: string;
  accent?: string;
  glasses?: string;
  jewel?: string;
  jewelTone?: string;
  old?: boolean;
  mask?: boolean;
  prop?: string;
  propTone?: string;
};

const BROWS: Record<string, [number, number]> = {
  neutral: [0, 0],
  smile: [0.04, 0],
  surprised: [0.16, 0],
  worried: [0.06, 0.25],
  focused: [-0.05, -0.2],
  proud: [0.05, -0.08],
  sly: [-0.03, -0.25],
};

// One person from the waist up, the base of the neck at the origin, the head about 2 tall.
export const PersonLp = (look: LookLp, expression: string, t: number, lookDir = 0, gasp = 0, seed = 1): Obj[] => {
  const skin = look.skin ?? "#e2b48f";
  const hairC = look.old ? "#b9b4ab" : look.hairColor ?? "#3a2a1e";
  const outfit = look.outfit ?? "suit";
  const cloth = look.outfitColor ?? (outfit === "royal" ? "#8e1f2c" : outfit === "apron" ? "#ece2cc" : "#2b3550");
  const accent = look.accent ?? "#8e1f2c";
  const shirt = "#efe8d8";
  const objs: Obj[] = [];

  // the body: one turned shape, flattened front to back. Shirt, lapels, apron and straps are thin shapes laid on its front.
  const prof: [number, number][] = [
    [2.75, -7],
    [2.8, -4.2],
    [2.72, -2.2],
    [2.5, -1.0],
    [2.1, -0.32],
    [1.25, 0.02],
    [0.62, 0.16],
    [0, 0.2],
  ];
  const breathe = 1 + 0.012 * Math.sin(t * 2.2);
  const SX = 0.8 * breathe;
  const SZ = 0.5;
  const radius = (y: number) => {
    for (let i = 0; i < prof.length - 1; i++) {
      const [r0, y0] = prof[i];
      const [r1, y1] = prof[i + 1];
      if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
    }
    return y < prof[0][1] ? prof[0][0] : 0;
  };
  let body = shape(lathe(prof, 18, Math.PI / 2), ([x, y, z]) => [x * SX, y, z * SZ]);
  body = jitter(body, 0.04, seed);
  if (outfit === "royal")
    body = { v: body.v, f: body.f.map((f) => (body.v[f.idx[0]][1] > -1.3 ? { idx: f.idx, color: rnd(f.idx[0] * 3) > 0.8 ? "#1b1b1b" : "#f3efe6" } : f)) };
  objs.push({ mesh: body, mat: { color: cloth, spec: outfit === "gown" ? 0.25 : 0.06 } });
  // a shape on the front of the body between y0 (top) and y1, from xl(y) to xr(y)
  const front = (x: number, y: number) => {
    const A = radius(y) * SX;
    return SZ * radius(y) * Math.sqrt(Math.max(0, 1 - (x / Math.max(A, 1e-6)) ** 2));
  };
  const onFront = (y0: number, y1: number, xl: (y: number) => number, xr: (y: number) => number, color: string, rows = 6, lift = 0.06) => {
    const v: V3[] = [];
    const f: { idx: number[] }[] = [];
    const cols = 3;
    for (let j = 0; j <= rows; j++) {
      const y = y0 + ((y1 - y0) * j) / rows;
      for (let i = 0; i <= cols; i++) {
        const x = xl(y) + ((xr(y) - xl(y)) * i) / cols;
        v.push([x, y, front(x, y) + lift]);
      }
    }
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const a = j * (cols + 1) + i;
        const b = a + 1;
        const d = a + cols + 1;
        const c = d + 1;
        f.push({ idx: [a, d, c] }, { idx: [a, c, b] });
      }
    objs.push({ mesh: { v, f }, mat: { color, spec: 0.06, bias: 0.25 } });
  };
  const vEdge = (y: number) => Math.max(0, 0.6 * (1 + y / 2.6));
  if (outfit === "suit" || outfit === "coat") {
    onFront(0.02, -2.6, (y) => -vEdge(y), (y) => vEdge(y), shirt);
    if (outfit === "suit") onFront(-0.12, -2.3, (y) => -0.13 - (y < -0.4 ? 0.06 : 0), (y) => 0.13 + (y < -0.4 ? 0.06 : 0), accent, 5, 0.09);
    const lapel = shadeHex(cloth, 0.14);
    onFront(-0.05, -3.4, (y) => vEdge(y), (y) => vEdge(y) + 0.6 + 0.12 * Math.sin(Math.min(1, -y / 2.4) * Math.PI), lapel);
    onFront(-0.05, -3.4, (y) => -vEdge(y) - 0.6 - 0.12 * Math.sin(Math.min(1, -y / 2.4) * Math.PI), (y) => -vEdge(y), lapel);
  } else if (outfit === "apron") {
    onFront(-1.2, -7, () => -1.5, () => 1.5, "#7a4a2a", 6);
    for (const sx of [-1, 1]) onFront(0.0, -1.2, (y) => sx * (0.8 + y * 0.12) - 0.12, (y) => sx * (0.8 + y * 0.12) + 0.12, "#5e381f", 3);
  } else if (outfit === "dress" || outfit === "gown") {
    onFront(0.1, -1.1, (y) => -1.15 * Math.min(1, 0.5 - y), (y) => 1.15 * Math.min(1, 0.5 - y), skin, 4);
  } else if (outfit === "miner") {
    for (const sx of [-1, 1]) onFront(0.0, -7, () => sx * 1.0 - 0.18, () => sx * 1.0 + 0.18, "#3b2a1e", 6);
  }
  if (outfit === "uniform") {
    for (let i = 0; i < 4; i++) objs.push({ mesh: ico(0, 0.1), mat: { ...GOLD, bias: 0.3 }, pos: [0, -0.8 - i * 0.75, front(0, -0.8 - i * 0.75) + 0.05] });
    objs.push({ mesh: box(1.0, 0.18, 0.6), mat: GOLD, pos: [-1.75, -0.32, 0], rot: [0, 0, 0.35] });
    objs.push({ mesh: box(1.0, 0.18, 0.6), mat: GOLD, pos: [1.75, -0.32, 0], rot: [0, 0, -0.35] });
  }

  // neck
  objs.push({ mesh: prism(7, 0.5, 1.0), mat: { color: shadeHex(skin, -0.08) }, pos: [0, 0.4, 0.02] });

  // the head and everything on it, turned together
  const head: Obj[] = [];
  const blink = t % 3.1 > 2.98 ? 0.1 : 1;
  const surprised = expression === "surprised";
  const open = (surprised ? 1.35 : expression === "focused" || expression === "sly" ? 0.6 : 1) * blink;
  head.push({ mesh: jitter(ico(1, 1), 0.04, seed + 2), mat: { color: skin, spec: 0.05 }, scale: [0.93, 1.1, 0.96] });
  const shell = (r: number, keep: (c: V3) => boolean, color: string, sc: V3 = [0.95, 1.12, 0.98], hairy = true): Obj => ({
    mesh: part(jitter(ico(1, r), 0.05, seed + 5), (c) => keep(c) && (!hairy || !hatOn || c[1] < 0.4)),
    mat: { color, spec: 0.12 },
    scale: sc,
  });
  const hair = look.hair ?? "short";
  const hatOn = ["cap", "bowler", "top", "helmet"].includes(look.hat ?? "none");
  if (hair === "short" || hair === "side" || hair === "curly")
    head.push(shell(1.06, ([, y, z]) => y > 0.18 || (z < -0.25 && y > -0.55), hairC));
  if (hair === "slick") head.push(shell(1.05, ([, y, z]) => y > 0.32 || (z < -0.35 && y > -0.35), hairC));
  if (hair === "bald" || look.old) {
    if (hair === "bald") head.push(shell(1.05, ([, y, z]) => z < -0.1 && y > -0.45 && y < 0.15, hairC));
  }
  if (hair === "long" || hair === "updo") {
    head.push(shell(1.07, ([, y, z]) => y > 0.12 || z < -0.2, hairC));
    if (hair === "long") head.push({ mesh: jitter(box(2.1, 2.4, 0.6), 0.12, seed + 8), mat: { color: hairC, spec: 0.1 }, pos: [0, -1.1, -0.55] });
    else head.push({ mesh: jitter(ico(1, 0.45), 0.06, seed + 9), mat: { color: hairC, spec: 0.1 }, pos: [0, 1.05, -0.45] });
  }
  if (hair === "curly") head.push({ mesh: jitter(ico(1, 0.5), 0.2, seed + 10), mat: { color: hairC }, pos: [0.55, 0.85, 0.1] });
  // ears and nose
  for (const s of [-1, 1]) head.push({ mesh: ico(0, 0.2), mat: { color: shadeHex(skin, -0.06) }, pos: [s * 0.93, 0, -0.05], scale: [0.55, 1.1, 0.8] });
  head.push({ mesh: ico(0, 0.17), mat: { color: shadeHex(skin, -0.04) }, pos: [0, -0.05, 0.98], scale: [0.75, 1.25, 1] });
  // eyes and brows
  const [raise, tilt] = BROWS[expression] ?? [0, 0];
  for (const s of [-1, 1]) {
    head.push({ mesh: ico(0, 0.1), mat: { color: "#14110f", spec: 0.6, shine: 30, bias: 0.3 }, pos: [s * 0.33, 0.15, 0.93], scale: [1, Math.max(0.15, 1.3 * open), 0.6] });
    head.push({
      mesh: box(0.36, 0.07, 0.08),
      mat: { color: shadeHex(hairC, -0.25), bias: 0.3 },
      pos: [s * 0.33, 0.42 + raise, 0.92],
      rot: [0, 0, s * tilt],
    });
  }
  // mouth
  const mouthC = "#5e2626";
  const decal = (color: string): Mat => ({ color, bias: 0.3 });
  if (!look.mask) {
    if (surprised || gasp > 0.3) head.push({ mesh: ico(0, 0.12), mat: decal("#3a1515"), pos: [0, -0.5, 0.88], scale: [1, 1.4, 0.5] });
    else if (expression === "smile" || expression === "proud")
      head.push({ mesh: slab([[-0.24, -0.42], [-0.11, -0.5], [0.11, -0.5], [0.24, -0.42], [0, -0.45]], 0.05), mat: decal(mouthC), pos: [0, 0, 0.9] });
    else
      head.push({ mesh: box(expression === "focused" ? 0.22 : 0.32, 0.06, 0.06), mat: decal(mouthC), pos: [0, -0.48, 0.9], rot: [0, 0, expression === "sly" ? 0.18 : expression === "worried" ? -0.1 : 0] });
  }
  // facial hair
  const facial = look.facial ?? "none";
  if (facial === "beard" || facial === "fullbeard")
    head.push(shell(1.05, ([, y, z]) => (facial === "fullbeard" ? y < 0.0 : y < -0.25) && z > -0.35, hairC, [0.97, 1.14, 1.0], false));
  if (facial === "mustache" || facial === "beard" || facial === "fullbeard" || facial === "walrus" || facial === "handlebar") {
    const w = facial === "handlebar" ? 0.5 : facial === "walrus" ? 0.38 : 0.3;
    const drop = facial === "walrus" ? 0.14 : 0.06;
    const tip = facial === "handlebar" ? 0.12 : -drop;
    head.push({
      mesh: slab([[-w, -0.3 + tip], [-0.08, -0.36 - drop], [0.08, -0.36 - drop], [w, -0.3 + tip], [0.1, -0.22], [-0.1, -0.22]] as [number, number][], 0.1),
      mat: { color: shadeHex(hairC, -0.1), bias: 0.35 },
      pos: [0, 0, 0.99],
    });
    if (facial !== "beard" && facial !== "fullbeard" && !look.mask) {
      // keep the mouth visible below
    }
  }
  if (look.mask) head.push(shell(1.06, ([, y, z]) => y < 0.02 && y > -0.85 && z > 0.05, "#15171d", [0.97, 1.12, 1.02], false));
  // glasses
  const glasses = look.glasses ?? "none";
  if (glasses === "round" || glasses === "monocle" || glasses === "loupe") {
    const sides = glasses === "round" ? [-1, 1] : [1];
    for (const s of sides) {
      if (glasses === "loupe") head.push({ mesh: prism(8, 0.2, 0.45, 0.24), mat: { color: "#1a1a1a", spec: 0.4 }, pos: [s * 0.33, 0.15, 1.12], rot: [Math.PI / 2, 0, 0] });
      else head.push({ mesh: prism(8, 0.22, 0.04), mat: { color: "#cfe3ee", spec: 0.9, shine: 30, opacity: 0.45 }, pos: [s * 0.33, 0.15, 1.02], rot: [Math.PI / 2, 0, 0] });
    }
  }
  // hats
  const hat = look.hat ?? "none";
  const dark: Mat = { color: "#1d1c22", spec: 0.25, shine: 10 };
  if (hat === "bowler") {
    head.push({ mesh: lathe([[0.98, 0], [0.95, 0.3], [0.7, 0.62], [0, 0.72]], 12), mat: dark, pos: [0, 0.55, 0] });
    head.push({ mesh: prism(12, 1.35, 0.08), mat: dark, pos: [0, 0.56, 0], scale: [1, 1, 0.95] });
  } else if (hat === "top") {
    head.push({ mesh: prism(12, 0.86, 1.4, 0.9), mat: dark, pos: [0, 1.25, 0] });
    head.push({ mesh: prism(12, 1.3, 0.08), mat: dark, pos: [0, 0.57, 0] });
  } else if (hat === "cap") {
    head.push({ mesh: lathe([[1.02, 0], [1.04, 0.28], [0.86, 0.62], [0, 0.8]], 10), mat: { color: shadeHex(cloth, -0.1), spec: 0.1 }, pos: [0, 0.4, -0.04], scale: [1, 1, 1.04] });
    head.push({ mesh: slab([[-0.6, 0], [0.6, 0], [0.46, 0.6], [-0.46, 0.6]], 0.06), mat: { color: shadeHex(cloth, -0.25), spec: 0.1 }, pos: [0, 0.5, 0.8], rot: [Math.PI / 2 + 0.12, 0, 0] });
  } else if (hat === "crown" || hat === "tiara") {
    const big = hat === "crown";
    head.push({ mesh: prism(12, big ? 0.95 : 0.9, big ? 0.35 : 0.12), mat: GOLD, pos: [0, big ? 0.75 : 0.62, 0] });
    const n = big ? 8 : 5;
    for (let i = 0; i < n; i++) {
      const a = big ? (i / n) * Math.PI * 2 : Math.PI / 2 + ((i - (n - 1) / 2) / n) * 1.6;
      head.push({ mesh: lathe([[0.14, 0], [0, 0.4]], 4), mat: GOLD, pos: [Math.cos(a) * 0.92, big ? 0.9 : 0.66, Math.sin(a) * 0.92] });
      head.push({ mesh: ico(0, 0.07), mat: i % 2 ? stoneMat("red") : DIAMOND, pos: [Math.cos(a) * 0.98, big ? 0.72 : 0.68, Math.sin(a) * 0.98] });
    }
  } else if (hat === "helmet") {
    head.push({ mesh: lathe([[1.05, 0], [1.0, 0.35], [0.7, 0.62], [0, 0.72]], 10), mat: { color: "#c9a23e", spec: 0.3 }, pos: [0, 0.45, 0] });
    head.push({ mesh: prism(8, 0.18, 0.15), mat: { color: "#fff2b8", glow: 0.9 }, pos: [0, 0.75, 0.9], rot: [Math.PI / 2, 0, 0] });
  }
  // earrings
  const jewel = look.jewel ?? "none";
  if (jewel === "earrings") for (const s of [-1, 1]) head.push(...Stone("pear", look.jewelTone, { pos: [s * 0.95, -0.42, 0.05], scale: 0.12 }));

  const turn = lookDir * 0.35 + Math.sin(t * 0.9) * 0.06;
  const nod = Math.sin(t * 1.1) * 0.03 - gasp * 0.12;
  objs.push(...group(head, { pos: [0, 1.62, 0.05], rot: [nod, turn, Math.sin(t * 0.7) * 0.03] }));

  // neck jewels
  if (jewel === "pearls")
    for (let i = 0; i < 13; i++) {
      const a = Math.PI * (0.15 + (0.7 * i) / 12);
      objs.push(...PearlLp({ pos: [Math.cos(a) * 0.95, -0.15 - Math.sin(a) * 0.35, Math.sin(a) * 0.62], scale: 0.12 }));
    }
  if (jewel === "pendant") objs.push(...Stone("pear", look.jewelTone, { pos: [0, -0.9, 0.95], scale: 0.2 }));

  // a hand raised in front of the chest holding the prop
  const prop = look.prop ?? "none";
  if (prop !== "none") {
    const hx = 1.25;
    const hy = -1.5 + Math.sin(t * 1.6) * 0.06;
    objs.push({ mesh: tube([[hx + 0.75, hy - 3.2, 0.7], [hx + 0.5, hy - 1.6, 1.15], [hx + 0.12, hy - 0.35, 1.5]], [0.44, 0.4, 0.33], 7), mat: { color: shadeHex(cloth, -0.05), spec: 0.06 } });
    objs.push({ mesh: jitter(ico(0, 0.36), 0.05, 3), mat: { color: skin }, pos: [hx, hy, 1.55], scale: [1, 1.1, 0.8] });
    const at: Tr = { pos: [hx - 0.1, hy + 0.55, 1.65] };
    if (prop === "gem") objs.push(...Stone("round", look.propTone, { ...at, scale: 0.36 }));
    if (prop === "rough") objs.push(...Rough({ ...at, scale: 0.42 }));
    if (prop === "letter") objs.push({ mesh: box(1.0, 0.7, 0.03), mat: { color: "#efe6cf" }, pos: at.pos, rot: [0, 0, 0.15] });
    if (prop === "blade") objs.push({ mesh: box(0.12, 1.1, 0.04), mat: SILVER, pos: at.pos, rot: [0, 0, -0.3] });
    if (prop === "lantern") objs.push({ mesh: box(0.45, 0.6, 0.45), mat: { color: "#ffd98a", glow: 0.9 }, pos: at.pos });
    if (prop === "magnifier") {
      objs.push({ mesh: prism(10, 0.36, 0.06), mat: { color: "#cfe3ee", spec: 0.9, opacity: 0.5 }, pos: at.pos, rot: [Math.PI / 2, 0, 0] });
      objs.push({ mesh: prism(5, 0.06, 0.7), mat: { color: "#4a2e1c" }, pos: [at.pos![0], at.pos![1] - 0.6, at.pos![2]] });
    }
  }
  return objs;
};

// Lighter (k > 0) or darker (k < 0).
export const shadeHex = (c: string, k: number) => {
  const h = c.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
