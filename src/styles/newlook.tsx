import React, { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { W, popped } from "../look";
import { Timed, chunk } from "../Frame";
import { SceneProps, num, str } from "../scenes/types";
import { RGB, hex, ramp, rgb, mixc, DIAMOND, EMERALD, RUBY, SAPPHIRE } from "./common";
import { Look, LOOKS, Medal } from "./looks";
import { Cut, Face, MetalName, METALS, Piece, PieceSpec, Xf, camVec, dot, gemNodes, metalTone, pathOf, proj, ringBottom, rotN } from "./gem3d";

// The three full-colour looks in real stories (ali, 20 Nov 2026: "try all and see which one is the best"): Jewel Box, Deco Poster
// and Gouache. A story names its look in `style`; its hero piece in `piece` (a different cut, stone, metal and kind of piece
// every story); lines use scene kinds hook, piece, title and real. Every piece is built in gem3d.tsx.

export type LookId = "jewelbox" | "deco" | "gouache";
export const NEW_LOOKS: string[] = ["jewelbox", "deco", "gouache"];
export const isNewLook = (s: string | undefined): s is LookId => !!s && NEW_LOOKS.includes(s);

export type PieceDef = {
  piece?: string; // ring, eternity, band, bracelet, necklace, strand, pearl, earrings, brooch, egg, rough, stone
  stone?: string; // sapphire, ruby, emerald, diamond, amethyst, topaz, aquamarine, morganite, citrine, peridot, tanzanite, pink, yellow, blue
  cut?: string; // round, oval, pear, marquise, heart, cushion, emerald
  metal?: string; // platinum, yellow, rose
  halo?: number; // small stones round the centre stone
  halo_stone?: string;
  prongs?: number;
  shoulder?: number; // small stones on each shoulder
  petals?: number; // brooch: stones of the flower
  stones?: number; // eternity ring and bracelet: stones all round
  tone?: string; // pearl: white, cream, pink, black, gold; egg: an enamel color name
  label?: string;
  sub?: string;
  yaw?: number;
  elev?: number;
};

type Ctx = { look: LookId; idx: number; number: number; hero: PieceDef };
export const NewLookCtx = createContext<Ctx>({ look: "jewelbox", idx: 0, number: 0, hero: {} });

// ---------------------------------------------------------------------------------------------------------------------
// Stones and shapes
// ---------------------------------------------------------------------------------------------------------------------
const mk = (a: string[]): RGB[] => a.map(hex);
export const STONES: Record<string, RGB[]> = {
  sapphire: SAPPHIRE,
  ruby: RUBY,
  emerald: EMERALD,
  diamond: DIAMOND,
  amethyst: mk(["#1d0a3a", "#4b1f8c", "#8a4fd0", "#c39bf0", "#efdcff", "#ffffff"]),
  topaz: mk(["#4a1c00", "#b8560a", "#f08a1c", "#ffc15a", "#ffe9b0", "#ffffff"]),
  aquamarine: mk(["#04303a", "#0e7a8c", "#35c0cf", "#8fe6ee", "#dcfbff", "#ffffff"]),
  morganite: mk(["#5a2a2e", "#c0707a", "#f0a3a8", "#ffd0cf", "#fff0ec", "#ffffff"]),
  citrine: mk(["#4a3300", "#c08a00", "#f2c020", "#ffe070", "#fff3b8", "#ffffff"]),
  peridot: mk(["#143000", "#4a8a0a", "#8ccc1c", "#c8f06a", "#f0ffc0", "#ffffff"]),
  tanzanite: mk(["#0e0a3a", "#3a2a9a", "#6a52d8", "#a496f2", "#e0d8ff", "#ffffff"]),
  pink: mk(["#4a0c2e", "#b02a74", "#f06aa8", "#ffaed0", "#ffe0ee", "#ffffff"]),
  yellow: mk(["#5a4200", "#c8960a", "#f6c82a", "#ffe270", "#fff4be", "#ffffff"]),
  blue: mk(["#021a3a", "#0a4a9a", "#2c86e0", "#7cc0ff", "#d4ecff", "#ffffff"]),
};
export const stone = (n: string | undefined, d = "sapphire") => STONES[(n ?? d).toLowerCase()] ?? STONES[d];

const CUTS: Record<string, Cut> = { round: "round", oval: "oval", pear: "pear", marquise: "marquise", heart: "heart", cushion: "cushion", emerald: "emerald", step: "emerald", baguette: "emerald", asscher: "emerald", radiant: "cushion", princess: "cushion", square: "cushion" };
export const cutOf = (n: string | undefined, d: Cut = "oval"): Cut => CUTS[(n ?? "").toLowerCase()] ?? d;
const metalOf = (n: string | undefined, d: MetalName = "yellow"): MetalName => (n === "platinum" || n === "yellow" || n === "rose" ? n : d);

// ---------------------------------------------------------------------------------------------------------------------
// The pieces that are not rings: pendants, strands, earrings, eggs, rough crystals
// ---------------------------------------------------------------------------------------------------------------------
type Hero = { node: React.ReactNode; floorY: number | null; medal: Medal };
type Opts = { L: Look; t: number; pop: number; idx: number; top: number; bottom: number; uid: string; seed: number };

const flat = (L: Look) => !!L.render.gem.levels;
const mcOf = (L: Look, m: MetalName) => (s: number) => rgb(ramp(L.render.metals?.[m] ?? METALS[m], s));

// A loose stone, face on or at an angle.
const LooseStone: React.FC<{ def: PieceDef; L: Look; t: number; cx: number; cy: number; k: number; yaw: number; elev: number; uid: string; seed: number; cut?: Cut; stops?: RGB[]; halo?: number }> = ({ def, L, t, cx, cy, k, yaw, elev, uid, seed, cut, stops, halo }) => {
  const spec: PieceSpec = { cut: cut ?? cutOf(def.cut), stops: stops ?? stone(def.stone), metal: metalOf(def.metal), band: false, halo: halo ? { n: halo, stops: stone(def.halo_stone, "diamond") } : undefined };
  return <Piece spec={spec} yaw={yaw} elev={elev} ox={cx} oy={cy} k={k} t={t} style={L.render} uid={uid} seed={seed} />;
};

// A chain of links along a curve.
function chainNodes(L: Look, m: MetalName, pts: [number, number][], size: number, key: string): React.ReactNode {
  const mc = mcOf(L, m);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + (i % 2 ? 90 : 0);
    const squash = i % 2 ? 0.55 : 1;
    out.push(
      <g key={i} transform={`translate(${pts[i][0]} ${pts[i][1]}) rotate(${ang})`}>
        {L.render.outline && <ellipse rx={size * 1.5 * squash} ry={size * 0.9} fill="none" stroke={L.render.outline} strokeWidth={size * 0.5 + 4} />}
        <ellipse rx={size * 1.5 * squash} ry={size * 0.9} fill="none" stroke={mc(0.5)} strokeWidth={size * 0.5} />
        <ellipse rx={size * 1.5 * squash} ry={size * 0.9} fill="none" stroke={mc(0.92)} strokeWidth={size * 0.14} transform="translate(-1 -2)" opacity={0.8} />
      </g>,
    );
  }
  return <g key={key}>{out}</g>;
}
const catenary = (x0: number, x1: number, y: number, sag: number, n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const x = x0 + (x1 - x0) * u;
    return [x, y + sag * (1 - Math.pow(2 * u - 1, 2))] as [number, number];
  });

