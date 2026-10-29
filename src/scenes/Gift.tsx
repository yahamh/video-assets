import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, eased, popped } from "../look";
import { CutGem, Egg, RoughDiamond, Sparkle, Spotlight } from "../art";
import { SceneProps, str } from "./types";

// A royal gift: dark curtains with gold trim, one light, a velvet cushion, the stone, and a handwritten tag.
// Options: to (first tag line), date (second tag line), stone ("rough", "egg" or a cut shape such as "pear"), tone.
export const Gift: React.FC<SceneProps> = ({ t, p }) => {
  const to = str(p.to, "For the King");
  const date = str(p.date, "");
  const stone = str(p.stone, "rough");
  const tone = str(p.tone, "#e9f1f6");
  const open = eased(t, 0, 1.0);
  const write = eased(t, 0.5, 1.6);
  const rise = popped(t, 0.15, 0.9);
  const cw = 380 - open * 150;
  const folds = (x0: number, w: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const x = x0 + ((i + 0.5) / 6) * w;
      return <path key={i} d={`M${x} 0 Q${x + 14} 900 ${x + 6} 1920`} stroke={GOLD} strokeOpacity={0.35} strokeWidth={3} fill="none" />;
    });
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id="giVel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c3d7a" />
          <stop offset="1" stopColor="#141d42" />
        </linearGradient>
        <linearGradient id="giCurtain" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b0d16" />
          <stop offset="0.5" stopColor="#5c1522" />
          <stop offset="1" stopColor="#3b0d16" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={BG} />
      <Spotlight id="giSpot" x={540} bottom={1160} w={700} k={0.95} />
      <g transform="translate(0 -90)">
        <path d="M190 1320 Q540 1270 890 1320 L860 1520 Q540 1560 220 1520 Z" fill="#1a0b10" stroke={GOLD} strokeWidth={3} />
        <path d="M190 1320 Q540 1370 890 1320" fill="none" stroke={GOLD} strokeWidth={6} />
        <g transform={`translate(540 ${1250 - rise * 10})`}>
          <path d="M-250 20 Q-260 -70 -150 -80 Q0 -100 150 -80 Q260 -70 250 20 Q260 100 150 100 Q0 120 -150 100 Q-260 100 -250 20Z" fill="url(#giVel)" stroke={GOLD} strokeOpacity={0.6} strokeWidth={3} />
          <path d="M-200 -10 Q0 -40 200 -10" stroke="#ffffff" strokeOpacity={0.12} strokeWidth={14} fill="none" />
          {[-250, 250].map((x) => (
            <g key={x} transform={`translate(${x} 20)`}>
              <circle r={12} fill={GOLD} />
              <path d="M-8 8 L-14 60 H14 L8 8Z" fill={GOLD} />
            </g>
          ))}
        </g>
        <g transform={`translate(0 ${-rise * 40})`}>
          {stone === "rough" ? (
            <RoughDiamond x={540} y={1100} size={300} turn={Math.sin(t * 1.2)} />
          ) : stone === "egg" ? (
            <Egg x={540} y={1010} h={270} turn={t * 0.5} />
          ) : (
            <CutGem x={540} y={1100} size={240} shape={stone} tone={tone} />
          )}
        </g>
        <Sparkle x={470} y={1010} r={38} k={0.5 + 0.5 * Math.sin(t * 3.6)} />
        <Sparkle x={625} y={1110} r={28} k={0.5 + 0.5 * Math.sin(t * 2.9 + 2)} />
        <g transform={`translate(560 1330) rotate(${-6 + Math.sin(t * 1.8) * 2})`}>
          <path d="M-150 -90 Q-60 -80 -24 -8" stroke={GOLD} strokeWidth={4} fill="none" />
          <path d="M0 -70 H240 V60 H0 L-30 -5Z" fill="#f3ead6" stroke={GOLD_LIGHT} strokeWidth={3} />
          <circle cx={-8} cy={-5} r={8} fill="#3b3326" opacity={0.4} />
          <clipPath id="giWrite">
            <rect x={0} y={-80} width={250 * write} height={160} />
          </clipPath>
          <g clipPath="url(#giWrite)">
            <text x={122} y={-14} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={to.length > 14 ? 26 : 32} fill="#1d1712">
              {to}
            </text>
            <text x={122} y={34} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={date.length > 15 ? 24 : 28} fill="#1d1712">
              {date}
            </text>
          </g>
        </g>
      </g>
      <rect x={0} y={0} width={cw} height={1920} fill="url(#giCurtain)" />
      {folds(0, cw)}
      <rect x={1080 - cw} y={0} width={cw} height={1920} fill="url(#giCurtain)" />
      {folds(1080 - cw, cw)}
      <line x1={cw} y1={0} x2={cw} y2={1920} stroke={GOLD} strokeWidth={4} />
      <line x1={1080 - cw} y1={0} x2={1080 - cw} y2={1920} stroke={GOLD} strokeWidth={4} />
      <path d="M0 0 H1080 V230 Q945 310 810 230 Q675 310 540 230 Q405 310 270 230 Q135 310 0 230Z" fill="#4a1019" stroke={GOLD} strokeWidth={3} />
      <path d="M0 230 Q135 310 270 230 Q405 310 540 230 Q675 310 810 230 Q945 310 1080 230" fill="none" stroke={GOLD_LIGHT} strokeWidth={8} strokeDasharray="3 10" />
    </svg>
  );
};
