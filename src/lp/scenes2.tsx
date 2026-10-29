import React from "react";
import { DISPLAY, GOLD, GOLD_LIGHT, IVORY, RED, SANS, eased, popped, prog, shake } from "../look";
import { SceneProps, num, str } from "../scenes/types";
import { Cam, Obj, V3, onFace, place, project, rnd } from "./engine";
import { box, ground, ico, jitter, lathe, paint, part, shape, slab, torus } from "./mesh";
import { LookLp, PersonLp, Rough, SILVER, Stone, Tr, group, shadeHex } from "./models";
import { Brooch, CrownLp, Earrings, FigureLp, NecklaceOnBust, ParcelLp, Ring, RingBox, SceptreLp, ShipLp, Tiara } from "./pieces";
import { Backdrop, LightCone, Scene3D } from "./Scene3D";
import { FacetGlow, Frame, LpSparkle, LpStars, Rays, Skyline } from "./scenes";

// More story scenes in low poly (ali, 29 Oct 2026), with the same options as their drawn versions in src/scenes.

const P = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

// A point given in an object's own space, placed as the object is placed.
const at = (p: V3, tr: Tr): V3 => place(p, tr as Obj);

const Label: React.FC<{ x: number; y: number; text: string; k: number; size?: number }> = ({ x, y, text, k, size = 58 }) =>
  text ? (
    <text x={x} y={y} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={size} fill={GOLD_LIGHT} opacity={k}>
      {text}
    </text>
  ) : null;

// ------------------------------------------------------------------ jewel

export const LpJewel: React.FC<SceneProps> = ({ t, p }) => {
  const piece = str(p.piece, "ring");
  const shapeName = str(p.shape, "round");
  const tone = typeof p.tone === "string" && p.tone !== "#e9f1f6" ? p.tone : undefined;
  const metal = str(p.metal, "yellow");
  const velvet = str(p.velvet, "#23306c");
  const label = str(p.label, "");
  const labelY = 236;
  const pearls = p.pearls === true;
  const a = Math.min(1, 0.4 + eased(t, 0, 0.5));
  const sway = Math.sin(t * 1.3);
  const sweep = ((t * 0.35) % 1.4) - 0.2;
  const tw = (ph: number, sp = 2.7) => 0.5 + 0.5 * Math.sin(t * sp + ph);
  let objs: Obj[] = [];
  let cam: Cam = { pos: [0, 1.2, 10], target: [0, 0.2, 0], fov: 30 };
  if (piece === "ring") {
    objs = [...RingBox(velvet, 1, { pos: [0, -0.75, 0], rot: [0, 0.22, 0], scale: 0.85 }), ...Ring(metal, shapeName, tone, { pos: [0, 0.0, 0.05], rot: [0.05, 0.3 + sway * 0.06, 0], scale: 0.6 })];
    cam = { pos: [0, 3.0, 11.5], target: [0, -0.2, 0], fov: 30 };
  } else if (piece === "necklace") {
    objs = NecklaceOnBust(velvet, metal, shapeName, tone, pearls, str(p.drop, ""), sway, { pos: [0, 0.15, 0], scale: 0.88 });
    cam = { pos: [0, 0.7, 9.5], target: [0, -0.6, 0], fov: 30 };
  } else if (piece === "earrings") {
    objs = Earrings(metal, shapeName, tone, pearls, sway, { pos: [0, 0.2, 0], scale: 1.0 });
    cam = { pos: [0, 1.2, 9], target: [0, 1.2, 0], fov: 30 };
  } else if (piece === "brooch") {
    objs = Brooch(metal, shapeName, tone, pearls, { pos: [0, 0.45, 0], rot: [0.15, sway * 0.12, sway * 0.04], scale: 0.72 });
    cam = { pos: [0, 0.6, 9], target: [0, 0.2, 0], fov: 30 };
  } else {
    objs = Tiara(metal, shapeName, tone, pearls, { pos: [0, 0.1, 0], rot: [0.18, sway * 0.08, 0], scale: 0.8 });
    cam = { pos: [0, 1.8, 9.5], target: [0, 0.35, 0], fov: 30 };
  }
  const sx = sweep * 1080;
  return (
    <Frame>
      <Backdrop t={t} top={shadeHex(velvet, -0.65)} bottom={shadeHex(velvet, -0.4)} glow={shadeHex(velvet, 0.18)} gx={540} gy={900} gr={760} seed={43} />
      <g opacity={a} transform={`translate(0 ${(1 - a) * 30})`}>
        <Scene3D objs={objs} cam={cam} opts={{ t }} />
      </g>
      <polygon points={P([[sx - 120, -100], [sx + 60, -100], [sx + 380, 2000], [sx + 200, 2000]])} fill="#fff" opacity={0.07} />
      <polygon points={P([[sx - 40, -100], [sx + 10, -100], [sx + 330, 2000], [sx + 280, 2000]])} fill="#fff" opacity={0.06} />
      <LpSparkle x={500} y={790} r={40} k={a * tw(0)} />
      <LpSparkle x={600} y={880} r={26} k={a * tw(2.2, 2.1)} />
      <LpSparkle x={420} y={980} r={20} k={a * tw(4.1, 3.2)} />
      {label && (
        <g opacity={eased(t, 0.8, 1.5)}>
          <polygon
            points={P([
              [540 - Math.max(160, label.length * 13), labelY],
              [540 + Math.max(160, label.length * 13), labelY],
              [540 + Math.max(160, label.length * 13), labelY + 78],
              [540 - Math.max(160, label.length * 13), labelY + 78],
            ])}
            fill="#0a0e18"
            stroke={GOLD}
            strokeWidth={2}
          />
          <text x={540} y={labelY + 52} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={42} fill={IVORY}>
            {label}
          </text>
        </g>
      )}
    </Frame>
  );
};

// ------------------------------------------------------------------ cut

type Piece = { shape: string; carats: number; tone?: string };