const Pearl: React.FC<{ x: number; y: number; r: number; tone: string; L: Look; id: string; shadow?: boolean }> = ({ x, y, r, tone, L, id, shadow = true }) => {
  const base: Record<string, RGB[]> = {
    white: mk(["#9a8f9a", "#d8d0d6", "#f6f1f2", "#ffffff"]),
    cream: mk(["#a8946a", "#e0cfa4", "#f8edd0", "#fffaea"]),
    pink: mk(["#a8788a", "#e6bccb", "#fbe3ea", "#fff5f8"]),
    black: mk(["#06080e", "#2a3040", "#586078", "#aab4cc"]),
    gold: mk(["#8a5a10", "#d8a030", "#f6d070", "#fff0b0"]),
  };
  const st = base[tone] ?? base.white;
  const f = flat(L);
  return (
    <g>
      {shadow && <ellipse cx={x + r * 0.15} cy={y + r * 1.05} rx={r * 0.8} ry={r * 0.18} fill="#000" opacity={0.28} />}
      <defs>
        <radialGradient id={id} cx="0.34" cy="0.3" r="0.8">
          <stop offset="0" stopColor={rgb(st[3])} />
          <stop offset="0.35" stopColor={rgb(st[2])} />
          <stop offset="0.8" stopColor={rgb(st[1])} />
          <stop offset="1" stopColor={rgb(st[0])} />
        </radialGradient>
      </defs>
      {L.render.outline && <circle cx={x} cy={y} r={r + L.render.outlineW! * 0.45} fill={L.render.outline} />}
      <circle cx={x} cy={y} r={r} fill={f ? rgb(st[2]) : `url(#${id})`} />
      {f && <path d={`M${x - r * 0.1} ${y - r} A${r} ${r} 0 0 1 ${x + r} ${y + r * 0.1} A${r} ${r} 0 0 0 ${x - r * 0.1} ${y - r}Z`} fill={rgb(st[1])} opacity={0.5} />}
      <ellipse cx={x - r * 0.32} cy={y - r * 0.36} rx={r * 0.3} ry={r * 0.18} fill="#fff" opacity={0.85} transform={`rotate(-35 ${x - r * 0.32} ${y - r * 0.36})`} />
      {!f && <ellipse cx={x + r * 0.35} cy={y + r * 0.42} rx={r * 0.22} ry={r * 0.1} fill="#fff" opacity={0.18} transform={`rotate(-35 ${x + r * 0.35} ${y + r * 0.42})`} />}
    </g>
  );
};

