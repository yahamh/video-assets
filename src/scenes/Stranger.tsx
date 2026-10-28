import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, eased, rand } from "../look";
import { Silhouette, Stars } from "../art";
import { SceneProps, num, str } from "./types";

// A figure under a street lamp at night, in fog. For "someone", a thief, a buyer, a guard.
// Options: hat (bowler, top, cap, none), count (1 to 3 figures), label (gold line at the top), lantern,
// darkAt (seconds: the lamp and the lit windows flicker and go out, for a power cut).
export const Stranger: React.FC<SceneProps> = ({ t, p }) => {
  const hat = str(p.hat, "bowler");
  const count = Math.max(1, Math.min(3, num(p.count, 1)));
  const label = str(p.label, "");
  const darkAt = num(p.darkAt, -1);
  // after darkAt the lights stutter for a moment, then stay out
  const out = darkAt < 0 || t < darkAt ? 1 : t < darkAt + 0.35 ? (Math.sin((t - darkAt) * 70) > 0 ? 0.9 : 0.1) : 0;
  const flicker = (0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7)) * out;
  const walk = eased(t, 0, 3) * 40;
  const fog = (y: number, sp: number, o: number, i: number) => (
    <ellipse key={i} cx={540 + Math.sin(t * sp + i) * 160} cy={y} rx={700} ry={60} fill="#b9c4d6" opacity={o} />
  );
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id="stSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04060b" />
          <stop offset="1" stopColor="#182238" />
        </linearGradient>
        <radialGradient id="stLamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity={0.55} />
          <stop offset="1" stopColor="#ffd98a" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="stCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd98a" stopOpacity={0.35} />
          <stop offset="1" stopColor="#ffd98a" stopOpacity={0.02} />
        </linearGradient>
        <filter id="stBlur">
          <feGaussianBlur stdDeviation={30} />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill={BG} />
      <rect width={1080} height={1300} fill="url(#stSky)" />
      <Stars t={t} n={30} top={60} bottom={500} />
      {/* rooftops and windows */}
      <path d="M0 640 H140 V560 H300 V600 H420 V500 H560 V580 H700 V530 H860 V610 H1080 V1300 H0Z" fill="#0b0f1a" stroke={GOLD} strokeOpacity={0.35} strokeWidth={2} />
      {Array.from({ length: 14 }, (_, i) => {
        const x = 40 + (i % 7) * 150 + rand(i) * 30;
        const y = 700 + Math.floor(i / 7) * 190 + rand(i + 4) * 40;
        const lit = rand(i + 9) > 0.45;
        return <rect key={i} x={x} y={y} width={46} height={70} fill={lit && out > 0.5 ? "#e9b95e" : "#141b2d"} opacity={lit && out > 0.5 ? 0.75 : 1} />;
      })}
      {/* wet street */}
      <rect y={1300} width={1080} height={620} fill="#0d121e" />
      <line x1={0} y1={1300} x2={1080} y2={1300} stroke={GOLD} strokeOpacity={0.4} strokeWidth={2} />
      {Array.from({ length: 10 }, (_, i) => (
        <line key={i} x1={270 + Math.sin(i) * 20} y1={1330 + i * 26} x2={330 + Math.cos(i) * 20} y2={1330 + i * 26} stroke="#ffd98a" strokeOpacity={0.4 * flicker * (1 - i / 10)} strokeWidth={5} />
      ))}
      {/* lamp */}
      <g>
        <rect x={290} y={760} width={14} height={540} fill="#07090f" stroke={GOLD} strokeOpacity={0.5} strokeWidth={2} />
        <path d="M262 760 H332 L318 712 H276Z" fill="#07090f" stroke={GOLD} strokeOpacity={0.6} strokeWidth={2} />
        <rect x={278} y={714} width={38} height={44} fill="#ffe2a0" opacity={Math.max(0.08, flicker)} />
        <circle cx={297} cy={736} r={220} fill="url(#stLamp)" opacity={flicker} />
        <polygon points="277,760 317,760 640,1300 -40,1300" fill="url(#stCone)" opacity={flicker} />
      </g>
      {Array.from({ length: count }, (_, i) => (
        <g key={i}>
          <ellipse cx={560 + i * 170 + walk} cy={1302} rx={120} ry={16} fill="#000" opacity={0.6} />
          <Silhouette x={560 + i * 170 + walk} y={1300} h={500 - i * 40} hat={i === 0 ? hat : i === 1 ? "cap" : "bowler"} flip={i % 2 === 1} lantern={p.lantern === true && i === 0} t={t} />
        </g>
      ))}
      <g filter="url(#stBlur)">{[fog(1180, 0.3, 0.12, 0), fog(1260, 0.22, 0.1, 1), fog(980, 0.17, 0.06, 2)]}</g>
      {label && (
        <text x={540} y={380} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={58} fill={GOLD_LIGHT} opacity={eased(t, 0.1, 0.6)}>
          {label}
        </text>
      )}
    </svg>
  );
};