// A window full of gabled houses at night, with a gold frame and cross bars.
const Window: React.FC<{ t: number; x: number; y: number; w: number; h: number; seed: number }> = ({ t, x, y, w, h, seed }) => (
  <g>
    <svg x={x} y={y} width={w} height={h} viewBox={`${x} ${y} ${w} ${h}`} overflow="hidden">
      <Backdrop t={t} top="#060912" bottom="#1a2440" cell={110} seed={seed} />
      <LpStars t={t} n={22} top={y + 20} bottom={y + h * 0.4} x0={x} x1={x + w} seed={seed} />
      <Skyline y={y + h} seed={seed * 3} t={t} x0={x} x1={x + w} />
    </svg>
    {[
      [x, y, w, 12],
      [x, y + h - 12, w, 12],
      [x, y, 12, h],
      [x + w - 12, y, 12, h],
      [x + w / 2 - 5, y, 10, h],
      [x, y + h / 2 - 5, w, 10],
    ].map(([bx, by, bw, bh], i) => (
      <g key={i}>
        <rect x={bx} y={by} width={bw} height={bh} fill="#8c6b2b" />
        <polygon points={P([[bx, by], [bx + bw, by], [bx + bw - Math.min(bw, bh) / 2, by + Math.min(bw, bh) / 2], [bx + Math.min(bw, bh) / 2, by + Math.min(bw, bh) / 2]])} fill={GOLD} />
      </g>
    ))}
  </g>
);

export const LpCut: React.FC<SceneProps> = ({ t, dur, p }) => {
  const phase = str(p.phase, "all");
  const pieces = (Array.isArray(p.pieces) ? (p.pieces as Piece[]) : []).slice(0, 12);
  const placeName = str(p.place, "");
  const note = str(p.note, "");
  const snap = phase === "snap";
  const hit = phase === "result" ? -10 : phase === "blade" ? 1e9 : num(p.hitAt, phase === "all" ? dur * 0.25 : 0.5);
  const lower = phase === "result" ? 1 : eased(t, 0, Math.min(hit, 0.6));
  const tremble = phase === "blade" ? Math.sin(t * 40) * 0.004 : 0;
  const lift = phase === "blade" ? 0.1 + 0.08 * eased(t, 0, dur) : 0;
  const tap = t > hit && t < hit + 0.18 ? Math.sin(prog(t, hit, hit + 0.18) * Math.PI) * 0.08 : 0;
  const flash = t > hit ? Math.max(0, 1 - (t - hit) / 0.3) : 0;
  const apart = snap ? 0 : eased(t, hit + 0.25, hit + 0.7);
  const gone = phase === "result" ? 1 : snap ? 0 : eased(t, hit + 0.65, hit + 0.95);
  const showAt = phase === "result" ? 0.05 : snap ? 1e9 : hit + 0.75;
  const fly = snap ? prog(t, hit, hit + 0.9) : 0;
  const [sx, sy] = shake(t, hit, 20, 0.4);
  const cam: Cam = { pos: [0, 2.2, 9.5], target: [0, -0.7, 0], fov: 30 };
  const objs: Obj[] = [];
  const R = 0.6;
  if (gone < 1) {
    const rough = jitter(ico(1, 1), 0.35, 4);
    const mat = { color: "#cfdde6", spec: 0.5, shine: 14, sparkle: 0.35, glow: 0.05, double: true, facets: 0.3 };
    const halves = [part(rough, (c) => c[0] < 0.05), part(rough, (c) => c[0] >= 0.05)];
    halves.forEach((h, i) => {
      const s = i ? 1 : -1;
      objs.push(...group([{ mesh: h, mat }], { pos: [s * apart * 0.8, -0.1 - apart * 0.1, 0], rot: [0.3, 0.3, s * apart * 0.3], scale: R * (1 - gone * 0.3) }));
    });
    // the blade: a handle and a steel edge, coming down onto the stone
    const by = -0.1 + R * 1.05 + 0.12 + (1 - lower) * 4 - tap + lift;
    const steel = { ...SILVER, color: "#c9d1d8" };
    objs.push({ mesh: box(0.24, 1.0, 0.24), mat: { color: "#2a1d12", spec: 0.2 }, pos: [0.05 + tremble, by + 0.75, 0.2], rot: [0, 0, 0.07] });
    if (snap && t > hit) objs.push({ mesh: slab([[-0.16, 0.12], [0.16, 0.12], [0.1, 0], [-0.08, 0.02]], 0.04), mat: steel, pos: [0.03, by + 0.05, 0.2] });
    else objs.push({ mesh: slab([[-0.16, 0.25], [0.16, 0.25], [0, -0.12]], 0.04), mat: steel, pos: [0.03 + tremble, by, 0.2] });
    if (snap && t > hit && fly < 1)
      objs.push({ mesh: slab([[-0.08, 0.02], [0.1, 0], [0, -0.12]], 0.04), mat: steel, pos: [0.03 + fly * 0.9, by + 0.6 * fly - 1.8 * fly * fly, 0.3], rot: [0, 0, fly * 11] });
  }
  // the cut stones in a row
  const sizes = pieces.map((g) => Math.min(300, 56 * Math.cbrt(Math.max(0.5, g.carats))));
  const gap = 14;
  const total = sizes.reduce((x, y) => x + y, 0) + gap * Math.max(0, sizes.length - 1);
  const k = total > 960 ? 960 / total : 1;
  let x = 540 - (total * k) / 2;
  const placed = sizes.map((s, i) => {
    const w = s * k;
    const cx = x + w / 2;
    x += w + gap * k;
    const d = (cx - 540) / 480;
    return { cx, cy: 1060 + d * d * 80, w, i };
  });
  const order = placed.map((g) => g.i).sort((m, n) => sizes[n] - sizes[m]);
  const rowCam: Cam = { pos: [0, 0, 10], target: [0, 0, 0], fov: 30 };
  const ppu = 960 / Math.tan((15 * Math.PI) / 180) / 10;
  const row: Obj[] = placed.flatMap((g) => {
    const rank = order.indexOf(g.i);
    const a = popped(t, showAt + rank * 0.08, showAt + rank * 0.08 + 0.35);
    if (a <= 0) return [];
    return Stone(pieces[g.i].shape, pieces[g.i].tone, { pos: [(g.cx - 540) / ppu, -(g.cy - 960) / ppu, 0], rot: [0.15, Math.sin(t + g.i) * 0.3, 0], scale: (g.w / ppu / 2) * (0.5 + 0.5 * a) });
  });
  return (
    <Frame>
      <Backdrop t={t} top="#0b0a0c" bottom="#16110d" seed={47} />
      <g transform={`translate(${sx} ${sy})`}>
        <Window t={t} x={40} y={300} w={1000} h={660} seed={7} />
        <polygon points={P([[0, 980], [1080, 980], [1080, 1920], [0, 1920]])} fill="#140f0b" />
        <polygon points={P([[0, 976], [1080, 976], [1080, 984], [0, 984]])} fill={GOLD} opacity={0.7} />
        <FacetGlow x={540} y={1120} r={420} color="#fff3d6" t={t} k={0.25} />
        <Scene3D objs={objs} cam={cam} opts={{ t }} />
        {flash > 0 && <rect width={1080} height={1920} fill="#fff8e1" opacity={flash * 0.85} />}
        <Scene3D objs={row} cam={rowCam} opts={{ t }} />
        {placed.length > 1 && <LpSparkle x={placed[order[0]].cx - 20} y={placed[order[0]].cy - 40} r={44} k={popped(t, showAt + 0.4, showAt + 0.7) * (0.6 + 0.4 * Math.sin(t * 4))} />}
        {note && (
          <text x={540} y={1250} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={40} letterSpacing={6} fill={IVORY} opacity={eased(t, showAt + 0.6, showAt + 1.0)}>
            {note.toUpperCase()}
          </text>
        )}
      </g>
      <Label x={540} y={280} text={placeName} k={eased(t, 0.05, 0.4)} />
    </Frame>
  );
};