// A Fabergé-style egg: enamel, gold bands, pearls, a stone on top.
const Egg: React.FC<{ def: PieceDef; L: Look; t: number; cx: number; cy: number; k: number; uid: string; seed: number }> = ({ def, L, t, cx, cy, k, uid, seed }) => {
  const mc = mcOf(L, metalOf(def.metal, "yellow"));
  const st = stone(def.tone && STONES[def.tone] ? def.tone : def.stone ?? "ruby");
  const rx = 0.7 * k;
  const ry = 1.0 * k;
  const f = flat(L);
  const id = `egg_${uid}`;
  const turn = Math.sin(t * 0.9) * 0.12;
  const bands = [-0.62, 0, 0.62].map((a) => a + turn);
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="0.34" cy="0.3" r="0.85">
          <stop offset="0" stopColor={rgb(st[4])} />
          <stop offset="0.3" stopColor={rgb(st[3])} />
          <stop offset="0.65" stopColor={rgb(st[2])} />
          <stop offset="1" stopColor={rgb(st[0])} />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
      </defs>
      {[-1, 1].map((s) => (
        <path key={s} d={`M${cx + s * rx * 0.3} ${cy + ry * 0.92} L${cx + s * rx * 0.62} ${cy + ry * 1.2} L${cx + s * rx * 0.46} ${cy + ry * 1.2} L${cx + s * rx * 0.14} ${cy + ry * 0.96}Z`} fill={mc(0.4)} stroke={L.render.outline ?? "none"} strokeWidth={4} />
      ))}
      <ellipse cx={cx} cy={cy + ry * 1.2} rx={rx * 0.62} ry={k * 0.05} fill={mc(0.5)} stroke={L.render.outline ?? "none"} strokeWidth={4} />
      {L.render.outline && <ellipse cx={cx} cy={cy} rx={rx + 6} ry={ry + 6} fill={L.render.outline} />}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={f ? rgb(st[2]) : `url(#${id})`} />
      <g clipPath={`url(#${id}c)`}>
        {f && <ellipse cx={cx + rx * 0.35} cy={cy + ry * 0.1} rx={rx * 0.9} ry={ry} fill={rgb(st[1])} opacity={0.6} />}
        {bands.map((a, i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx * Math.abs(Math.sin(a + 0.0001)) + 1} ry={ry} fill="none" stroke={mc(0.55)} strokeWidth={k * 0.045} />
        ))}
        {[-0.42, 0.42].map((y, i) => (
          <ellipse key={i} cx={cx} cy={cy + ry * y} rx={rx * Math.sqrt(1 - y * y)} ry={k * 0.07} fill="none" stroke={mc(0.7)} strokeWidth={k * 0.035} />
        ))}
        {Array.from({ length: 11 }, (_, i) => {
          const u = -0.9 + (i / 10) * 1.8;
          return <circle key={i} cx={cx + rx * Math.sqrt(1 - 0.18) * u * 0.9} cy={cy + ry * 0.0 + k * 0.05 * Math.sin(u * 3)} r={k * 0.035} fill="#fff7ea" stroke={mc(0.3)} strokeWidth={1} opacity={0.95} />;
        })}
        <ellipse cx={cx - rx * 0.36} cy={cy - ry * 0.4} rx={rx * 0.18} ry={ry * 0.3} fill="#fff" opacity={0.3} transform={`rotate(24 ${cx - rx * 0.36} ${cy - ry * 0.4})`} />
      </g>
      <LooseStone def={{ ...def, stone: "diamond" }} L={L} t={t} cx={cx} cy={cy - ry * 1.02} k={k * 0.14} yaw={t * 0.8} elev={1.1} uid={`${uid}e`} seed={seed} cut="round" stops={DIAMOND} />
    </g>
  );
};

