import React from "react";
import { prog, rand } from "../look";
import { SceneProps, num, str } from "../scenes/types";
import type { Expression } from "../people/Person";
import { Blob, Card, Confetti, CORAL, CREAM, Doodles, Glow, INK, INK_SOFT, LILAC, LIME, MINT, MONO, PINK, Ripples, SERIF, SKY, SUN, Shadow, Sheet, Sparkle, Stamp, blobPath, pick, tint } from "./kit";
import { Brooch, Carrot, Chest, Crown, Earrings, Gem, Item, Necklace, Opal, Parcel, Ring, Rough, Sceptre, Spheres, Tiara } from "./things";
import { PLook, PaperPerson, Setting } from "./people";

// The story scenes in the paper look (ali, 30 Oct 2026): each scene is one big painted shape on cream paper with its
// subject drawn flat on it, white line work drifting across it and confetti. Options are the same as the drawn scenes
// (src/scenes/*.tsx), so a story only has to say "style": "paper". The captions sit at y 1180 to 1480, the series
// plate at the top above y 260, so subjects keep between them.

// 0 before `at`, then up past 1 and back: things pop in with a small overshoot.
export const popIn = (t: number, at: number, len = 0.45) => {
  const u = prog(t, at, at + len);
  if (u <= 0) return 0;
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};
const ease = (t: number, a: number, b: number) => {
  const u = prog(t, a, b);
  return u * u * (3 - 2 * u);
};
const tone = (p: Record<string, unknown>) => (typeof p.tone === "string" ? p.tone : undefined);

// The big painted shape of a scene, with what is clipped to it (a setting, the sea) and white doodles across it.
const Stage: React.FC<{ id: string; t: number; color: string; seed: number; cx?: number; cy?: number; rx?: number; ry?: number; lines?: number[]; children?: React.ReactNode }> = ({
  id,
  t,
  color,
  seed,
  cx = 540,
  cy = 1000,
  rx = 500,
  ry = 690,
  lines = [560, 720, 1250, 1420, 1560],
  children,
}) => (
  <g>
    <clipPath id={`${id}-clip`}>
      <path d={blobPath(cx, cy, rx, ry, seed, t * 0.6, 1)} />
    </clipPath>
    <Blob id={id} cx={cx} cy={cy} rx={rx} ry={ry} color={color} seed={seed} t={t} />
    <g clipPath={`url(#${id}-clip)`}>
      <Doodles t={t} seed={seed + 3} x0={cx - rx} x1={cx + rx} ys={lines} opacity={0.7} />
      {children}
    </g>
  </g>
);