// ------------------------------------------------------------------ stranger

export const LpStranger: React.FC<SceneProps> = ({ t, p }) => {
  const hat = str(p.hat, "bowler");
  const count = Math.max(1, Math.min(3, num(p.count, 1)));
  const label = str(p.label, "");
  const darkAt = num(p.darkAt, -1);
  const out = darkAt < 0 || t < darkAt ? 1 : t < darkAt + 0.35 ? (Math.sin((t - darkAt) * 70) > 0 ? 0.9 : 0.1) : 0;
  const flicker = (0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7)) * out;
  const walk = eased(t, 0, 3);
  const cam: Cam = { pos: [0, 2.86, 30], target: [0, 2.86, 0], fov: 30 };
  const ppu = 960 / Math.tan((15 * Math.PI) / 180) / 30;
  const lamp = { dir: [0.9, -0.35, -0.3] as V3, color: "#ffd98a", k: 0.9 * flicker };
  const objs: Obj[] = Array.from({ length: count }, (_, i) =>
    FigureLp(i === 0 ? hat : i === 1 ? "cap" : "bowler", t + i, walk < 1 ? 1 : 0, p.lantern === true && i === 0, {
      pos: [(560 + i * 170 + walk * 40 - 540) / ppu, 0, -i * 1.5],
      rot: [0, i % 2 ? 0.5 : -0.4, 0],
      scale: 1 - i * 0.08,
    }),
  ).flat();
  const fog = (y: number, sp: number, o: number, i: number) => {
    const cx = 540 + Math.sin(t * sp + i) * 160;
    return <polygon key={i} points={P([[cx - 760, y], [cx - 300, y - 50], [cx + 260, y - 40], [cx + 760, y + 4], [cx + 300, y + 52], [cx - 280, y + 46]])} fill="#b9c4d6" opacity={o} />;
  };
  return (
    <Frame>
      <Backdrop t={t} top="#04060b" bottom="#182238" seed={53} />
      <LpStars t={t} n={30} top={60} bottom={500} />
      <Skyline y={1300} seed={61} t={t} lights={out} />
      <polygon points={P([[0, 1300], [1080, 1300], [1080, 1920], [0, 1920]])} fill="#0d121e" />
      {Array.from({ length: 6 }, (_, i) => (
        <polygon key={i} points={P([[0, 1300 + i * 105], [1080, 1300 + i * 105 + 30], [1080, 1300 + (i + 1) * 105 + 30], [0, 1300 + (i + 1) * 105]])} fill={i % 2 ? "#0f1524" : "#0c111d"} />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <polygon key={i} points={P([[270 + Math.sin(i) * 20, 1328 + i * 26], [330 + Math.cos(i) * 20, 1326 + i * 26], [326 + Math.cos(i) * 20, 1334 + i * 26], [274 + Math.sin(i) * 20, 1334 + i * 26]])} fill="#ffd98a" opacity={0.4 * flicker * (1 - i / 10)} />
      ))}
      <FacetGlow x={297} y={736} r={230} color="#ffd98a" t={t} k={flicker} seed={3} />
      <polygon points={P([[277, 760], [317, 760], [640, 1300], [-40, 1300]])} fill="#ffd98a" opacity={0.12 * flicker} />
      <polygon points={P([[287, 760], [307, 760], [480, 1300], [110, 1300]])} fill="#ffd98a" opacity={0.08 * flicker} />
      <polygon points={P([[290, 760], [304, 760], [306, 1300], [288, 1300]])} fill="#07090f" />
      <polygon points={P([[262, 760], [332, 760], [318, 712], [276, 712]])} fill="#07090f" />
      <polygon points={P([[278, 714], [316, 714], [316, 758], [278, 758]])} fill="#ffe2a0" opacity={Math.max(0.08, flicker)} />
      {Array.from({ length: count }, (_, i) => {
        const cx = 560 + i * 170 + walk * 40;
        return <polygon key={i} points={P([[cx - 120, 1302], [cx - 60, 1290], [cx + 60, 1290], [cx + 120, 1302], [cx + 60, 1314], [cx - 60, 1314]])} fill="#000" opacity={0.55} />;
      })}
      <Scene3D objs={objs} cam={cam} opts={{ t, lights: [lamp, { dir: [-0.5, -0.2, 0.8], color: "#7f9cff", k: 0.55 }, { dir: [0, -1, -0.3], color: "#d9b45f", k: 0.12 }], ambient: 0.2 }} />
      {[fog(1180, 0.3, 0.06, 0), fog(1260, 0.22, 0.05, 1), fog(980, 0.17, 0.035, 2)]}
      <Label x={540} y={380} text={label} k={eased(t, 0.1, 0.6)} />
    </Frame>
  );
};

