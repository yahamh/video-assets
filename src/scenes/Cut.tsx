import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, IVORY, SANS, eased, popped, prog, shake } from "../look";
import { CutGem, RoughDiamond, Sparkle, Stars } from "../art";
import { SceneProps, num, str } from "./types";

type Piece = { shape: string; carats: number };

// A cutter's bench at night by a window full of gabled houses. In parts, so a story can hold the tension:
// phase "blade" (the blade waits over the stone), "strike" (it comes down and the stone splits), "result" (the cut stones
// in a row), or "all". Options: pieces ([{shape, carats}] left to right), hitAt (seconds, for strike and all), place, note.
export const Cut: React.FC<SceneProps> = ({ t, dur, p }) => {
  const phase = str(p.phase, "all");
  const pieces = (Array.isArray(p.pieces) ? (p.pieces as Piece[]) : []).slice(0, 12);
  const place = str(p.place, "");
  const note = str(p.note, "");
  const hit = phase === "result" ? -10 : phase === "blade" ? 1e9 : num(p.hitAt, phase === "all" ? dur * 0.25 : 0.5);
  const lower = phase === "result" ? 1 : eased(t, 0, Math.min(hit, 0.6));
  const tremble = phase === "blade" ? Math.sin(t * 40) * 1.5 : 0;
  const lift = phase === "blade" ? -40 - 30 * eased(t, 0, dur) : 0;
  const tap = t > hit && t < hit + 0.18 ? Math.sin(prog(t, hit, hit + 0.18) * Math.PI) * 30 : 0;
  const flash = t > hit ? Math.max(0, 1 - (t - hit) / 0.3) : 0;
  const crack = eased(t, hit + 0.05, hit + 0.2);
  const apart = eased(t, hit + 0.25, hit + 0.7);
  const gone = phase === "result" ? 1 : eased(t, hit + 0.65, hit + 0.95);
  const showAt = phase === "result" ? 0.05 : hit + 0.75;
  const [sx, sy] = shake(t, hit, 20, 0.4);

  const sizes = pieces.map((g) => 26 * Math.cbrt(Math.max(0.5, g.carats)));
  const gap = 14;
  const total = sizes.reduce((a, b) => a + b, 0) + gap * Math.max(0, sizes.length - 1);
  const k = total > 960 ? 960 / total : 1;
  let x = 540 - (total * k) / 2;
  const placed = sizes.map((s, i) => {
    const w = s * k;
    const cx = x + w / 2;
    x += w + gap * k;
    const d = (cx - 540) / 480;
    return { cx, cy: 1060 + d * d * 80, w, i };
  });
  const order = placed.map((g) => g.i).sort((a, b) => sizes[b] - sizes[a]);
  const roofs = [
    [60, 150, 600, true],
    [214, 140, 640, false],
    [358, 170, 580, true],
    [532, 140, 630, false],
    [676, 160, 600, true],
    [840, 160, 650, false],
  ] as const;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect width={1080} height={1920} fill={BG} />
      <g transform={`translate(${sx} ${sy})`}>
        {/* the window: night sky and canal houses */}
        <rect x={40} y={300} width={1000} height={660} fill="#111a2e" />
        <Stars t={t} n={25} top={320} bottom={560} />
        {roofs.map(([x0, w, top, steps], i) => {
          const roof = steps
            ? `M${x0} ${top + 80} V${top + 40} H${x0 + w * 0.2} V${top} H${x0 + w * 0.4} V${top - 40} H${x0 + w * 0.6} V${top} H${x0 + w * 0.8} V${top + 40} H${x0 + w} V${top + 80}`
            : `M${x0} ${top + 80} Q${x0 + w * 0.1} ${top + 10} ${x0 + w * 0.3} ${top} Q${x0 + w / 2} ${top - 70} ${x0 + w * 0.7} ${top} Q${x0 + w * 0.9} ${top + 10} ${x0 + w} ${top + 80}`;
          return (
            <g key={i}>
              <path d={`${roof} V960 H${x0} Z`} fill="#0a0e18" stroke={GOLD} strokeOpacity={0.55} strokeWidth={2.5} />
              {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={x0 + w * 0.2 + c * w * 0.36} y={top + 110 + r * 80} width={w * 0.24} height={46} fill="#e9b95e" opacity={(r + c + i) % 3 === 0 ? 0.75 : 0.12} />))}
            </g>
          );
        })}
        <rect x={40} y={300} width={1000} height={660} fill="none" stroke={GOLD} strokeWidth={6} />
        <line x1={540} y1={300} x2={540} y2={960} stroke={GOLD} strokeWidth={4} />
        <line x1={40} y1={630} x2={1040} y2={630} stroke={GOLD} strokeWidth={4} />
        {/* bench */}
        <rect y={980} width={1080} height={940} fill="#140f0b" />
        <line x1={0} y1={980} x2={1080} y2={980} stroke={GOLD} strokeWidth={3} opacity={0.7} />
        <ellipse cx={540} cy={1150} rx={420} ry={120} fill="#fff3d6" opacity={0.07} />
        <g opacity={1 - gone}>
          <defs>
            <clipPath id="cuL">
              <polygon points="0,0 560,0 520,1000 470,1300 0,1300" />
            </clipPath>
            <clipPath id="cuR">
              <polygon points="560,0 1080,0 1080,1300 470,1300 520,1000" />
            </clipPath>
          </defs>
          <g clipPath="url(#cuL)" transform={`translate(${-apart * 110} ${apart * 10}) rotate(${-apart * 9} 520 1080)`}>
            <RoughDiamond x={530} y={1040} size={340} turn={0.3} />
          </g>
          <g clipPath="url(#cuR)" transform={`translate(${apart * 110} ${apart * 10}) rotate(${apart * 9} 520 1080)`}>
            <RoughDiamond x={530} y={1040} size={340} turn={0.3} />
          </g>
          {crack > 0 && apart < 0.5 && <polyline points="560,860 548,930 532,980 520,1020 500,1120 470,1220" fill="none" stroke="#0a0e18" strokeWidth={6} strokeDasharray={420} strokeDashoffset={420 * (1 - crack)} />}
        </g>
        <g transform={`translate(${tremble} ${-420 * (1 - lower) + tap + lift})`} opacity={1 - gone}>
          <rect x={540} y={630} width={46} height={180} rx={8} fill="#2a1d12" stroke={GOLD} strokeWidth={3} transform="rotate(4 560 720)" />
          <polygon points="540,810 600,810 568,880" fill="#c9d1d8" stroke={GOLD} strokeWidth={3} strokeLinejoin="round" />
        </g>
        {flash > 0 && <rect width={1080} height={1920} fill="#fff8e1" opacity={flash * 0.85} />}
        {placed.map((g) => {
          const rank = order.indexOf(g.i);
          const a = popped(t, showAt + rank * 0.08, showAt + rank * 0.08 + 0.35);
          if (a <= 0) return null;
          return (
            <g key={g.i} opacity={a} transform={`translate(${g.cx} ${g.cy}) scale(${0.5 + 0.5 * a}) translate(${-g.cx} ${-g.cy})`}>
              <CutGem x={g.cx} y={g.cy} size={g.w} shape={pieces[g.i].shape} />
            </g>
          );
        })}
        {placed.length > 1 && <Sparkle x={placed[order[0]].cx - 20} y={placed[order[0]].cy - 40} r={44} k={popped(t, showAt + 0.4, showAt + 0.7) * (0.6 + 0.4 * Math.sin(t * 4))} />}
        {note && (
          <text x={540} y={1250} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={40} letterSpacing={6} fill={IVORY} opacity={eased(t, showAt + 0.6, showAt + 1.0)}>
            {note.toUpperCase()}
          </text>
        )}
      </g>
      {place && (
        <text x={540} y={280} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={58} fill={GOLD_LIGHT} opacity={eased(t, 0.05, 0.4)}>
          {place}
        </text>
      )}
    </svg>
  );
};