// A short typed note on a strip of paper, for a place, a date or a label.
const Note: React.FC<{ x: number; y: number; text: string; k?: number; size?: number; tilt?: number; tape?: string }> = ({ x, y, text, k = 1, size = 30, tilt = -1.5, tape }) => {
  if (!text || k <= 0.01) return null;
  const w = text.length * size * 0.62 + size * 1.4;
  const h = size * 1.9;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${0.8 + 0.2 * k})`} opacity={Math.min(1, k * 1.5)}>
      <rect x={-w / 2 + 4} y={-h / 2 + 6} width={w} height={h} rx={4} fill={INK} opacity={0.12} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill={CREAM} />
      {tape && <rect x={-w / 2 - 14} y={-h / 2 - 8} width={60} height={24} fill={tape} opacity={0.85} transform={`rotate(-30 ${-w / 2} ${-h / 2})`} />}
      <text y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={size} letterSpacing={size * 0.12} fill={INK}>
        {text.toUpperCase()}
      </text>
    </g>
  );
};

// A few twinkles round a point.
const Twinkles: React.FC<{ x: number; y: number; r: number; t: number; k?: number; seed?: number; color?: string }> = ({ x, y, r, t, k = 1, seed = 1, color = CREAM }) => (
  <g>
    {[0, 1, 2, 3].map((i) => {
      const a = rand(seed + i * 3) * Math.PI * 2;
      const d = r * (0.8 + rand(seed + i * 5) * 0.5);
      const tw = Math.max(0, Math.sin(t * (2.4 + rand(seed + i) * 2) + i * 1.7));
      return <Sparkle key={i} x={x + Math.cos(a) * d} y={y + Math.sin(a) * d} r={18 + rand(seed + i * 7) * 16} k={tw * k} color={color} />;
    })}
  </g>
);

// A color that reads on the scene's own color.
const other = (color: string, list = [SUN, CREAM, MINT, PINK]) => list.find((c) => c.toLowerCase() !== color.toLowerCase()) ?? CREAM;

// ------------------------------------------------------------------ hook

// The opening shot: the payoff, big and already moving on the first frame, under the hook words. Options as in
// scenes/Hook.tsx (show: parcel, chest, rough, gem, glass, pearl, round-pearl, egg, opal, ring, carrot).
export const PHook: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pHook";
  const show = str(p.show, "rough");
  const shape = str(p.shape, "cushion");
  const tn = tone(p);
  const halo = str(p.halo, "");
  const size = num(p.size, 600) / 600;
  const color = pick(p);
  const cy = 1200;
  const bob = Math.sin(t * 2.2) * 14;
  const spin = Math.sin(t * 0.9) * 7;
  const stampK = popIn(t, 0.55, 0.3);
  let subject: React.ReactNode;
  if (show === "parcel" || show === "chest") {
    const lift = Math.min(1, 0.7 + t / 3);
    const kind = tn ? "gem" : "rough";
    subject = (
      <g>
        <g transform={`translate(540 ${cy - 60 - 190 * lift + bob}) rotate(${spin})`}>
          <Item kind={kind} s={140 * size} t={t} shape={shape} tone={tn} id="pHookIt" />
        </g>
        <g transform={`translate(540 ${cy + 150})`}>
          {show === "parcel" ? <Parcel s={250} label={str(p.label, "")} open={1} /> : <Chest s={240} open={1} />}
        </g>
      </g>
    );
  } else {
    const turn = show === "rough" ? t * 14 : spin;
    subject = (
      <g transform={`translate(540 ${cy + bob}) rotate(${turn})`}>
        <Item kind={show} s={(show === "ring" ? 340 : 270) * size} t={t} shape={shape} tone={tn} id="pHookIt" metalName={str(p.metal, "yellow")} prongs={num(p.prongs, 4)} />
      </g>
    );
  }
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={5} cy={1230} rx={480} ry={560} lines={[860, 1010, 1470, 1620]}>
        <Ripples x={540} y={cy + 300} t={t} r={440} flat={0.28} />
      </Stage>
      <Glow id={id} x={540} y={cy - 40} r={240} color={halo || CREAM} k={0.8 + 0.2 * Math.sin(t * 3)} />
      <Shadow id={id} x={540} y={cy + 310} rx={210} k={0.9} />
      {subject}
      <Twinkles x={540} y={cy - 40} r={330} t={t} seed={4} />
      <Confetti t={t} seed={2} n={22} box={[110, 720, 970, 1740]} />
      {typeof p.stamp === "string" && <Stamp x={800} y={cy + 260} text={p.stamp} k={stampK} color={color === CORAL ? INK : CORAL} />}
    </Sheet>
  );
};

// ------------------------------------------------------------------ title

// Words alone: big italic capitals across a painted splash. Options: text (big, "\n" for a new line), sub (small, above).
export const PTitle: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pTitle";
  const text = str(p.text, "");
  const sub = str(p.sub, "");
  const color = pick(p);
  const lines = text.toUpperCase().split("\n");
  const longest = Math.max(1, ...lines.map((l) => l.length));
  const size = Math.min(190, Math.round(930 / (longest * 0.47)));
  const top = 860 - ((lines.length - 1) * size * 0.95) / 2;
  const k = popIn(t, 0.02, 0.5);
  const grow = popIn(t, 0, 0.6);
  return (
    <Sheet id={id}>
      <g transform={`translate(540 860) scale(${0.3 + 0.7 * grow}) translate(-540 -860)`}>
        <Stage id={id} t={t} color={color} seed={9} cy={860} rx={440} ry={470} lines={[600, 760, 980, 1130]}>
          <Ripples x={540} y={860} t={t} r={520} every={2} />
        </Stage>
      </g>
      {sub && (
        <g opacity={Math.min(1, k * 1.4)}>
          <path d={`M${540 - 240} ${top - size * 0.95} H${540 + 240}`} stroke={INK} strokeWidth={2} />
          <text x={540} y={top - size * 0.95 - 26} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={34} letterSpacing={8} fill={INK}>
            {sub.toUpperCase()}
          </text>
        </g>
      )}
      <g transform={`translate(540 860) scale(${0.85 + 0.15 * k}) translate(-540 -860)`} opacity={Math.min(1, k * 1.5)}>
        {lines.map((l, i) => (
          <text key={i} x={540} y={top + i * size * 0.95 + size * 0.33} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={INK} letterSpacing={1}>
            {l}
          </text>
        ))}
      </g>
      <Confetti t={t} seed={6} n={18} box={[90, 330, 990, 1500]} burst={0.05} />
    </Sheet>
  );
};

// ------------------------------------------------------------------ cast

// The floor under a setting: earth, grass, boards or stone, so a blue or green blob never reads as water.
const GROUND: Record<string, string> = { field: "#b98a52", mine: "#8f5f36", garden: "#79b354", workshop: "#b9773f", study: "#b9773f", ship: "#a86c3a", street: "#a59d93", lab: "#cfc8bf", vault: "#8e8a86" };
const floor = (setting: string, color: string) => (GROUND[setting] ? GROUND[setting] : tint(color, -0.14));

type Member = PLook & { expression?: Expression; react?: { at: number; expression: Expression } };

// The people of the story, whole figures standing in a place, with a name card. Options as in scenes/Cast.tsx; the
// settings are palace, workshop, street, study, garden, field, lab, mine, ship, vault or plain.
export const PCast: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pCast";
  const cast = ((Array.isArray(p.cast) ? p.cast : [{}]) as Member[]).slice(0, 3);
  const setting = str(p.setting, "plain");
  const name = str(p.name, "");
  const role = str(p.role, "");
  const gaspAt = num(p.gasp, -1);
  const color = pick(p);
  const ground = 1180;
  const n = cast.length;
  const spots: [number, number][] = n === 1 ? [[540, 1]] : n === 2 ? [[330, 0.9], [750, 0.9]] : [[225, 0.78], [540, 0.82], [855, 0.78]];
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={13} cy={960} rx={500} ry={650} lines={[420, 560, 1300, 1450]}>
        <Setting kind={setting} t={t} color={color} ground={ground} />
        <rect x={0} y={ground} width={1080} height={700} fill={floor(setting, color)} />
        <path d={`M0 ${ground} H1080`} stroke={CREAM} strokeWidth={4} opacity={0.7} />
      </Stage>
      {cast.map((m, i) => {
        const [x, s] = spots[i];
        const k = popIn(t, 0.05 + i * 0.12, 0.5);
        const ex = m.react && t >= m.react.at ? m.react.expression : m.expression ?? "smile";
        const gasp = i === 0 && gaspAt >= 0 ? prog(t, gaspAt, gaspAt + 0.5) : 0;
        return (
          <g key={i}>
            <Shadow id={id} x={x} y={ground + 4} rx={120 * s} k={k} />
            <g transform={`translate(${x} ${ground}) scale(${s * (0.35 + 0.65 * k)})`} opacity={Math.min(1, k * 2)}>
              <PaperPerson look={m} expression={ex} t={t + i * 0.7} seed={i * 7 + 1} gasp={gasp} flip={n > 1 && x > 540} id={`${id}${i}`} />
            </g>
          </g>
        );
      })}
      <Confetti t={t} seed={8} n={12} box={[80, 330, 1000, 700]} />
      {name && <Card x={540} y={1610} name={name} role={role} k={popIn(t, 0.3, 0.45)} tape={other(color, [SUN, LIME, MINT])} />}
    </Sheet>
  );
};

// ------------------------------------------------------------------ parcel

// A brown paper parcel on a painted shape. Options as in scenes/Parcel.tsx: label, stamp, stampAt, glow, year, close.
export const PParcel: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pParcel";
  const color = pick(p);
  const close = !!p.close;
  const s = close ? 390 : 300;
  const stampAt = num(p.stampAt, 0.5);
  const year = typeof p.year === "string" || typeof p.year === "number" ? String(p.year) : "";
  const k = popIn(t, 0, 0.5);
  const y = 900 + Math.sin(t * 1.8) * 8;
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={17}>
        {typeof p.stamp === "string" && t >= stampAt && <Ripples x={720} y={1000} t={t - stampAt} r={420} every={1.6} />}
      </Stage>
      {year && (
        <text x={540} y={520} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={150} fill={INK} opacity={popIn(t, 0.1, 0.4)}>
          {year}
        </text>
      )}
      {!!p.glow && <Glow id={id} x={540} y={y - s * 0.3} r={s * 0.9} color={SUN} k={0.7 + 0.3 * Math.sin(t * 4)} />}
      <Shadow id={id} x={540} y={y + s * 0.4} rx={s * 1.05} k={k} />
      <g transform={`translate(540 ${y}) rotate(${Math.sin(t * 1.2) * 2}) scale(${0.6 + 0.4 * k})`}>
        <Parcel s={s} label={str(p.label, "")} />
      </g>
      {!!p.glow && <Twinkles x={540} y={y - s * 0.45} r={s * 0.5} t={t} seed={12} color={SUN} />}
      <Confetti t={t} seed={10} n={16} box={[100, 360, 980, 1600]} />
      {typeof p.stamp === "string" && <Stamp x={720} y={1000} text={p.stamp} k={popIn(t, stampAt, 0.25)} color={color === CORAL ? INK : CORAL} />}
    </Sheet>
  );
};

// ------------------------------------------------------------------ mine

// The ground where a stone was found, then a square lens pops up with the rough stone in it and its weight counting
// up. Options as in scenes/Mine.tsx: place, year, carats, zoomAt (0..1 of the scene), tone; ground "mine" (default) or
// "field".
export const PMine: React.FC<SceneProps> = ({ t, dur, p }) => {
  const id = "pMine";
  const color = pick(p);
  const ground = str(p.ground, "mine");
  const z = num(p.zoomAt, 0.3) * dur;
  const carats = num(p.carats, 0);
  const place = [str(p.place, ""), p.year !== undefined ? String(p.year) : ""].filter(Boolean).join(" · ");
  const k = popIn(t, z, 0.5);
  const count = carats * ease(t, z + 0.25, z + 1.25);
  const decimals = (String(p.carats ?? "").split(".")[1] ?? "").length;
  const shown = decimals ? count.toFixed(decimals) : Math.round(count).toLocaleString("en-US");
  const spot: [number, number] = [540, 1110];
  const box = { x: 540, y: 720, w: 400 };
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={21} lines={[420, 520, 1300, 1450]}>
        <Setting kind={ground === "field" ? "field" : "mine"} t={t} color={color} ground={1180} />
        <rect x={0} y={1180} width={1080} height={700} fill={floor(ground === "field" ? "field" : "mine", color)} />
        <Ripples x={spot[0]} y={spot[1]} t={t} r={160} flat={0.35} every={1.2} />
      </Stage>
      <Sparkle x={spot[0]} y={spot[1] - 10} r={44} k={0.5 + 0.5 * Math.abs(Math.sin(t * 5))} color={CREAM} />
      {k > 0.01 && (
        <g opacity={Math.min(1, k * 1.6)}>
          <path d={`M${box.x - box.w / 2} ${box.y + box.w / 2} L${spot[0] - 18} ${spot[1]} M${box.x + box.w / 2} ${box.y + box.w / 2} L${spot[0] + 18} ${spot[1]}`} stroke={INK} strokeWidth={2.5} strokeDasharray="10 10" />
          <g transform={`translate(${box.x} ${box.y}) scale(${k}) rotate(${-2 + Math.sin(t) * 1})`}>
            <rect x={-box.w / 2 + 8} y={-box.w / 2 + 10} width={box.w} height={box.w} fill={INK} opacity={0.14} />
            <rect x={-box.w / 2} y={-box.w / 2} width={box.w} height={box.w} fill={CREAM} stroke={INK} strokeWidth={4} />
            {[-1, 0, 1].map((i) => (
              <path key={i} d={`M${i * 100} ${-box.w / 2} V${box.w / 2} M${-box.w / 2} ${i * 100} H${box.w / 2}`} stroke={INK} strokeWidth={1} opacity={0.15} />
            ))}
            <circle r={150} fill="none" stroke={INK} strokeWidth={1.5} opacity={0.3} strokeDasharray="4 8" />
            <g transform={`rotate(${t * 18})`}>
              <Rough s={125} tone={tone(p)} seed={7} />
            </g>
            <Twinkles x={0} y={0} r={150} t={t} seed={22} color={SUN} />
          </g>
        </g>
      )}
      {carats > 0 && t > z + 0.2 && (
        <g opacity={ease(t, z + 0.2, z + 0.45)}>
          <rect x={300} y={960} width={480} height={110} rx={8} fill={CREAM} transform="rotate(1.5 540 1015)" />
          <text x={540} y={1040} textAnchor="middle" fill={INK}>
            <tspan fontFamily={SERIF} fontStyle="italic" fontSize={92}>{shown}</tspan>
            <tspan fontFamily={MONO} fontWeight={700} fontSize={30} letterSpacing={4} dx={14}>CARATS</tspan>
          </text>
        </g>
      )}
      {place && <Note x={540} y={410} text={place} k={popIn(t, 0.1, 0.4)} tape={other(color, [SUN, LIME])} />}
    </Sheet>
  );
};

// ------------------------------------------------------------------ ship

// A cheerful steamship on a painted sea, bobbing, its funnels puffing. Options: name (on the hull), label (a note at
// the top).
export const PShip: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pShip";
  const color = typeof p.color === "string" ? p.color : SKY;
  const name = str(p.name, "");
  const sea = 1080;
  const bob = Math.sin(t * 1.6) * 10;
  const k = popIn(t, 0, 0.5);
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={25} lines={[430, 560, 700]}>
        <circle cx={820} cy={520} r={90} fill={SUN} />
        <rect x={0} y={sea} width={1080} height={800} fill={tint(color, -0.2)} />
        {[0, 1, 2, 3].map((i) => {
          const y = sea + 10 + i * 70;
          const sh = (t * (40 + i * 12)) % 180;
          let d = "";
          for (let x = -180; x <= 1260; x += 30) d += `${x === -180 ? "M" : "L"}${x + sh} ${y + Math.sin((x + sh) / 45 + i) * 9}`;
          return <path key={i} d={d} fill="none" stroke={CREAM} strokeWidth={4} opacity={0.75 - i * 0.12} strokeLinecap="round" />;
        })}
      </Stage>
      <g transform={`translate(540 ${sea + bob}) rotate(${Math.sin(t * 1.3) * 2}) scale(${0.7 + 0.3 * k})`}>
        {[0, 1, 2].map((i) => {
          const u = ((t * 0.5 + i / 3) % 1);
          return <circle key={i} cx={-60 - u * 160} cy={-330 - u * 200} r={30 + u * 40} fill={CREAM} opacity={0.85 * (1 - u)} />;
        })}
        {[-90, 50].map((x, i) => (
          <g key={i}>
            <rect x={x - 32} y={-330} width={64} height={150} fill={i ? CORAL : SUN} />
            <rect x={x - 32} y={-330} width={64} height={26} fill={INK} />
          </g>
        ))}
        <rect x={-250} y={-190} width={430} height={110} rx={10} fill={CREAM} />
        {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={-200 + i * 70} cy={-135} r={16} fill={SKY} stroke={INK} strokeWidth={4} />)}
        <path d="M-400 -90 H420 Q400 20 300 60 H-320 Q-390 10 -400 -90Z" fill={INK} />
        <path d="M-396 -60 H414" stroke={CORAL} strokeWidth={16} />
        {name && (
          <text x={0} y={20} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={36} letterSpacing={6} fill={CREAM}>
            {name.toUpperCase()}
          </text>
        )}
      </g>
      <Confetti t={t} seed={14} n={12} box={[90, 340, 990, 900]} />
      <Note x={540} y={410} text={str(p.label, "")} k={popIn(t, 0.1, 0.4)} tape={SUN} />
    </Sheet>
  );
};

// ------------------------------------------------------------------ reveal

// A chest opens and what's inside rises out of it in a burst of confetti. Options as in scenes/Reveal.tsx: item (rough,
// gem, glass, pearl, round-pearl, egg, opal, ring, carrot, empty), shape, tone, openAt, stamp, stampAt, label, halo,
// light (the glow's color), dark (true: the scene dims).
export const PReveal: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pReveal";
  const item = str(p.item, "rough");
  const openAt = num(p.openAt, 0.25);
  const stampAt = num(p.stampAt, 1.2);
  const base = pick(p);
  const color = p.dark ? tint(base, -0.45) : base;
  const open = ease(t, openAt, openAt + 0.35);
  const k = popIn(t, openAt + 0.15, 0.6);
  const bob = Math.sin(t * 2.2) * 10 * k;
  const iy = 1010 - 280 * k + bob;
  const glow = str(p.halo, "") || str(p.light, "") || CREAM;
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={29}>
        {t > openAt + 0.25 && <Ripples x={540} y={1150} t={t - openAt - 0.25} r={460} flat={0.3} />}
      </Stage>
      <Glow id={id} x={540} y={iy} r={230} color={glow} k={k} />
      <Shadow id={id} x={540} y={1210} rx={300} />
      <g transform={`translate(540 1100)`}>
        <Chest s={280} open={open} inside={k > 0.01 ? (
          <g transform={`translate(0 ${iy - 1100}) scale(${0.4 + 0.6 * Math.min(1, k)})`}>
            <Item kind={item} s={170} t={t} shape={str(p.shape, "round")} tone={tone(p) ?? (item === "glass" ? "#dcebe4" : undefined)} id="pRevealIt" metalName={str(p.metal, "yellow")} />
          </g>
        ) : null} />
      </g>
      {k > 0.5 && <Twinkles x={540} y={iy} r={230} t={t} seed={30} />}
      <Confetti t={t} seed={16} n={26} box={[90, 380, 990, 1500]} burst={openAt + 0.2} k={Math.min(1, prog(t, openAt + 0.2, openAt + 0.3))} />
      <Note x={540} y={410} text={str(p.label, "")} k={popIn(t, 0.1, 0.4)} tape={SUN} />
      {typeof p.stamp === "string" && <Stamp x={790} y={1180} text={p.stamp} k={popIn(t, stampAt, 0.25)} color={base === CORAL ? INK : CORAL} />}
    </Sheet>
  );
};

// ------------------------------------------------------------------ journey

const Vehicle: React.FC<{ icon: string; angle: number }> = ({ icon, angle }) => {
  switch (icon) {
    case "plane":
      return (
        <g transform={`rotate(${angle})`}>
          <path d="M-60 0 Q-50 -12 40 -10 Q66 -8 70 0 Q66 8 40 10 Q-50 12 -60 0Z" fill={CREAM} stroke={INK} strokeWidth={4} />
          <path d="M-5 -8 L-30 -62 H-10 L25 -8Z M-5 8 L-30 62 H-10 L25 8Z M-50 -6 L-66 -30 H-54 L-38 -6Z" fill={CORAL} stroke={INK} strokeWidth={3} />
        </g>
      );
    case "ship":
      return (
        <g>
          <rect x={-30} y={-58} width={24} height={30} fill={SUN} stroke={INK} strokeWidth={3} />
          <rect x={-48} y={-32} width={80} height={22} fill={CREAM} stroke={INK} strokeWidth={3} />
          <path d="M-70 -12 H70 Q60 18 40 26 H-50 Q-66 14 -70 -12Z" fill={CORAL} stroke={INK} strokeWidth={4} />
        </g>
      );
    case "train":
      return (
        <g transform={`rotate(${angle})`}>
          <rect x={-70} y={-36} width={90} height={50} rx={8} fill={CORAL} stroke={INK} strokeWidth={4} />
          <rect x={20} y={-56} width={44} height={70} rx={6} fill={SUN} stroke={INK} strokeWidth={4} />
          {[-48, -8, 40].map((x) => <circle key={x} cx={x} cy={22} r={13} fill={INK} />)}
        </g>
      );
    default:
      return (
        <g transform={`rotate(${angle * 0.15})`}>
          <Parcel s={52} />
        </g>
      );
  }
};

type Place = { name?: string; x?: number; y?: number };

// A route drawn on a painted map from one place to another, with something travelling along it. Options as in
// scenes/Journey.tsx: from and to ({name, x, y}, 0 to 1 across the map), icon (parcel, ship, train, plane), label.
export const PJourney: React.FC<SceneProps> = ({ t, dur, p }) => {
  const id = "pJourney";
  const color = typeof p.color === "string" ? p.color : SKY;
  const from = (p.from ?? {}) as Place;
  const to = (p.to ?? {}) as Place;
  const px = (v: number | undefined, d: number) => 150 + (v ?? d) * 780;
  const py = (v: number | undefined, d: number) => 480 + (v ?? d) * 620;
  const a: [number, number] = [px(from.x, 0.15), py(from.y, 0.7)];
  const b: [number, number] = [px(to.x, 0.85), py(to.y, 0.3)];
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const c: [number, number] = [(a[0] + b[0]) / 2 + ((b[1] - a[1]) / dist) * dist * 0.25, (a[1] + b[1]) / 2 - ((b[0] - a[0]) / dist) * dist * 0.25 * Math.sign(b[0] - a[0] || 1)];
  const at = (u: number): [number, number] => [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
  const u = ease(t, 0.3, 0.3 + Math.min(2.4, Math.max(0.8, dur * 0.65)));
  const head = at(u);
  const ahead = at(Math.min(1, u + 0.01));
  const angle = (Math.atan2(ahead[1] - head[1], ahead[0] - head[0]) * 180) / Math.PI;
  const icon = str(p.icon, "parcel");
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={33} lines={[600, 1000, 1350, 1500]}>
        <Blob id={id} cx={a[0]} cy={a[1] + 20} rx={190} ry={140} color={tint(LIME, -0.05)} seed={34} t={t} />
        <Blob id={id} cx={b[0]} cy={b[1] + 20} rx={190} ry={140} color={tint(MINT, 0.1)} seed={35} t={t} />
      </Stage>
      {Array.from({ length: 44 }, (_, i) => {
        const v = i / 43;
        if (v > u) return null;
        const [x, y] = at(v);
        return <circle key={i} cx={x} cy={y} r={6} fill={INK} opacity={0.85} />;
      })}
      <circle cx={a[0]} cy={a[1]} r={16} fill={CREAM} stroke={INK} strokeWidth={5} />
      <g opacity={ease(t, 0.3 + Math.min(2.4, Math.max(0.8, dur * 0.65)) - 0.1, 0.3 + Math.min(2.4, Math.max(0.8, dur * 0.65)) + 0.2)}>
        <Ripples x={b[0]} y={b[1]} t={t} r={150} every={1.2} color={CREAM} />
        <circle cx={b[0]} cy={b[1]} r={16} fill={CORAL} stroke={INK} strokeWidth={5} />
      </g>
      <g transform={`translate(${head[0]} ${head[1] - 10})`}>
        <Vehicle icon={icon} angle={icon === "plane" || icon === "train" ? angle : 0} />
      </g>
      {from.name && <Note x={a[0]} y={a[1] + 90} text={from.name} size={28} k={popIn(t, 0.1, 0.4)} />}
      {to.name && <Note x={b[0]} y={b[1] - 80} text={to.name} size={28} k={popIn(t, 0.5, 0.4)} tilt={1.5} />}
      <Note x={540} y={410} text={str(p.label, "")} k={popIn(t, 0.1, 0.4)} tape={SUN} />
    </Sheet>
  );
};

// ------------------------------------------------------------------ gift

const KINDS = ["rough", "egg", "pearl", "round-pearl", "opal", "ring", "carrot", "glass"];

// A gift on a cushion with a handwritten tag. Options as in scenes/Gift.tsx: to and date (the tag's two lines), stone
// ("rough", "egg", "ring", "pearl" or a cut shape such as "pear"), tone.
export const PGift: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pGift";
  const color = pick(p);
  const stone = str(p.stone, "round");
  const kind = KINDS.includes(stone) ? stone : "gem";
  const k = popIn(t, 0.05, 0.5);
  const tag = popIn(t, 0.35, 0.5);
  // the tag grows with its words, so a long note never runs off it
  const toSize = str(p.to, "").length > 14 ? 40 : 50;
  const half = Math.max(130, str(p.to, "").length * toSize * 0.22 + 10);
  const bob = Math.sin(t * 2) * 10;
  const cushion = tint(other(color, [LILAC, PINK, MINT]), -0.1);
  const swing = Math.sin(t * 1.5) * 4;
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={37}>
        <Ripples x={540} y={1090} t={t} r={420} flat={0.3} every={1.8} />
      </Stage>
      <Glow id={id} x={540} y={880} r={220} color={CREAM} k={k} />
      <Shadow id={id} x={540} y={1110} rx={300} />
      <g transform="translate(540 1050)">
        <path d="M-280 -40 Q-300 30 -250 60 H250 Q300 30 280 -40 Q0 -90 -280 -40Z" fill={cushion} />
        <path d="M-270 -38 Q0 -84 270 -38" stroke={CREAM} strokeWidth={5} fill="none" strokeDasharray="14 10" />
        {[-270, 270].map((x) => (
          <g key={x} transform={`translate(${x} 40) rotate(${Math.sin(t * 2 + x) * 6})`}>
            <path d="M0 0 V36" stroke={SUN} strokeWidth={8} />
            <path d="M-12 30 L0 70 L12 30Z" fill={SUN} />
          </g>
        ))}
      </g>
      <g transform={`translate(540 ${880 + bob}) scale(${0.4 + 0.6 * k})`}>
        <Item kind={kind} s={170} t={t} shape={stone} tone={tone(p)} id="pGiftIt" />
      </g>
      <Twinkles x={540} y={880} r={220} t={t} seed={38} />
      {tag > 0.01 && (
        <g transform={`translate(800 560) rotate(${-6 + swing}) scale(${0.7 + 0.3 * tag})`} opacity={Math.min(1, tag * 1.5)}>
          <path d="M-110 0 C-160 120 -60 300 -40 460" stroke={INK} strokeWidth={3} fill="none" opacity={0.6} />
          <path d={`M${-half} -70 H${half + 20} V70 H${-half} L${-half - 40} 0Z`} fill={CREAM} />
          <circle cx={-half + 2} cy={0} r={10} fill={color} />
          <text x={22} y={str(p.date, "") ? -6 : 16} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={toSize} fill={INK}>
            {str(p.to, "")}
          </text>
          {str(p.date, "") && (
            <text x={22} y={42} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={3} fill={INK_SOFT}>
              {str(p.date, "").toUpperCase()}
            </text>
          )}
        </g>
      )}
      <Confetti t={t} seed={18} n={20} box={[90, 330, 990, 1500]} />
    </Sheet>
  );
};

// ------------------------------------------------------------------ cut

type CutPiece = { shape?: string; carats?: number; tone?: string; size?: number };

// A cutter's bench. Options as in scenes/Cut.tsx: phase "blade" (the blade waits), "snap" (the blade breaks),
// "strike" (the stone splits), "result" (the cut stones in a row, popping in one by one) or "all"; pieces
// ([{shape, carats, tone?, size?}]: size 0..1 sets a piece's size when it has no carats, and shape "rough" shows an
// uncut crystal), hitAt, place, note.
export const PCut: React.FC<SceneProps> = ({ t, dur, p }) => {
  const id = "pCut";
  const color = pick(p);
  const phase = str(p.phase, "all");
  const hit = num(p.hitAt, phase === "all" ? dur * 0.25 : 0.5);
  const pieces = (Array.isArray(p.pieces) ? (p.pieces as CutPiece[]) : [{ shape: "pear" }]).slice(0, 6);
  const resultAt = phase === "result" ? 0.1 : phase === "all" ? hit + 1.0 : Infinity;
  const showBench = t < resultAt;
  const down = phase === "blade" ? 0 : ease(t, hit - 0.12, hit);
  const tremble = phase === "blade" || t < hit - 0.12 ? Math.sin(t * 40) * 2 : 0;
  const after = t - hit;
  const snapped = (phase === "snap") && after > 0;
  const split = (phase === "strike" || phase === "all") && after > 0;
  const gap = split ? Math.min(1, after / 0.4) * 70 : 0;
  const by = 760 + down * 150 + tremble;
  const maxC = Math.max(1, ...pieces.map((x) => num(x.carats, 1)));
  const n = pieces.length;
  // sizes follow the carats (or size), then all shrink together so no two neighbors touch
  const raw = pieces.map((pc) => 40 + 85 * (pc.size ?? Math.sqrt(num(pc.carats, maxC) / maxC)));
  const spacing = n > 1 ? 740 / (n - 1) : 740;
  const fit = Math.min(1, ...raw.slice(1).map((r, i) => (spacing * 0.85) / (r + raw[i])));
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={41} lines={[440, 560, 1300, 1450]}>
        <rect x={0} y={1110} width={1080} height={800} fill={tint("#b9773f", 0.05)} />
        <rect x={0} y={1110} width={1080} height={22} fill={tint("#b9773f", -0.2)} />
        {after > 0 && phase !== "blade" && <Ripples x={540} y={1060} t={after} r={380} flat={0.3} />}
      </Stage>
      {showBench && (
        <g>
          <path d="M490 1110 L510 1040 H570 L590 1110Z" fill={INK} />
          <clipPath id={`${id}-l`}><rect x={0} y={0} width={540} height={1920} /></clipPath>
          <clipPath id={`${id}-r`}><rect x={540} y={0} width={540} height={1920} /></clipPath>
          {[-1, 1].map((side) => (
            <g key={side} clipPath={`url(#${id}-${side < 0 ? "l" : "r"})`} transform={`translate(${side * gap} ${split ? -Math.min(1, after / 0.4) * 20 : 0})`}>
              <g transform="translate(540 960)"><Rough s={105} tone={pieces[0]?.tone} seed={9} /></g>
            </g>
          ))}
          {!snapped ? (
            <g transform={`translate(540 ${by})`}>
              <path d="M-26 -230 H26 V-40 L0 0 L-26 -40Z" fill="#dfe6ea" stroke={INK} strokeWidth={5} />
              <rect x={-38} y={-300} width={76} height={80} rx={10} fill={CORAL} stroke={INK} strokeWidth={5} />
            </g>
          ) : (
            <g>
              <g transform={`translate(${540 - after * 260} ${by - after * 380 + after * after * 600}) rotate(${-after * 240})`}>
                <path d="M-26 -230 H26 V-120 H-26Z" fill="#dfe6ea" stroke={INK} strokeWidth={5} />
                <rect x={-38} y={-300} width={76} height={80} rx={10} fill={CORAL} stroke={INK} strokeWidth={5} />
              </g>
              <g transform={`translate(${540 + after * 200} ${by - 120 - after * 200 + after * after * 700}) rotate(${after * 300})`}>
                <path d="M-26 0 H26 V80 L0 120 L-26 80Z" fill="#dfe6ea" stroke={INK} strokeWidth={5} />
              </g>
            </g>
          )}
        </g>
      )}
      {!showBench &&
        pieces.map((pc, i) => {
          const kk = popIn(t, resultAt + i * 0.22, 0.45);
          const s = raw[i] * fit;
          const x = n === 1 ? 540 : 170 + i * spacing;
          return (
            <g key={i} opacity={Math.min(1, kk * 2)}>
              <Shadow id={id} x={x} y={1000} rx={s * 0.9} k={kk} />
              <g transform={`translate(${x} ${900 + Math.sin(t * 2 + i) * 6}) scale(${kk})`}>
                {pc.shape === "rough" ? <Rough s={s * 0.9} tone={pc.tone} seed={i + 2} /> : <Gem shape={pc.shape ?? "round"} tone={pc.tone} s={s} t={t + i} />}
              </g>
              {pc.carats !== undefined && (
                <text x={x} y={1080} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={n > 4 ? 22 : 28} letterSpacing={2} fill={INK} opacity={Math.min(1, kk)}>
                  {`${pc.carats} CT`}
                </text>
              )}
            </g>
          );
        })}
      {split && after < 1.2 && <Confetti t={t} seed={20} n={22} box={[160, 600, 920, 1200]} burst={hit} />}
      <Note x={540} y={410} text={str(p.place, "")} k={popIn(t, 0.1, 0.4)} tape={SUN} />
      {str(p.note, "") && (
        <text x={540} y={500} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={4} fill={INK} opacity={popIn(t, 0.2, 0.4)}>
          {str(p.note, "").toUpperCase()}
        </text>
      )}
    </Sheet>
  );
};