// ------------------------------------------------------------------ parcel

export const LpParcel: React.FC<SceneProps> = ({ t, p }) => {
  const label = str(p.label, "London");
  const stampText = str(p.stamp, "");
  const stampAt = num(p.stampAt, 0.5);
  const year = str(p.year, "");
  const close = p.close === true;
  const glow = p.glow === true;
  const enter = popped(t, 0, 0.6);
  const stampK = stampText ? popped(t, stampAt, stampAt + 0.12) : 0;
  const [sx, sy] = stampText ? shake(t, stampAt + 0.05, 16) : [0, 0];
  const pulse = 0.7 + 0.3 * Math.sin(t * 5);
  const tr: Tr = { pos: [0, (1 - enter) * -0.2, 0], rot: [0, -0.32, 0] };
  const cam: Cam = close ? { pos: [-0.35, 2.3, 9.2], target: [-0.05, 0.6, 0.5], fov: 30 } : { pos: [0, 4.4, 13], target: [0, 0.4, 0], fov: 30 };
  const objs: Obj[] = [{ mesh: ground(30, 16, 12, 6, () => 0), mat: { color: "#17110c", spec: 0.05 }, pos: [0, 0, 2] }, ...ParcelLp(tr)];
  // the address label and the postage stamps on the front of the box
  const face = (u: number, v: number): V3 => at([-1.3 + u, 1.5 - v, 0.905], tr);
  // one unit along the front face, and one unit down it
  const corner = face(0, 0);
  const minus = (b: V3, a0: V3): V3 => [b[0] - a0[0], b[1] - a0[1], b[2] - a0[2]];
  const X1 = minus(face(1, 0), corner);
  const Y1 = minus(face(0, 1), corner);
  const sc = (v: V3, k: number): V3 => [v[0] * k, v[1] * k, v[2] * k];
  const labelM = onFace(cam, face(0.12, 0.42), sc(X1, 0.98), sc(Y1, 0.6), 196, 120);
  const stamps = [
    [1.5, 0.3, "#2f6b4f", -2],
    [1.95, 0.32, "#9e3a30", 4],
  ] as const;
  const top = project(at([0, 1.6, 0], tr), cam);
  return (
    <Frame>
      <g transform={`translate(${sx} ${sy})`}>
        <Backdrop t={t} top="#070a12" bottom="#111522" seed={59} />
        <LightCone x={560} bottom={top[1] + 420} w={760} k={0.9} />
        {glow && <FacetGlow x={top[0]} y={top[1] - 20} r={380} color="#ffe6a6" t={t} k={0.8 * pulse} />}
        {glow && <Rays x={top[0]} y={top[1]} t={t} color={GOLD_LIGHT} k={pulse} />}
        <Scene3D objs={objs} cam={cam} opts={{ t }} />
        <g transform={labelM}>
          <polygon points="0,0 196,0 196,120 0,120" fill="#f3ead6" />
          <polygon points="0,0 196,0 196,38 0,30" fill="#fbf4e4" />
          <text x={16} y={36} fontFamily={DISPLAY} fontSize={22} fill="#3b3326" opacity={0.75}>
            To:
          </text>
          <text x={98} y={84} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={label.length > 9 ? 28 : 38} fill="#1d1712">
            {label}
          </text>
        </g>
        {stamps.map(([u, v, c, r], i) => (
          <g key={i} transform={`${onFace(cam, face(u, v), sc(X1, 0.32), sc(Y1, 0.38), 66, 78)} rotate(${r} 33 39)`}>
            <polygon points="0,0 66,0 66,78 0,78" fill="#f3ead6" />
            <polygon points="6,6 60,6 60,72 6,72" fill={c} />
            <polygon points="33,22 45,34 33,46 21,34" fill="#f3ead6" opacity={0.85} />
            <polygon points="18,70 33,52 48,70" fill="#f3ead6" opacity={0.85} />
          </g>
        ))}
        {stampText && (
          <g transform={onFace(cam, face(1.25, 0.95), sc(X1, 1.2), sc(Y1, 0.45), 280, 84)}>
            <g transform={`translate(140 42) rotate(-9) scale(${2.2 - 1.2 * stampK})`} opacity={stampK}>
              <polygon points="-140,-42 140,-42 140,42 -140,42" fill="none" stroke={RED} strokeWidth={7} />
              <text x={0} y={15} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={stampText.length > 10 ? 32 : 40} letterSpacing={4} fill={RED}>
                {stampText.toUpperCase()}
              </text>
            </g>
          </g>
        )}
        {glow && (
          <g>
            <LpSparkle x={top[0] - 140} y={top[1] - 10} r={34} k={0.5 + 0.5 * Math.sin(t * 4.1)} />
            <LpSparkle x={top[0] + 190} y={top[1]} r={26} k={0.5 + 0.5 * Math.sin(t * 3.3 + 2)} />
          </g>
        )}
      </g>
      {year && (
        <g>
          <defs>
            <linearGradient id="lpPaYear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff1c4" />
              <stop offset="1" stopColor={GOLD} />
            </linearGradient>
          </defs>
          <text x={540} y={640} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontWeight={700} fontSize={190} fill="url(#lpPaYear)" opacity={eased(t, 0.05, 0.45)} letterSpacing={6 + 30 * (1 - eased(t, 0, 1.2))}>
            {year}
          </text>
        </g>
      )}
    </Frame>
  );
};

// ------------------------------------------------------------------ mine