// A rough crystal: an octahedron (diamond) or a six-sided prism with a point (sapphire, emerald, ruby), tilted.
function roughFaces(kind: "octa" | "prism", seed: number): Face[] {
  const J = (i: number) => 1 + (((Math.sin(i * 12.9898 + seed * 4.1) * 43758.5453) % 1) - 0.5) * 0.18;
  const faces: Face[] = [];
  const add = (v: [number, number, number][], inside: [number, number, number]) => {
    const m = v.reduce((s, p) => [s[0] + p[0] / v.length, s[1] + p[1] / v.length, s[2] + p[2] / v.length], [0, 0, 0]);
    const a = [v[1][0] - v[0][0], v[1][1] - v[0][1], v[1][2] - v[0][2]];
    const b = [v[2][0] - v[0][0], v[2][1] - v[0][1], v[2][2] - v[0][2]];
    let n: [number, number, number] = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const l = Math.hypot(...n) || 1;
    n = [n[0] / l, n[1] / l, n[2] / l];
    if (n[0] * (m[0] - inside[0]) + n[1] * (m[1] - inside[1]) + n[2] * (m[2] - inside[2]) < 0) n = [-n[0], -n[1], -n[2]];
    faces.push({ v, n, key: faces.length + seed * 7, part: 0 });
  };
  if (kind === "octa") {
    const P: [number, number, number][] = [[1.1 * J(1), 0, 0], [-1.1 * J(2), 0, 0], [0, 1.0 * J(3), 0], [0, -1.0 * J(4), 0], [0, 0, 1.3 * J(5)], [0, 0, -1.3 * J(6)]];
    for (const [x, y] of [[0, 2], [2, 1], [1, 3], [3, 0]]) {
      add([P[x], P[y], P[4]], [0, 0, 0]);
      add([P[y], P[x], P[5]], [0, 0, 0]);
    }
  } else {
    const ring = (z: number, r: number, off: number) => Array.from({ length: 6 }, (_, i) => [r * J(i + off) * Math.cos((i / 6) * Math.PI * 2), r * J(i + off) * Math.sin((i / 6) * Math.PI * 2), z * J(i + 2 * off)] as [number, number, number]);
    const bot = ring(-1.2, 0.7, 1);
    const mid = ring(0.9, 0.78, 3);
    const apex: [number, number, number] = [0.12, 0.05, 1.7];
    const base: [number, number, number] = [-0.08, 0, -1.7];
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      add([bot[i], bot[j], mid[j], mid[i]], [0, 0, 0]);
      add([mid[i], mid[j], apex], [0, 0, 0]);
      add([bot[j], bot[i], base], [0, 0, 0]);
    }
  }
  return faces;
}
const Rough: React.FC<{ def: PieceDef; L: Look; t: number; cx: number; cy: number; k: number; uid: string; seed: number }> = ({ def, L, t, cx, cy, k, uid, seed }) => {
  const diamond = !def.stone || def.stone === "diamond";
  const faces = React.useMemo(() => roughFaces(diamond ? "octa" : "prism", seed), [diamond, seed]);
  const tilt = 0.45;
  const spin = t * 0.9;
  const xf: Xf = { yaw: spin, elev: 0.55, k, ox: cx, oy: cy };
  // tip the crystal about the x axis
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const tilted: Face[] = faces.map((f) => ({ ...f, v: f.v.map((p) => [p[0], p[1] * ct - p[2] * st, p[1] * st + p[2] * ct] as [number, number, number]), n: [f.n[0], f.n[1] * ct - f.n[2] * st, f.n[1] * st + f.n[2] * ct] as [number, number, number] }));
  const stops = diamond ? mk(["#2c3340", "#6a7890", "#b4c4dc", "#e6f0ff", "#ffffff"]) : stone(def.stone);
  return <g>{gemNodes(tilted, xf, stops, { ...L.render.gem, fire: false, sparkles: false, contrast: (L.render.gem.contrast ?? 1) * 1.5 }, `${uid}r`, seed, t)}</g>;
};