// ------------------------------------------------------------------ crown

// A crown and a sceptre with typed labels. Options as in scenes/Crown.tsx: crownLabel, sceptreLabel.
export const PCrown: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pCrown";
  const color = pick(p);
  const k = popIn(t, 0, 0.5);
  const k2 = popIn(t, 0.15, 0.5);
  const cl = str(p.crownLabel, "");
  const sl = str(p.sceptreLabel, "");
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={45}>
        <Ripples x={430} y={1010} t={t} r={360} flat={0.3} every={1.8} />
      </Stage>
      <Glow id={id} x={430} y={800} r={230} color={CREAM} k={k} />
      <Shadow id={id} x={430} y={1010} rx={260} k={k} />
      <ellipse cx={430} cy={980} rx={250} ry={50} fill={tint(other(color, [LILAC, PINK]), -0.2)} />
      <g transform={`translate(430 ${840 + Math.sin(t * 1.8) * 6}) scale(${0.4 + 0.6 * k})`}>
        <Crown s={240} t={t} id="pCrownC" />
      </g>
      <g transform={`translate(820 ${880 + Math.sin(t * 1.5 + 1) * 6}) rotate(${12 + Math.sin(t) * 2}) scale(${0.4 + 0.6 * k2})`}>
        <Sceptre s={290} t={t} />
      </g>
      <Twinkles x={540} y={760} r={300} t={t} seed={46} />
      {cl && (
        <g opacity={ease(t, 0.5, 0.8)}>
          <path d="M430 930 Q380 1020 330 1060" stroke={INK} strokeWidth={3} fill="none" strokeDasharray="8 8" />
          <Note x={330} y={1100} text={cl} size={28} k={popIn(t, 0.55, 0.4)} />
        </g>
      )}
      {sl && (
        <g opacity={ease(t, 0.8, 1.1)}>
          <path d="M870 650 Q880 560 820 500" stroke={INK} strokeWidth={3} fill="none" strokeDasharray="8 8" />
          <Note x={760} y={460} text={sl} size={28} k={popIn(t, 0.85, 0.4)} tilt={1.5} />
        </g>
      )}
      <Confetti t={t} seed={22} n={18} box={[90, 360, 990, 1500]} />
    </Sheet>
  );
};