export const LpMine: React.FC<SceneProps> = ({ t, dur, p }) => {
  const placeName = str(p.place, "");
  const year = str(p.year, "");
  const carats = num(p.carats, 0);
  const zoomAt = num(p.zoomAt, 0.3) * dur;
  const tone = str(p.tone, "#cfdde6");
  const glint = eased(t, 0.2, 0.6) * (0.75 + 0.25 * Math.sin(t * 9));
  const zoom = eased(t, zoomAt, zoomAt + 0.7);
  const reveal = popped(t, zoomAt + 0.45, zoomAt + 0.9);
  const count = Math.round(carats * eased(t, zoomAt + 0.6, zoomAt + 1.6));
  const mix = (a: number, b: number) => a + (b - a) * zoom;
  // an open pit of seven terraces centred at z = 1, the land round it ending at z = -6 with low hills behind
  const cam: Cam = { pos: [mix(0, 0.3), mix(4.4, 1.2), mix(18, 3.6)], target: [0, mix(-0.9, -3.1), mix(0, 1)], fov: 30 };
  const prof: [number, number][] = [[6.6, 0.03], [5.5, 0.03]];
  for (let k = 0; k < 7; k++) {
    const r = 5.5 - k * 0.72;
    prof.push([r - 0.2, -(k + 1) * 0.45]);
    prof.push([k < 6 ? r - 0.72 : 0, -(k + 1) * 0.45]);
  }
  const pit = paint(lathe(prof, 26, 0, false), (n, c) => {
    const depth = Math.min(1, -c[1] / 3.2);
    return n[1] > 0.9 ? shadeHex("#62759b", -depth * 0.45) : shadeHex("#2c3753", -depth * 0.35);
  });
  const field = part(
    paint(ground(44, 14, 30, 10, () => 0), (_, c) => shadeHex("#1f2840", (rnd(Math.round(c[0] * 7 + c[2] * 13)) - 0.5) * 0.25)),
    (c) => Math.hypot(c[0], (c[2] - 1) / 0.8) > 6.0,
  );
  const hills = ground(48, 4, 20, 2, (x, z) => (z < -1 ? 0.55 + 0.35 * Math.sin(x * 0.55) + 0.2 * Math.sin(x * 1.7 + 1) : z < 1 ? 0.2 + 0.1 * Math.sin(x * 1.3) : 0));
  const objs: Obj[] = [
    { mesh: field, mat: { color: "#1f2840", spec: 0.15, shine: 6 }, pos: [0, 0, 0] },
    { mesh: pit, mat: { color: "#4a5a7c", spec: 0.2, shine: 6, facets: 0.15 }, pos: [0, 0, 1], scale: [1, 1, 0.8] },
    { mesh: hills, mat: { color: "#141a2b", spec: 0.1, facets: 0.25 }, pos: [0, 0, -8] },
    { mesh: box(1.4, 0.9, 1.0), mat: { color: "#0b0f1a", spec: 0.2 }, pos: [7.0, 0.45, -3.6] },
    { mesh: box(0.36, 0.3, 0.05), mat: { color: "#e9b95e", glow: 0.9 }, pos: [7.0, 0.5, -3.08] },
    { mesh: box(1.1, 0.75, 0.9), mat: { color: "#0b0f1a", spec: 0.2 }, pos: [8.7, 0.38, -4.6] },
    { mesh: box(0.3, 0.25, 0.05), mat: { color: "#e9b95e", glow: 0.9 }, pos: [8.7, 0.42, -4.13] },
  ];
  const glintAt = project([0.5, -2.7, -0.4], cam);
  // the moon half risen behind the hills
  const moonY = project([0, 0.6, -9.5], cam)[1] + 6;
  return (
    <Frame>
      <Backdrop t={t} top="#04060b" bottom="#1c2742" seed={67} />
      <LpStars t={t} n={45} top={60} bottom={moonY} />
      <polygon points={P(Array.from({ length: 8 }, (_, i) => [880 + Math.cos((i / 8) * Math.PI * 2) * 58, moonY + Math.sin((i / 8) * Math.PI * 2) * 58] as [number, number]))} fill="#f6ecd2" opacity={1 - zoom} />
      <FacetGlow x={880} y={moonY} r={170} color="#f6ecd2" t={t} k={0.5 * (1 - zoom)} rings={3} />
      <Scene3D objs={objs} cam={cam} opts={{ t, fog: { color: "#0a0e18", near: 14, far: 40, max: 0.7 } }} />
      <LpSparkle x={glintAt[0]} y={glintAt[1]} r={40 * (1 + zoom * 0.5)} k={glint * (1 - reveal)} />
      {reveal > 0 && (
        <g opacity={reveal}>
          <rect width={1080} height={1920} fill="#05070c" opacity={0.75} />
          <FacetGlow x={540} y={820} r={440} color="#cfe3ff" t={t} k={0.9} />
          <Scene3D objs={Rough({ rot: [t * 0.25, t * 0.45, 0.2], scale: 1.0 * (0.7 + 0.3 * reveal) }, tone)} cam={{ pos: [0, 0, 8.5], target: [0, -0.32, 0], fov: 30 }} opts={{ t }} />
          <LpSparkle x={460} y={720} r={48} k={0.5 + 0.5 * Math.sin(t * 4)} />
          <LpSparkle x={650} y={860} r={32} k={0.5 + 0.5 * Math.sin(t * 3.2 + 1.5)} />
          {carats > 0 && (
            <g>
              <text x={540} y={1170} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={150} fill={GOLD_LIGHT}>
                {count.toLocaleString("en-US")}
              </text>
              <text x={540} y={1230} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={36} letterSpacing={14} fill={IVORY}>
                CARATS
              </text>
            </g>
          )}
        </g>
      )}
      <Label x={540} y={340} text={[placeName, year].filter(Boolean).join(", ")} k={eased(t, 0.05, 0.4)} />
    </Frame>
  );
};

// ------------------------------------------------------------------ crown

