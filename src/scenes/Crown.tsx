import React from "react";
import { eased, DISPLAY, SANS, IVORY, BG } from "../look";
import { CutGem, Sparkle } from "../art";
import { SceneProps, str } from "./types";

const GOLD = "#d9b45f";
const GOLD_DARK = "#8a6420";

// A crown and a sceptre on dark velvet, with small labels for the named stones.
// Options: crownLabel (points at the stone on the crown's band), sceptreLabel (points at the sceptre's big stone).
export const Crown: React.FC<SceneProps> = ({ t, p }) => {
  const crownLabel = str(p.crownLabel, "");
  const sceptreLabel = str(p.sceptreLabel, "");
  const show = Math.min(1, 0.35 + eased(t, 0, 0.5));
  const tags = eased(t, 0.5, 1.0);
  const tw = (ph: number, sp = 2.6) => 0.5 + 0.5 * Math.sin(t * sp + ph);

  const pearls = (pts: [number, number][]) => pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={7} fill="#f4efe4" stroke={GOLD_DARK} strokeWidth={1.5} />);
  const arch = (x0: number, x1: number) => {
    const pts: [number, number][] = [];
    for (let i = 1; i < 12; i++) {
      const u = i / 12;
      const x = x0 + (x1 - x0) * u;
      const y = 890 - Math.sin(u * Math.PI) * 300;
      pts.push([x, y]);
    }
    return pts;
  };
  const fleur = (x: number, y: number, s: number) => (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -60 Q14 -40 6 -20 Q24 -34 34 -18 Q26 -4 6 -6 L6 0 H-6 L-6 -6 Q-26 -4 -34 -18 Q-24 -34 -6 -20 Q-14 -40 0 -60Z"
      fill={GOLD}
      stroke={GOLD_DARK}
      strokeWidth={3}
    />
  );
  const cross = (x: number, y: number, s: number, stone?: string) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-14 -70 H14 L10 -46 L34 -50 V-22 L10 -26 L14 0 H-14 L-10 -26 L-34 -22 V-50 L-10 -46Z" fill={GOLD} stroke={GOLD_DARK} strokeWidth={3} />
      {stone && <ellipse cx={0} cy={-36} rx={13} ry={16} fill={stone} stroke={GOLD_DARK} strokeWidth={2} />}
    </g>
  );

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <radialGradient id="crBg" cx="0.5" cy="0.45" r="0.7">
          <stop offset="0" stopColor="#1d2440" />
          <stop offset="1" stopColor="#06080e" />
        </radialGradient>
        <linearGradient id="crCap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a2f86" />
          <stop offset="1" stopColor="#4c1a58" />
        </linearGradient>
        <linearGradient id="crGold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a87b2c" />
          <stop offset="0.5" stopColor="#f0cf75" />
          <stop offset="1" stopColor="#a87b2c" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={BG} />
      <rect width={1080} height={1920} fill="url(#crBg)" />
      <ellipse cx={540} cy={930} rx={460} ry={560} fill="#fff1cf" opacity={0.06} />
      <g transform="translate(0 -110)">

      <g opacity={show} transform={`translate(0 ${(1 - show) * 30})`}>
        {/* the crown */}
        <path d="M335 900 Q330 640 540 590 Q750 640 745 900Z" fill="url(#crCap)" />
        <path d={`M345 890 Q360 590 540 590 Q720 590 735 890`} fill="none" stroke={GOLD} strokeWidth={14} />
        <line x1={540} y1={600} x2={540} y2={860} stroke={GOLD} strokeWidth={14} />
        {pearls(arch(345, 735))}
        {pearls([620, 660, 700, 740, 780, 820].map((y) => [540, y] as [number, number]))}
        <circle cx={540} cy={570} r={34} fill="url(#crGold)" stroke={GOLD_DARK} strokeWidth={3} />
        <path d="M520 570 H560 M540 540 V600" stroke={GOLD_DARK} strokeWidth={3} />
        {cross(540, 536, 0.75, "#2f5fa8")}
        {fleur(430, 900, 1)}
        {fleur(650, 900, 1)}
        {cross(345, 900, 0.85, "#2f7a4f")}
        {cross(735, 900, 0.85, "#2f7a4f")}
        {cross(540, 900, 1.25, "#b3202e")}
        <rect x={325} y={895} width={430} height={66} rx={8} fill="url(#crGold)" stroke={GOLD_DARK} strokeWidth={3} />
        {[365, 415, 465, 615, 665, 715].map((x, i) => (
          <ellipse key={x} cx={x} cy={928} rx={13} ry={16} fill={i % 2 ? "#2f7a4f" : "#2f5fa8"} stroke={GOLD_DARK} strokeWidth={2} />
        ))}
        <CutGem x={540} y={928} size={58} shape="cushion" />
        <path d="M318 962 H762 Q772 990 762 1016 H318 Q308 990 318 962Z" fill="#f4efe4" stroke="#8d8578" strokeWidth={3} />
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M${345 + i * 39} 980 l5 14 l5 -14Z`} fill="#26211f" />
        ))}

        {/* the sceptre */}
        <g>
          <line x1={230} y1={1470} x2={735} y2={1165} stroke="url(#crGold)" strokeWidth={22} strokeLinecap="round" />
          {[0.2, 0.45, 0.7].map((u) => (
            <circle key={u} cx={230 + 505 * u} cy={1470 - 305 * u} r={20} fill={GOLD} stroke={GOLD_DARK} strokeWidth={3} />
          ))}
          <g transform="translate(790 1132) rotate(59)">
            <path d="M-78 -40 Q-96 70 0 104 Q96 70 78 -40" fill="none" stroke={GOLD} strokeWidth={9} />
            <CutGem x={0} y={10} size={124} shape="pear" />
          </g>
          <circle cx={872} cy={1083} r={30} fill="#7b4aa8" stroke={GOLD_DARK} strokeWidth={4} />
          <g transform="translate(895 1069) rotate(59)">
            <path d="M-8 -54 H8 V-36 H24 V-22 H8 V0 H-8 V-22 H-24 V-36 H-8Z" fill={GOLD} stroke={GOLD_DARK} strokeWidth={3} />
          </g>
        </g>
      </g>

      <Sparkle x={530} y={918} r={30} k={show * tw(0)} />
      <Sparkle x={775} y={1112} r={44} k={show * tw(1.7, 2.1)} />
      <Sparkle x={540} y={868} r={22} k={show * tw(3.1)} />
      <Sparkle x={410} y={700} r={18} k={show * tw(4.2, 3.3)} />

      {crownLabel && (
        <g opacity={tags}>
          <path d="M520 950 Q430 1060 300 1060" stroke={GOLD} strokeWidth={3} fill="none" />
          <rect x={80} y={1030} width={240} height={60} fill="#0a0e18" stroke={GOLD} strokeWidth={2} />
          <text x={200} y={1071} textAnchor="middle" fontFamily={SANS} fontWeight={700} letterSpacing={2} fontSize={crownLabel.length > 14 ? 24 : 30} fill={IVORY}>
            {crownLabel}
          </text>
        </g>
      )}
      {sceptreLabel && (
        <g opacity={tags}>
          <path d="M770 1190 Q760 1290 720 1320" stroke={GOLD} strokeWidth={3} fill="none" />
          <rect x={470} y={1292} width={260} height={60} fill="#0a0e18" stroke={GOLD} strokeWidth={2} />
          <text x={600} y={1333} textAnchor="middle" fontFamily={SANS} fontWeight={700} letterSpacing={2} fontSize={sceptreLabel.length > 14 ? 24 : 30} fill={IVORY}>
            {sceptreLabel}
          </text>
        </g>
      )}
      </g>
    </svg>
  );
};