// ------------------------------------------------------------------ jewel

// One piece close up, drawn like a plate in an old science book: a thin frame and grid, construction circles, the
// piece on a painted shape and its stone again in a square lens. Options as in scenes/Jewel.tsx: piece (ring,
// necklace, earrings, brooch, tiara), shape, tone, metal, velvet (the painted shape's color), pearls, drop, label;
// prongs (4 or 6), halo and empty (no stone yet) for a ring; and three pieces only the paper look has: "spheres"
// (opal's silica spheres; size "small" for small ones), "opal" (a polished opal), "carrot" (a carrot grown through a
// ring).
export const PJewel: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pJewel";
  const piece = str(p.piece, "ring");
  const shape = str(p.shape, piece === "ring" ? "round" : "pear");
  const tn = tone(p);
  const mt = str(p.metal, piece === "tiara" ? "white" : "yellow");
  const color = str(p.velvet, "") || pick(p);
  const k = popIn(t, 0, 0.55);
  const lens = popIn(t, 0.55, 0.45);
  const cx = 540, cy = 820;
  const bob = Math.sin(t * 1.8) * 8;
  let node: React.ReactNode;
  let focus: [number, number] | null = null;
  switch (piece) {
    case "necklace":
      node = <g transform={`translate(${cx} ${cy - 40})`}><Necklace s={290} pearls={!!p.pearls} drop={str(p.drop, "")} shape={shape} tone={tn} metalName={mt} t={t} id="pJewelN" /></g>;
      focus = p.drop === "none" ? null : [cx, cy - 40 + 290 * 0.77];
      break;
    case "earrings":
      node = <g transform={`translate(${cx} ${cy + 40})`}><Earrings s={300} shape={shape} tone={tn} pearls={!!p.pearls} metalName={mt} t={t} id="pJewelE" /></g>;
      focus = [cx + 300 * 0.53, cy + 40 + 300 * 0.05];
      break;
    case "brooch":
      node = <g transform={`translate(${cx} ${cy}) rotate(${Math.sin(t * 0.8) * 4})`}><Brooch s={230} shape={shape} tone={tn} metalName={mt} t={t} /></g>;
      focus = [cx, cy];
      break;
    case "tiara":
      node = <g transform={`translate(${cx} ${cy + 60})`}><Tiara s={320} shape={shape} tone={tn} metalName={mt} t={t} id="pJewelT" /></g>;
      focus = [cx, cy + 60 + 320 * (0.4 - 0.3 - 0.75 - 0.08)];
      break;
    case "spheres":
      node = <g transform={`translate(${cx} ${cy})`}><Spheres s={300} t={t} big={p.size !== "small"} /></g>;
      focus = [cx + 40, cy - 40];
      break;
    case "opal":
      node = <g transform={`translate(${cx} ${cy}) rotate(${Math.sin(t * 0.8) * 6})`}><Opal s={240} t={t} dark={tn === "dark"} /></g>;
      break;
    case "carrot":
      node = <g transform={`translate(${cx} ${cy + 30}) rotate(${-12 + Math.sin(t * 0.9) * 4})`}><Carrot s={300} ring metalName={mt === "yellow" && !p.metal ? "white" : mt} /></g>;
      focus = [cx - 10, cy + 20];
      break;
    default:
      node = <g transform={`translate(${cx} ${cy - 30})`}><Ring s={270} shape={shape} tone={tn} metalName={mt} t={t} prongs={num(p.prongs, 4)} halo={!!p.halo} noStone={!!p.empty} /></g>;
      focus = p.empty ? null : [cx, cy - 30 - 270 * 0.06];
  }
  const lx = 820, ly = 480, lw = 210;
  return (
    <Sheet id={id}>
      <g stroke={INK} fill="none">
        <rect x={110} y={300} width={860} height={1350} strokeWidth={2} opacity={0.45} />
        <rect x={124} y={314} width={832} height={1322} strokeWidth={1} opacity={0.3} />
        {[1, 2, 3, 4].map((i) => <path key={`v${i}`} d={`M${110 + i * 172} 300 V1650`} strokeWidth={1} opacity={0.1} />)}
        {[1, 2, 3, 4, 5, 6, 7].map((i) => <path key={`h${i}`} d={`M110 ${300 + i * 169} H970`} strokeWidth={1} opacity={0.1} />)}
        <circle cx={cx} cy={cy} r={300} strokeWidth={1.5} opacity={0.3} strokeDasharray="5 9" transform={`rotate(${t * 6} ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={380} strokeWidth={1} opacity={0.2} />
        <path d={`M${cx - 420} ${cy} H${cx + 420} M${cx} ${cy - 420} V${cy + 420}`} strokeWidth={1} opacity={0.18} />
      </g>
      {[[160, 350], [920, 1600]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${t * 20 * (i ? -1 : 1)})`} opacity={0.6}>
          {Array.from({ length: 8 }, (_, j) => <path key={j} d="M0 0 V-22" stroke={INK} strokeWidth={2} transform={`rotate(${j * 45})`} />)}
        </g>
      ))}
      <path d="M920 360 l6 14 15 2 -11 10 3 15 -13 -8 -13 8 3 -15 -11 -10 15 -2Z" fill={INK} opacity={0.5} />
      <g transform={`translate(${cx} ${cy}) scale(${0.3 + 0.7 * k}) translate(${-cx} ${-cy})`}>
        <Blob id={id} cx={cx} cy={cy} rx={330} ry={330} color={color} seed={49} t={t} />
        <clipPath id={`${id}-clip`}><circle cx={cx} cy={cy} r={330} /></clipPath>
        <g clipPath={`url(#${id}-clip)`}>
          <Doodles t={t} seed={50} x0={cx - 330} x1={cx + 330} ys={[620, 1000]} opacity={0.6} />
        </g>
      </g>
      <Shadow id={id} x={cx} y={cy + 250} rx={220} k={k} />
      <g transform={`translate(0 ${bob}) translate(${cx} ${cy}) scale(${0.4 + 0.6 * k}) translate(${-cx} ${-cy})`}>{node}</g>
      <Twinkles x={cx} y={cy} r={260} t={t} seed={51} />
      {focus && lens > 0.01 && piece !== "brooch" && (
        <g opacity={Math.min(1, lens * 1.5)}>
          <path d={`M${lx - lw / 2} ${ly + lw / 2} L${focus[0] + 20} ${focus[1] + bob - 20} M${lx + lw / 2} ${ly + lw / 2} L${focus[0] + 30} ${focus[1] + bob}`} stroke={INK} strokeWidth={2} strokeDasharray="6 8" opacity={0.7} />
          <g transform={`translate(${lx} ${ly}) scale(${lens}) rotate(2)`}>
            <rect x={-lw / 2 + 6} y={-lw / 2 + 8} width={lw} height={lw} fill={INK} opacity={0.14} />
            <rect x={-lw / 2} y={-lw / 2} width={lw} height={lw} fill={tint(color, 0.55)} stroke={INK} strokeWidth={4} />
            {piece === "spheres" ? (
              <g transform="scale(1.5)"><Spheres s={60} t={t} big={p.size !== "small"} /></g>
            ) : piece === "carrot" ? (
              <g transform="scale(0.9)"><Gem s={60} t={t} /></g>
            ) : p.pearls && piece !== "ring" ? (
              <circle r={60} fill="#f6efe4" stroke={INK} strokeWidth={2} />
            ) : (
              <Gem shape={piece === "necklace" && p.drop === "pearl" ? "round" : shape} tone={piece === "necklace" && p.drop === "pearl" ? "#f6efe4" : tn} s={72} t={t} />
            )}
          </g>
        </g>
      )}
      {str(p.label, "") && <Card x={540} y={1600} name={str(p.label, "")} k={popIn(t, 0.35, 0.45)} tape={other(color, [SUN, LIME, MINT])} />}
    </Sheet>
  );
};