export const LpCrown: React.FC<SceneProps> = ({ t, p }) => {
  const crownLabel = str(p.crownLabel, "");
  const sceptreLabel = str(p.sceptreLabel, "");
  const show = Math.min(1, 0.35 + eased(t, 0, 0.5));
  const tags = eased(t, 0.5, 1.0);
  const tw = (ph: number, sp = 2.6) => 0.5 + 0.5 * Math.sin(t * sp + ph);
  const cam: Cam = { pos: [0, 2.4, 16], target: [0, 0.1, 0], fov: 30 };
  const crownTr: Tr = { pos: [0, 0.55, 0], rot: [0.12, Math.sin(t * 0.5) * 0.25, 0], scale: 1.05 };
  const sceptreTr: Tr = { pos: [-0.6, -1.15, 1.4], rot: [-1.0, 0, 0.1], scale: 0.8 };
  const objs: Obj[] = [...CrownLp(crownTr), ...SceptreLp(sceptreTr)];
  const crownStone = project(at([0, 0.2, 1.17], crownTr), cam);
  const sceptreStone = project(at([2.2, 1.33, 0], sceptreTr), cam);
  const tagX = Math.min(790, sceptreStone[0] + 40);
  return (
    <Frame>
      <Backdrop t={t} top="#06080e" bottom="#1a1030" glow="#3a2d5a" gx={540} gy={820} gr={700} seed={71} />
      <LightCone x={540} bottom={1350} w={900} k={0.6} />
      <g opacity={show} transform={`translate(0 ${(1 - show) * 30})`}>
        <Scene3D objs={objs} cam={cam} opts={{ t }} />
      </g>
      <LpSparkle x={crownStone[0] - 6} y={crownStone[1] - 10} r={30} k={show * tw(0)} />
      <LpSparkle x={sceptreStone[0]} y={sceptreStone[1]} r={44} k={show * tw(1.7, 2.1)} />
      <LpSparkle x={420} y={640} r={18} k={show * tw(4.2, 3.3)} />
      {crownLabel && (
        <g opacity={tags}>
          <polyline points={`${crownStone[0] - 10},${crownStone[1] + 20} ${crownStone[0] - 90},${crownStone[1] + 120} 320,${crownStone[1] + 130}`} stroke={GOLD} strokeWidth={3} fill="none" />
          <polygon points={P([[80, crownStone[1] + 100], [320, crownStone[1] + 100], [320, crownStone[1] + 160], [80, crownStone[1] + 160]])} fill="#0a0e18" stroke={GOLD} strokeWidth={2} />
          <text x={200} y={crownStone[1] + 141} textAnchor="middle" fontFamily={SANS} fontWeight={700} letterSpacing={2} fontSize={crownLabel.length > 14 ? 24 : 30} fill={IVORY}>
            {crownLabel}
          </text>
        </g>
      )}
      {sceptreLabel && (
        <g opacity={tags}>
          <polyline points={`${sceptreStone[0] + 30},${sceptreStone[1] + 30} ${sceptreStone[0] + 60},${sceptreStone[1] + 110} ${tagX},${sceptreStone[1] + 110}`} stroke={GOLD} strokeWidth={3} fill="none" />
          <polygon points={P([[tagX, sceptreStone[1] + 80], [tagX + 240, sceptreStone[1] + 80], [tagX + 240, sceptreStone[1] + 140], [tagX, sceptreStone[1] + 140]])} fill="#0a0e18" stroke={GOLD} strokeWidth={2} />
          <text x={tagX + 120} y={sceptreStone[1] + 121} textAnchor="middle" fontFamily={SANS} fontWeight={700} letterSpacing={2} fontSize={sceptreLabel.length > 14 ? 24 : 30} fill={IVORY}>
            {sceptreLabel}
          </text>
        </g>
      )}
    </Frame>
  );
};

// ------------------------------------------------------------------ journey

type Place = { name?: string; x?: number; y?: number };

