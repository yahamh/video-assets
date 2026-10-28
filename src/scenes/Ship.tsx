import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, eased } from "../look";
import { Silhouette, Stars, Waves } from "../art";
import { SceneProps, str } from "./types";

// A steamship at night, lit windows, a searchlight, guards on deck around a locked chest.
// Options: name (painted on the hull), guards (true by default), label (gold line at the top).
export const Ship: React.FC<SceneProps> = ({ t, p }) => {
  const name = str(p.name, "");
  const label = str(p.label, "");
  const guards = p.guards !== false;
  const bob = Math.sin(t * 1.9) * 8;
  const roll = Math.sin(t * 1.4) * 1.6;
  const drift = eased(t, 0, 4) * 60 - 30;
  const beam = Math.sin(t * 0.9) * 22 - 30;
  const smoke = [];
  for (let i = 0; i < 8; i++) {
    const age = (t * 0.6 + i / 8) % 1;
    smoke.push(<circle key={i} cx={420 - age * 300 + Math.sin(i * 3) * 10} cy={770 - age * 190} r={26 + age * 56} fill="#2a3450" opacity={0.85 * (1 - age)} />);
  }
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id="shSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04060b" />
          <stop offset="1" stopColor="#1c2742" />
        </linearGradient>
        <linearGradient id="shBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff3d0" stopOpacity={0.45} />
          <stop offset="1" stopColor="#fff3d0" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="shMoon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6ecd2" stopOpacity={0.35} />
          <stop offset="1" stopColor="#f6ecd2" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={BG} />
      <rect width={1080} height={1070} fill="url(#shSky)" />
      <Stars t={t} n={50} top={60} bottom={900} />
      <circle cx={820} cy={470} r={170} fill="url(#shMoon)" />
      <circle cx={820} cy={470} r={64} fill="#f6ecd2" />
      {/* moonlight on the water */}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={790 - i * 6 + Math.sin(t * 2 + i) * 10} y1={1100 + i * 40} x2={850 + i * 6 + Math.sin(t * 2 + i) * 10} y2={1100 + i * 40} stroke="#f6ecd2" strokeOpacity={0.5 - i * 0.05} strokeWidth={4} />
      ))}
      <g transform={`translate(${drift} ${bob}) rotate(${roll} 540 1040) translate(540 1060) scale(1.15) translate(-540 -1060)`}>
        <polygon points={`860,905 ${1500},${700 + beam * 6} ${1500},${900 + beam * 6}`} fill="url(#shBeam)" />
        {smoke}
        <g stroke={GOLD} strokeOpacity={0.6} strokeWidth={3}>
          <line x1={250} y1={1000} x2={250} y2={760} />
          <line x1={820} y1={1000} x2={820} y2={780} />
          <line x1={250} y1={770} x2={820} y2={790} strokeWidth={1.5} />
          <line x1={250} y1={770} x2={150} y2={1010} strokeWidth={1.5} />
          <line x1={820} y1={790} x2={930} y2={1010} strokeWidth={1.5} />
        </g>
        {[440, 590].map((x) => (
          <g key={x}>
            <rect x={x - 32} y={800} width={64} height={150} fill="#0b0f1a" stroke={GOLD} strokeWidth={2.5} />
            <rect x={x - 32} y={800} width={64} height={22} fill="#7a2a24" />
          </g>
        ))}
        <rect x={330} y={930} width={420} height={60} fill="#101626" stroke={GOLD} strokeWidth={2.5} />
        <rect x={380} y={890} width={300} height={44} fill="#101626" stroke={GOLD} strokeWidth={2.5} />
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={360 + i * 46} cy={960} r={9} fill="#f2c56e" opacity={0.6 + 0.4 * Math.abs(Math.sin(t * 1.3 + i))} />
        ))}
        {[420, 470, 520, 570, 620].map((x) => (
          <rect key={x} x={x} y={902} width={26} height={18} fill="#f2c56e" opacity={0.75} />
        ))}
        <circle cx={860} cy={905} r={10} fill="#fff3d0" />
        <path d="M120 990 H960 L900 1100 H200 Z" fill="#070a12" stroke={GOLD} strokeWidth={3} strokeLinejoin="round" />
        <line x1={175} y1={1050} x2={930} y2={1050} stroke={GOLD} strokeOpacity={0.5} strokeWidth={2} />
        {name && (
          <text x={830} y={1036} textAnchor="end" fontFamily={DISPLAY} fontSize={26} letterSpacing={3} fill={GOLD_LIGHT}>
            {name.toUpperCase()}
          </text>
        )}
        {guards && (
          <g>
            <g transform="translate(205 990)">
              <rect x={-30} y={-46} width={60} height={46} fill="#2a1d12" stroke={GOLD} strokeWidth={2.5} />
              <rect x={-30} y={-46} width={60} height={10} fill={GOLD} />
              <rect x={-7} y={-30} width={14} height={16} rx={2} fill={GOLD} />
            </g>
            <Silhouette x={145} y={990} h={110} hat="bowler" lantern t={t} />
            <Silhouette x={268} y={990} h={110} hat="bowler" flip />
          </g>
        )}
      </g>
      <Waves top={1080} bottom={1920} shift={t * 70} color="#0c1424" stroke={GOLD} rowGap={62} arc={56} />
      {label && (
        <text x={540} y={340} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={58} fill={GOLD_LIGHT} opacity={eased(t, 0.05, 0.4)}>
          {label}
        </text>
      )}
    </svg>
  );
};