// ------------------------------------------------------------------ portrait

// A painted portrait on a card taped to the paper, with a name card. No real likeness: a simple figure dressed for
// the part. Options as in scenes/Portrait.tsx: name, years, dress, skin, hair, hairColor, crown, tiara, pearls,
// beard, ruff, pendant, bg.
export const PPortrait: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pPortrait";
  const color = pick(p);
  const bg = str(p.bg, "") || other(color, [SKY, MINT, LILAC, SUN]);
  const hair = str(p.hair, "short");
  const long = ["long", "updo", "curls", "curly"].includes(hair);
  const look = {
    outfit: (p.crown ? "royal" : long || p.tiara ? "gown" : "coat") as "royal" | "gown" | "coat",
    outfitColor: typeof p.dress === "string" ? p.dress : undefined,
    skin: typeof p.skin === "string" ? p.skin : undefined,
    hair: (hair === "curls" ? "curly" : hair) as "short",
    hairColor: typeof p.hairColor === "string" ? p.hairColor : undefined,
    hat: (p.crown ? "crown" : p.tiara ? "tiara" : "none") as "crown",
    jewel: (p.pearls ? "pearls" : typeof p.pendant === "string" ? "pendant" : "none") as "pearls",
    jewelTone: typeof p.pendant === "string" ? p.pendant : undefined,
    facial: (p.beard ? "beard" : "none") as "beard",
  };
  const k = popIn(t, 0, 0.5);
  const cx = 540, cy = 760;
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={53} lines={[420, 1250, 1420, 1560]} />
      <g transform={`translate(${cx} ${cy}) rotate(${-2 + Math.sin(t * 0.9) * 1}) scale(${0.5 + 0.5 * k})`}>
        <rect x={-284} y={-346} width={580} height={720} fill={INK} opacity={0.15} />
        <rect x={-290} y={-360} width={580} height={720} fill={CREAM} />
        <clipPath id={`${id}-oval`}><ellipse cx={0} cy={-10} rx={230} ry={300} /></clipPath>
        <ellipse cx={0} cy={-10} rx={230} ry={300} fill={bg} />
        <g clipPath={`url(#${id}-oval)`}>
          <Doodles t={t} seed={54} x0={-230} x1={230} ys={[-200, 150]} opacity={0.5} />
          <g transform="translate(0 600) scale(1.15)">
            <PaperPerson look={look} expression="smile" t={t} seed={3} id={`${id}P`} />
          </g>
          {!!p.ruff && (
            <g transform={`translate(0 ${600 - 455 * 1.15})`}>
              <ellipse rx={120} ry={34} fill={CREAM} stroke={INK} strokeWidth={3} />
              {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${-100 + i * 22} -20 V20`} stroke={INK} strokeWidth={1.5} opacity={0.4} />)}
            </g>
          )}
        </g>
        <ellipse cx={0} cy={-10} rx={230} ry={300} fill="none" stroke={INK} strokeWidth={4} />
        {[-1, 1].map((s) => <rect key={s} x={s * 290 - 50} y={-380} width={100} height={36} fill={SUN} opacity={0.85} transform={`rotate(${s * 30} ${s * 290} -360)`} />)}
      </g>
      <Twinkles x={cx} y={cy} r={360} t={t} seed={55} />
      <Confetti t={t} seed={24} n={14} box={[90, 330, 990, 1500]} />
      {str(p.name, "") && <Card x={540} y={1610} name={str(p.name, "")} role={str(p.years, "")} k={popIn(t, 0.3, 0.45)} tape={other(color, [LIME, SUN, MINT])} />}
    </Sheet>
  );
};

// ------------------------------------------------------------------ stranger

// Someone in a street at dusk under a lamp: a buyer, a guard, a passer-by. Options as in scenes/Stranger.tsx: hat
// (bowler, top, cap, none), count (1 to 3), label, lantern, darkAt (seconds: the lamp flickers out).
export const PStranger: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pStranger";
  const base = typeof p.color === "string" ? p.color : LILAC;
  const darkAt = num(p.darkAt, -1);
  const flick = darkAt >= 0 && t > darkAt - 0.4 && t < darkAt ? (Math.sin(t * 60) > 0 ? 0.6 : 0) : 0;
  const dark = darkAt >= 0 ? Math.max(flick, ease(t, darkAt, darkAt + 0.25)) : 0;
  const color = tint(base, -0.4 * dark);
  const count = Math.max(1, Math.min(3, num(p.count, 1)));
  const hat = str(p.hat, "bowler");
  const ground = 1180;
  const xs = count === 1 ? [430] : count === 2 ? [330, 560] : [260, 470, 680];
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={color} seed={57} lines={[430, 560, 1300, 1450]}>
        <Setting kind="street" t={t} color={color} ground={ground} />
        <rect x={0} y={ground} width={1080} height={700} fill={tint(color, -0.15)} />
      </Stage>
      <Glow id={id} x={830} y={600} r={200} color={SUN} k={1 - dark} />
      <rect x={823} y={600} width={14} height={ground - 600} fill={INK} />
      <path d="M790 590 H870 L850 540 H810Z" fill={INK} />
      <circle cx={830} cy={605} r={26} fill={dark > 0.5 ? tint(SUN, -0.5) : SUN} />
      {xs.map((x, i) => {
        const k = popIn(t, 0.05 + i * 0.12, 0.5);
        return (
          <g key={i} transform={`translate(${x + Math.sin(t * 0.8 + i) * 6} ${ground}) scale(${0.82 * (0.4 + 0.6 * k)})`} opacity={Math.min(1, k * 2)}>
            <PaperPerson look={{ outfit: "coat", hat: hat as "bowler", prop: p.lantern && i === 0 ? "lantern" : "none", outfitColor: [INK_SOFT, "#3a4a6a", "#5a3a4a"][i] }} expression="neutral" t={t + i} seed={i * 5 + 2} id={`${id}${i}`} />
          </g>
        );
      })}
      <Note x={540} y={410} text={str(p.label, "")} k={popIn(t, 0.1, 0.4)} tape={SUN} />
    </Sheet>
  );
};

// ------------------------------------------------------------------ end

// The last card: a diamond turning in a burst of confetti, the series line and the name.
export const PaperEnd: React.FC<SceneProps> = ({ t, p }) => {
  const id = "pEnd";
  const k = popIn(t, 0, 0.5);
  const handle = str(p.handle, "HeyGema");
  const line = str(p.line, "");
  return (
    <Sheet id={id}>
      <Stage id={id} t={t} color={PINK} seed={61} cy={900} rx={480} ry={600} lines={[480, 620, 1250, 1380]}>
        <Ripples x={540} y={720} t={t} r={520} every={1.6} />
      </Stage>
      <Glow id={id} x={540} y={700} r={200} color={CREAM} k={k} />
      <g transform={`translate(540 ${700 + Math.sin(t * 2) * 8}) rotate(${Math.sin(t * 1.4) * 8}) scale(${k})`}>
        <Gem shape="round" s={170} t={t} />
      </g>
      <Twinkles x={540} y={700} r={230} t={t} seed={62} />
      <text x={540} y={1090} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={170} fill={INK} opacity={Math.min(1, popIn(t, 0.15, 0.45) * 1.4)}>
        {handle}
      </text>
      {line && (
        <text x={540} y={1180} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={34} letterSpacing={4} fill={INK} opacity={popIn(t, 0.3, 0.4)}>
          {line.toUpperCase()}
        </text>
      )}
      <Confetti t={t} seed={26} n={30} box={[80, 300, 1000, 1550]} burst={0} />
    </Sheet>
  );
};