export const LpJourney: React.FC<SceneProps> = ({ t, dur, p }) => {
  const from = (p.from ?? {}) as Place;
  const to = (p.to ?? {}) as Place;
  const icon = str(p.icon, "parcel");
  const label = str(p.label, "");
  const X = (u: number | undefined, d: number) => 120 + (u ?? d) * 840;
  const Y = (u: number | undefined, d: number) => 380 + (u ?? d) * 760;
  const ax = X(from.x, 0.6);
  const ay = Y(from.y, 0.95);
  const bx = X(to.x, 0.4);
  const by = Y(to.y, 0.05);
  const cx = (ax + bx) / 2 + (ay - by) * 0.35;
  const cy = (ay + by) / 2;
  const go = eased(t, 0.3, Math.max(0.8, dur - 0.4));
  const pt = (u: number): [number, number] => [(1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx, (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by];
  const [ix, iy] = pt(go);
  const [jx, jy] = pt(Math.min(1, go + 0.01));
  const ang = (Math.atan2(jy - iy, jx - ix) * 180) / Math.PI;
  const n = 40;
  const dots = Array.from({ length: n + 1 }, (_, i) => pt(i / n));
  const pin = (x: number, y: number, name: string, k: number, below: boolean) => (
    <g opacity={k}>
      <polygon points={P(Array.from({ length: 8 }, (_, i) => [x + Math.cos((i / 8) * Math.PI * 2) * 34 * k, y + Math.sin((i / 8) * Math.PI * 2) * 34 * k] as [number, number]))} fill="none" stroke={GOLD} strokeWidth={2} opacity={0.6} />
      <polygon points={P([[x, y - 14], [x + 14, y], [x, y + 14], [x - 14, y]])} fill={GOLD_LIGHT} />
      <text x={x} y={below ? y + 76 : y - 46} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} letterSpacing={4} fill={IVORY}>
        {name.toUpperCase()}
      </text>
    </g>
  );
  // a faceted globe behind the chart, turning slowly
  const globe = ico(2, 1);
  const sea: Obj = { mesh: paint(globe, (_, c) => (Math.sin(c[0] * 5 + c[1] * 3) + Math.cos(c[2] * 4 - c[1] * 2) > 0.9 ? "#152038" : undefined)), mat: { color: "#0b1222", spec: 0.15, shine: 8, facets: 0.15 }, rot: [0.3, t * 0.12, 0], scale: 3.1 };
  return (
    <Frame>
      <Backdrop t={t} top="#070a12" bottom="#0d1322" seed={73} />
      <g opacity={0.8}>
        <Scene3D objs={[sea]} cam={{ pos: [0, 0, 16], target: [0, -0.4, 0], fov: 30 }} opts={{ t }} />
      </g>
      <g transform="translate(880 460)" opacity={0.75}>
        <polygon points={P(Array.from({ length: 12 }, (_, i) => [Math.cos((i / 12) * Math.PI * 2) * 56, Math.sin((i / 12) * Math.PI * 2) * 56] as [number, number]))} fill="none" stroke={GOLD} strokeWidth={2} />
        <polygon points="0,-70 12,0 0,70 -12,0" fill={GOLD} opacity={0.8} />
        <polygon points="0,-70 12,0 0,0" fill={GOLD_LIGHT} opacity={0.8} />
        <polygon points="-70,0 0,10 70,0 0,-10" fill={GOLD} opacity={0.4} />
        <text y={-82} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={24} fill={GOLD_LIGHT}>
          N
        </text>
      </g>
      {dots.map(([x, y], i) => (
        <polygon key={i} points={P([[x, y - 4], [x + 4, y], [x, y + 4], [x - 4, y]])} fill={i / n <= go ? GOLD_LIGHT : GOLD} opacity={i / n <= go ? 1 : 0.3} />
      ))}
      {pin(ax, ay, from.name ?? "", eased(t, 0, 0.3), true)}
      {pin(bx, by, to.name ?? "", 0.45 + 0.55 * eased(t, Math.max(0.5, dur - 0.9), dur - 0.5), false)}
      <g transform={`translate(${ix} ${iy}) rotate(${icon === "parcel" ? 0 : ang})`}>
        {icon === "parcel" && (
          <g>
            <polygon points="-40,-32 40,-32 40,32 -40,32" fill="#86643f" />
            <polygon points="-40,-32 40,-32 30,-42 -30,-42" fill="#9a7650" />
            <polygon points="-3,-32 3,-32 3,32 -3,32" fill="#efe2c4" />
            <polygon points="-40,-3 40,-3 40,3 -40,3" fill="#efe2c4" />
          </g>
        )}
        {icon === "ship" && <polygon points="-50,0 50,0 36,22 -36,22" fill="#0b0f1a" stroke={GOLD_LIGHT} strokeWidth={3} />}
        {icon === "ship" && <polygon points="-20,0 -20,-26 14,-26 14,0" fill="#0b0f1a" stroke={GOLD_LIGHT} strokeWidth={3} />}
        {icon === "train" && <polygon points="-50,-24 34,-24 50,0 50,20 -50,20" fill="#0b0f1a" stroke={GOLD_LIGHT} strokeWidth={3} />}
        {icon === "plane" && <polygon points="-50,0 50,-6 58,0 50,6" fill={GOLD_LIGHT} />}
        {icon === "plane" && <polygon points="-8,-2 -24,-40 -12,-40 14,-2" fill={GOLD} />}
        {icon === "plane" && <polygon points="-8,2 -24,40 -12,40 14,2" fill={GOLD} />}
      </g>
      <Label x={540} y={340} text={label} k={eased(t, 0.05, 0.4)} />
    </Frame>
  );
};

// ------------------------------------------------------------------ ship

export const LpShip: React.FC<SceneProps> = ({ t, p }) => {
  const name = str(p.name, "");
  const label = str(p.label, "");
  const guards = p.guards !== false;
  const bob = Math.sin(t * 1.9) * 0.06;
  const roll = Math.sin(t * 1.4) * 0.03;
  const drift = eased(t, 0, 4) * 0.5 - 0.25;
  const cam: Cam = { pos: [0, 3.0, 24], target: [0, 0.6, 0], fov: 30 };
  const shipTr: Tr = { pos: [drift, -0.05 + bob, 0], rot: [roll, -0.38, roll * 0.6], scale: 1.0 };
  const water = ground(40, 30, 26, 14, (x, z) => 0.12 * Math.sin(x * 1.1 + t * 2.0 + z * 0.4) + 0.08 * Math.sin(z * 1.7 - t * 1.5));
  const objs: Obj[] = [{ mesh: water, mat: { color: "#0c1830", spec: 0.7, shine: 10 }, pos: [0, -0.3, -4] }, ...ShipLp(t, shipTr)];
  if (guards) {
    const deck = (x: number): V3 => at([x, 0.17, 0.25], shipTr);
    objs.push(...group([{ mesh: box(0.6, 0.45, 0.45), mat: { color: "#2a1d12", spec: 0.2 } }, { mesh: box(0.62, 0.08, 0.47), mat: { color: "#d9b45f", spec: 0.5 }, pos: [0, 0.2, 0] }], { pos: [deck(-2.5)[0], deck(-2.5)[1] + 0.22, deck(-2.5)[2]] }));
    objs.push(...FigureLp("bowler", t, 0, true, { pos: deck(-3.0), scale: 0.18 }));
    objs.push(...FigureLp("bowler", t + 1, 0, false, { pos: deck(-1.95), rot: [0, Math.PI, 0], scale: 0.18 }));
  }
  const smoke: Obj[] = [];
  for (let i = 0; i < 8; i++) {
    const age = (t * 0.6 + i / 8) % 1;
    const base = at([-0.85, 2.7, 0], shipTr);
    smoke.push({ mesh: jitter(ico(0, 0.25 + age * 0.5), 0.08, i), mat: { color: "#2a3450", spec: 0.05, opacity: 0.85 * (1 - age) }, pos: [base[0] - age * 2.6, base[1] + age * 1.6, base[2]] });
  }
  objs.push(...smoke);
  const light = project(at([2.9, 0.85, 0], shipTr), cam);
  const beam = Math.sin(t * 0.9) * 22 - 30;
  const n0 = at([1.2, 0.05, 0.62], shipTr);
  const n1 = at([2.4, 0.05, 0.38], shipTr);
  const hullName = onFace(cam, n0, [n1[0] - n0[0], n1[1] - n0[1], n1[2] - n0[2]], [0, -0.2, 0], 300, 40);
  return (
    <Frame>
      <Backdrop t={t} top="#04060b" bottom="#1c2742" seed={79} />
      <LpStars t={t} n={50} top={60} bottom={900} />
      <FacetGlow x={820} y={470} r={170} color="#f6ecd2" t={t} k={0.5} rings={3} />
      <polygon points={P(Array.from({ length: 8 }, (_, i) => [820 + Math.cos((i / 8) * Math.PI * 2) * 64, 470 + Math.sin((i / 8) * Math.PI * 2) * 64] as [number, number]))} fill="#f6ecd2" />
      <polygon points={P([[light[0], light[1]], [1500, light[1] - 200 + beam * 6], [1500, light[1] + beam * 6]])} fill="#fff3d0" opacity={0.12} />
      <Scene3D objs={objs} cam={cam} opts={{ t, fog: { color: "#0a0e18", near: 16, far: 40, max: 0.75 } }} />
      {name && (
        <g transform={hullName}>
          <text x={300} y={30} textAnchor="end" fontFamily={DISPLAY} fontSize={28} letterSpacing={3} fill={GOLD_LIGHT}>
            {name.toUpperCase()}
          </text>
        </g>
      )}
      <Label x={540} y={340} text={label} k={eased(t, 0.05, 0.4)} />
    </Frame>
  );
};

// ------------------------------------------------------------------ portrait

export const LpPortrait: React.FC<SceneProps> = ({ t, p }) => {
  const name = str(p.name, "");
  const years = str(p.years, "");
  const dress = str(p.dress, "#3b2f5c");
  const hairOpt = str(p.hair, "short");
  const bg = str(p.bg, "#4c5a45");
  const pendant = typeof p.pendant === "string" ? p.pendant : "";
  const a = Math.min(1, 0.4 + eased(t, 0, 0.5));
  const plate = eased(t, 0.3, 0.8);
  const look: LookLp = {
    skin: str(p.skin, "#e8c4a0"),
    hair: hairOpt === "curls" ? "curly" : hairOpt === "bald" ? "bald" : hairOpt,
    hairColor: str(p.hairColor, "#3a2a1e"),
    outfit: p.ruff === true ? "royal" : "gown",
    outfitColor: dress,
    hat: p.crown === true ? "crown" : p.tiara === true ? "tiara" : "none",
    facial: p.beard === true ? "fullbeard" : "none",
    jewel: p.pearls === true ? "pearls" : pendant ? "pendant" : "none",
    jewelTone: pendant || undefined,
  };
  const cam: Cam = { pos: [0, 1.8, 20], target: [0, 0.52, 0], fov: 30 };
  const person = PersonLp(look, "neutral", t, 0, 0, 5);
  const frameObj: Obj = { mesh: shape(torus(1, 0.075, 40, 6), ([x, y, z]) => [x * 1.72, -z * 2.28, y]), mat: { color: "#d8a84a", spec: 0.6, shine: 16, facets: 0.15 }, pos: [0, 1.23, 0] };
  const frameObj2: Obj = { mesh: shape(torus(1, 0.022, 40, 4), ([x, y, z]) => [x * 1.6, -z * 2.15, y]), mat: { color: "#8c6b2b", spec: 0.4 }, pos: [0, 1.23, 0.05] };
  const sweep = ((t * 0.3) % 1.5) - 0.25;
  return (
    <Frame>
      <defs>
        <clipPath id="lpPoOval">
          <ellipse cx={540} cy={820} rx={292} ry={392} />
        </clipPath>
      </defs>
      <rect width={1080} height={1920} fill="#0d1322" />
      {Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 7 }, (_, c) => {
          const x = c * 180 + (r % 2) * 90 - 20;
          const y = r * 250 + 60;
          return <polygon key={`${r}${c}`} points={P([[x, y - 50], [x + 26, y], [x, y + 50], [x - 26, y]])} fill="none" stroke={GOLD} strokeOpacity={0.14} strokeWidth={2} />;
        }),
      )}
      <g opacity={a} transform={`translate(540 820) scale(${0.94 + 0.06 * a}) translate(-540 -820)`}>
        <g clipPath="url(#lpPoOval)">
          <Backdrop t={t} top={shadeHex(bg, -0.3)} bottom={shadeHex(bg, -0.55)} glow={shadeHex(bg, 0.2)} gx={480} gy={660} gr={400} cell={90} seed={83} />
          <Scene3D objs={person} cam={cam} opts={{ t }} />
          <polygon points={P([[sweep * 1080 - 120, 400], [sweep * 1080 + 40, 400], [sweep * 1080 + 260, 1300], [sweep * 1080 + 100, 1300]])} fill="#fff" opacity={0.08} />
        </g>
        <Scene3D objs={[frameObj, frameObj2]} cam={{ pos: [0, 0.45, 20], target: [0, 0.45, 0], fov: 30 }} opts={{ t }} />
      </g>
      {(pendant || p.crown === true || p.tiara === true) && <LpSparkle x={570} y={p.crown === true || p.tiara === true ? 600 : 1050} r={30} k={a * (0.5 + 0.5 * Math.sin(t * 2.8))} />}
      {(name || years) && (
        <g opacity={plate} transform="translate(540 1205)">
          <polygon points={P([[-250, -46], [250, -46], [250, years ? 58 : 28], [-250, years ? 58 : 28]])} fill="#d8a84a" />
          <polygon points={P([[-250, -46], [250, -46], [240, -36], [-240, -36]])} fill="#f0cf75" />
          <polygon points={P([[-250, years ? 58 : 28], [250, years ? 58 : 28], [240, years ? 48 : 18], [-240, years ? 48 : 18]])} fill="#8c6b2b" />
          <text x={0} y={2} textAnchor="middle" fontFamily={DISPLAY} fontWeight={600} fontSize={name.length > 22 ? 30 : 38} fill="#1d1712">
            {name}
          </text>
          {years && (
            <text x={0} y={42} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={28} fill="#1d1712">
              {years}
            </text>
          )}
        </g>
      )}
    </Frame>
  );
};