// ---------------------------------------------------------------------------------------------------------------------
// Laying a piece out in the space between the title and the captions
// ---------------------------------------------------------------------------------------------------------------------
function heroFor(def: PieceDef, o: Opts): Hero {
  const { L, t, pop, idx, top, bottom, uid, seed } = o;
  const kind = (def.piece ?? "ring").toLowerCase();
  const metal = metalOf(def.metal);
  const avail = bottom - top;
  const cx = 540;
  const cy = (top + bottom) / 2;
  const turn = Math.sin(t * 0.9 + idx) * 0.1;
  const medalOf = (ry: number, c = cy): Medal => ({ cy: c, rx: 460, ry: Math.min(ry, 520) });
  const style = L.render;
  const halo = def.halo ?? 0;

  if (kind === "ring" || kind === "eternity" || kind === "band" || kind === "bracelet") {
    const cut = cutOf(def.cut);
    let spec: PieceSpec;
    let units = 6.2;
    if (kind === "eternity") {
      spec = { cut, stops: stone(def.stone), metal, noGem: true, rr: 1.9, bandTh: 0.34, bandW: 0.78, eternity: { n: def.stones ?? 18, stops: stone(def.stone, "diamond"), size: 0.31 } };
      units = 4.5;
    } else if (kind === "band") {
      spec = { cut, stops: stone(def.stone), metal, noGem: true, rr: 1.9, bandTh: 0.4, bandW: 0.95 };
      units = 4.5;
    } else if (kind === "bracelet") {
      spec = { cut, stops: stone(def.stone), metal, noGem: true, rr: 3.6, bandTh: 0.26, bandW: 0.62, eternity: { n: def.stones ?? 34, stops: stone(def.stone, "diamond"), size: 0.27 } };
      units = 7.6;
    } else {
      spec = {
        cut,
        stops: stone(def.stone),
        metal,
        prongs: def.prongs ?? 4,
        halo: halo ? { n: halo, stops: stone(def.halo_stone, "diamond") } : undefined,
        shoulder: def.shoulder ? { n: def.shoulder, stops: stone(def.halo_stone, "diamond") } : undefined,
        rr: 1.9,
        rise: halo ? 0.34 : 0.3,
      };
    }
    const yaw = (def.yaw ?? 0.6) + turn;
    const elev = def.elev ?? (kind === "bracelet" ? 0.9 : 0.5);
    const k = (avail / units) * pop;
    const bottomOff = ringBottom(spec, yaw, elev, 0, k);
    const oy = bottom - bottomOff;
    return {
      floorY: bottom + 2,
      medal: medalOf(avail / 2 + 40),
      node: <Piece spec={spec} yaw={yaw} elev={elev} ox={cx} oy={oy} k={k} t={t} style={style} uid={uid} seed={seed} />,
    };
  }
  if (kind === "brooch") {
    const cut = cutOf(def.cut, "round");
    const spec: PieceSpec = { cut, stops: stone(def.stone), metal, band: false, petals: { n: def.petals ?? 8, cut: "oval", stops: stone(def.halo_stone, "diamond"), r: 1.55, s: 0.62 }, halo: undefined };
    const k = 150 * pop * (avail / 700);
    return { floorY: null, medal: medalOf(avail / 2 + 40), node: <Piece spec={spec} yaw={0.5 + turn * 2} elev={def.elev ?? 1.0} ox={cx} oy={cy} k={k} t={t} style={style} uid={uid} seed={seed} /> };
  }
  if (kind === "necklace") {
    const mc = mcOf(L, metal);
    const y0 = top + 20;
    const pts = catenary(100, 980, y0, avail * 0.55, 46);
    const pend = pts[Math.floor(pts.length / 2)];
    const k = 105 * pop * (avail / 700);
    return {
      floorY: null,
      medal: medalOf(avail / 2 + 40),
      node: (
        <g>
          {chainNodes(L, metal, pts, 11, "chain")}
          <path d={`M${pend[0]} ${pend[1]} v${k * 0.5}`} stroke={mc(0.5)} strokeWidth={7} />
          <LooseStone def={def} L={L} t={t} cx={pend[0]} cy={pend[1] + k * 1.5} k={k} yaw={turn * 3} elev={1.3} uid={uid} seed={seed} halo={halo || undefined} cut={cutOf(def.cut, "pear")} />
        </g>
      ),
    };
  }
  if (kind === "strand" || kind === "pearl") {
    const tone = def.tone ?? "white";
    if (kind === "pearl") {
      const r = Math.min(avail / 2.4, 260) * pop;
      return {
        floorY: null,
        medal: medalOf(avail / 2 + 40),
        node: (
          <g>
            <Pearl x={cx} y={cy} r={r} tone={tone} L={L} id={`${uid}p`} />
            <LooseStone def={{ ...def, stone: "diamond" }} L={L} t={t} cx={cx + r * 0.9} cy={cy - r * 0.95} k={r * 0.13} yaw={t} elev={1.1} uid={`${uid}d`} seed={seed} cut="round" stops={DIAMOND} />
          </g>
        ),
      };
    }
    const n = 27;
    const y0 = top + 30;
    const sag = avail * 0.6;
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const x = 90 + 900 * u;
      const y = y0 + sag * (1 - Math.pow(2 * u - 1, 2));
      const r = (24 + 30 * (1 - Math.abs(2 * u - 1))) * pop;
      nodes.push(<Pearl key={i} x={x} y={y} r={r} tone={tone} L={L} id={`${uid}s${i % 3}`} shadow={false} />);
    }
    return { floorY: null, medal: medalOf(avail / 2 + 40), node: <g>{nodes}</g> };
  }
  if (kind === "earrings") {
    const k = 95 * pop * (avail / 700);
    const drop = (x: number, s: number, i: number) => (
      <g key={i}>
        <LooseStone def={{ ...def, stone: "diamond" }} L={L} t={t} cx={x} cy={top + 90} k={k * 0.34} yaw={t * 0.7 + i} elev={1.25} uid={`${uid}a${i}`} seed={seed + i} cut="round" stops={DIAMOND} />
        <path d={`M${x} ${top + 125} v${k * 0.9}`} stroke={mcOf(L, metal)(0.5)} strokeWidth={6} />
        <LooseStone def={def} L={L} t={t} cx={x} cy={top + 125 + k * 0.9 + k * 1.5} k={k} yaw={s * (0.25 + turn)} elev={1.3} uid={`${uid}b${i}`} seed={seed + i} cut={cutOf(def.cut, "pear")} halo={halo || undefined} />
      </g>
    );
    return { floorY: null, medal: medalOf(avail / 2 + 40), node: <g>{drop(330, 1, 0)}{drop(750, -1, 1)}</g> };
  }
  if (kind === "egg") {
    const k = Math.min(avail / 2.5, 270) * pop;
    return { floorY: cy + k * 1.25, medal: medalOf(avail / 2 + 40), node: <Egg def={def} L={L} t={t} cx={cx} cy={cy - k * 0.05} k={k} uid={uid} seed={seed} /> };
  }
  if (kind === "rough") {
    const k = Math.min(avail / 3.2, 220) * pop;
    return { floorY: null, medal: medalOf(avail / 2 + 40), node: <Rough def={def} L={L} t={t} cx={cx} cy={cy} k={k} uid={uid} seed={seed} /> };
  }
  // a loose stone, turning
  const cut = cutOf(def.cut);
  const k = Math.min(avail / 2.5, 300) * pop * (cut === "emerald" || cut === "pear" || cut === "marquise" ? 0.88 : 1);
  return {
    floorY: null,
    medal: medalOf(avail / 2 + 40),
    node: <LooseStone def={def} L={L} t={t} cx={cx} cy={cy + k * 0.22 + Math.sin(t * 1.5) * 6} k={k} yaw={(def.yaw ?? 0) + t * 0.8} elev={def.elev ?? 0.5} uid={uid} seed={seed} halo={halo || undefined} />,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------------------------------------------------
const merge = (hero: PieceDef, p: Record<string, unknown>): PieceDef => {
  // a scene that names another kind of piece starts from that piece alone (only the metal carries over)
  const d: PieceDef = typeof p.piece === "string" && p.piece !== hero.piece ? { metal: hero.metal } : { ...hero };
  for (const k of ["piece", "stone", "cut", "metal", "halo", "halo_stone", "prongs", "shoulder", "petals", "stones", "tone", "yaw", "elev"] as const) {
    if (p[k] !== undefined && p[k] !== null) (d as Record<string, unknown>)[k] = p[k];
  }
  return d;
};

const Shell: React.FC<{ L: Look; t: number; idx: number; hero: Hero; children?: React.ReactNode }> = ({ L, t, idx, hero, children }) => {
  const reflect = L.reflect && hero.floorY !== null;
  const flip = hero.floorY !== null ? hero.floorY : 0;
  const heroG = <g filter={L.heroFilter}>{hero.node}</g>;
  return (
    <AbsoluteFill style={{ background: L.base }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <L.Defs />
        <L.Bg t={t} beat={idx} medal={hero.medal} floorY={hero.floorY} />
        {reflect && (
          <g opacity={0.3}>
            <mask id="reflMask" maskUnits="userSpaceOnUse" x={0} y={flip} width={1080} height={520}>
              <rect x={0} y={flip} width={1080} height={520} fill="url(#jbFade)" />
            </mask>
            <g mask="url(#reflMask)">
              <g transform={`translate(0 ${2 * flip}) scale(1 -1)`}>{heroG}</g>
            </g>
          </g>
        )}
        {heroG}
      </svg>
      {children}
    </AbsoluteFill>
  );
};

// A hero piece, with an optional headline over it. The first scene of a story (hook) keeps the piece below the hook words.
export const PieceScene: React.FC<SceneProps> = ({ t, p, hook }) => {
  const { look, idx, number, hero: base } = useContext(NewLookCtx);
  const L = LOOKS[look];
  const def = merge(base, p);
  const pop = hook ? 1 : 0.9 + 0.1 * Math.min(1, t / 0.5);
  const top = hook ? 560 : p.label ? 500 : 420;
  const h = heroFor(def, { L, t, pop, idx, top, bottom: 1170, uid: `s${idx}`, seed: 1 + ((number + idx * 3) % 9) });
  const label = str(p.label, "");
  return (
    <Shell L={L} t={t} idx={idx} hero={h}>
      {!hook && label && <L.Title big={label} sub={str(p.sub, "")} t={t} />}
    </Shell>
  );
};

// A text card: a big word or number and a small line, over the story's piece (turned a different way on each card).
export const TitleScene: React.FC<SceneProps> = ({ t, p, hook }) => {
  const { look, idx, number, hero: base } = useContext(NewLookCtx);
  const L = LOOKS[look];
  const def = merge(base, p);
  const views = [[0.6, 0.5], [-0.7, 0.4], [1.0, 0.62], [0.2, 0.55], [-0.4, 0.7]];
  const v = views[(idx + number) % views.length];
  const d2: PieceDef = { ...def, yaw: def.yaw ?? v[0], elev: def.elev ?? v[1] };
  const pop = 0.9 + 0.1 * Math.min(1, t / 0.5);
  // a long word shrinks to fit the frame (the type sizes are made for about nine letters)
  const big = str(p.text, "");
  const perChar = look === "gouache" ? 92 : look === "deco" ? 104 : 110;
  const fit = Math.min(1, 980 / Math.max(1, big.length * perChar));
  const h = heroFor(d2, { L, t, pop: pop * 0.9, idx, top: 520, bottom: 1170, uid: `t${idx}`, seed: 2 + ((number + idx * 5) % 9) });
  return (
    <Shell L={L} t={t} idx={idx} hero={h}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${fit})`, transformOrigin: "50% 160px" }}>
        <L.Title big={big} sub={str(p.sub, "")} t={t} />
      </div>
    </Shell>
  );
};

export function newLookScene(kind: string): React.FC<SceneProps> | undefined {
  if (kind === "piece" || kind === "hook") return PieceScene;
  if (kind === "title") return TitleScene;
  return undefined;
}

// ---------------------------------------------------------------------------------------------------------------------
// What sits over the scenes: captions that follow the voice, the hook words, the story number, the end card
// ---------------------------------------------------------------------------------------------------------------------
const GOLDS: Record<LookId, string> = { jewelbox: "#ffd978", deco: "#f3c34f", gouache: "#ffb347" };

export const NewOverlay: React.FC<{ look: LookId; frame: number }> = ({ look, frame }) => {
  const L = LOOKS[look];
  return <L.Over t={frame / 30} />;
};

export const NewCaptions: React.FC<{ look: LookId; words: Timed[]; t: number; end: number }> = ({ look, words, t, end }) => {
  const groups = chunk(words);
  const gi = groups.findIndex((g, i) => t < (groups[i + 1]?.[0].a ?? end));
  if (gi < 0) return null;
  const g = groups[gi];
  const pop = popped(t, g[0].a - 0.05, g[0].a + 0.12);
  const on = (i: number) => t >= g[i].a && t < (g[i + 1]?.a ?? groups[gi + 1]?.[0].a ?? end);
  const gold = GOLDS[look];
  const wrap: React.CSSProperties = { position: "absolute", left: 50, width: W - 100, top: 1210, height: 300, display: "flex", alignItems: "center", justifyContent: "center" };
  const anim: React.CSSProperties = { transform: `scale(${0.9 + 0.1 * pop})`, opacity: Math.min(1, pop * 1.5), textAlign: "center" };
  if (look === "deco") {
    return (
      <div style={wrap}>
        <div style={{ ...anim, boxSizing: "border-box", padding: "26px 40px", background: "#fff3d3", border: "8px solid #f3c34f", outline: "3px solid #0b2a73", outlineOffset: -20, fontFamily: '"Playfair Display", serif', fontWeight: 900, fontSize: 76, lineHeight: 1.1, color: "#0b2a73", textTransform: "uppercase", letterSpacing: "0.03em" }}>
          {g.map((w, i) => (
            <span key={i} style={{ display: "inline-block", margin: "0 10px", color: on(i) ? "#b8801a" : "#0b2a73" }}>{w.w}</span>
          ))}
        </div>
      </div>
    );
  }
  if (look === "gouache") {
    return (
      <div style={wrap}>
        <div style={{ ...anim, fontFamily: '"Instrument Serif", "Playfair Display", serif', fontStyle: "italic", fontSize: 110, lineHeight: 1.0, color: "#fff1d0", textShadow: "0 3px 22px rgba(20,8,24,.85), 0 0 3px rgba(20,8,24,.6)" }}>
          {g.map((w, i) => (
            <span key={i} style={{ display: "inline-block", margin: "0 14px", color: on(i) ? gold : "#fff1d0", transform: on(i) ? "scale(1.05)" : undefined }}>{w.w}</span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={wrap}>
      <div style={{ ...anim, fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: 88, lineHeight: 1.08, letterSpacing: -1, color: "#fff", textShadow: "0 4px 24px rgba(1,6,30,.9), 0 0 3px rgba(1,6,30,.8)" }}>
        {g.map((w, i) => (
          <span key={i} style={{ display: "inline-block", margin: "0 12px", color: on(i) ? gold : "#fff", transform: on(i) ? "scale(1.06)" : undefined }}>{w.w}</span>
        ))}
      </div>
    </div>
  );
};

const splitLines = (text: string, max = 15): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > max) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  // fold a lonely last word into the line above when it fits
  while (lines.length > 3) {
    const last = lines.pop() as string;
    lines[lines.length - 1] += " " + last;
  }
  return lines;
};

export const NewHook: React.FC<{ look: LookId; text: string; gold: string[]; t: number; out: number }> = ({ look, text, gold, t, out }) => {
  const L = LOOKS[look];
  const leave = Math.min(1, Math.max(0, (t - (out - 0.12)) / 0.12));
  if (leave >= 1) return null;
  const lines = splitLines(text, look === "deco" ? 15 : 16);
  return (
    <div style={{ opacity: 1 - leave, transform: `translateY(${-30 * leave}px)` }}>
      <L.Hook lines={lines} gold={gold} t={t} />
    </div>
  );
};

export const NewBadge: React.FC<{ look: LookId; number: number; opacity: number }> = ({ look, number, opacity }) => {
  const style: Record<LookId, React.CSSProperties> = {
    jewelbox: { fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: "0.34em", color: "#dbe8ff" },
    deco: { fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: 28, letterSpacing: "0.34em", color: "#fff3d3" },
    gouache: { fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 48, color: "#ffc77a" },
  };
  return (
    <div style={{ position: "absolute", top: 104, left: 0, width: W, textAlign: "center", opacity, textTransform: look === "gouache" ? "none" : "uppercase", ...style[look] }}>
      {look === "gouache" ? `Jewelry story ${number}` : `Jewelry story ${number}`}
    </div>
  );
};

export const NewEnd: React.FC<SceneProps & { look: LookId }> = ({ t, p, look }) => {
  const { hero, number } = useContext(NewLookCtx);
  const L = LOOKS[look];
  const def: PieceDef = { piece: "stone", stone: hero.stone ?? "sapphire", cut: hero.cut ?? "oval", metal: hero.metal ?? "platinum", yaw: 0 };
  const h = heroFor(def, { L, t, pop: 1, idx: 9, top: 560, bottom: 1200, uid: "end", seed: 3 + (number % 7) });
  const line = str(p.line, "A new jewelry story every day");
  const handle = str(p.handle, "HeyGema");
  return (
    <Shell L={L} t={t} idx={9} hero={h}>
      <L.Title big={handle} sub={line} t={t} />
    </Shell>
  );
};
