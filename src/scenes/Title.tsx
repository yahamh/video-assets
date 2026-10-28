import React from "react";
import { BG, DISPLAY, GOLD, IVORY, SANS, eased, popped } from "../look";
import { Sparkle } from "../art";
import { SceneProps, str } from "./types";

// Words alone on the dark page, for a date, a place or a line that needs room. Options: text (big), sub (small, above).
export const Title: React.FC<SceneProps> = ({ t, p }) => {
  const text = str(p.text, "");
  const sub = str(p.sub, "");
  const a = popped(t, 0.02, 0.35);
  const spread = eased(t, 0, 2.5);
  const lines = text.split("\n");
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(longest > 10 ? 120 : 200, Math.round(1700 / longest)); // keeps the widest line inside the frame
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id="tiGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1c4" />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
        <radialGradient id="tiBg" cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#1d2440" />
          <stop offset="1" stopColor={BG} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#tiBg)" />
      {sub && (
        <text x={540} y={580} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={36} letterSpacing={12} fill={IVORY} opacity={a}>
          {sub.toUpperCase()}
        </text>
      )}
      <line x1={540 - 260 * spread} y1={620} x2={540 + 260 * spread} y2={620} stroke={GOLD} strokeWidth={2} />
      {lines.map((l, i) => (
        <text key={i} x={540} y={760 + i * size * 1.05} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontWeight={700} fontSize={size} fill="url(#tiGold)" opacity={a} letterSpacing={2 + 10 * (1 - spread)}>
          {l}
        </text>
      ))}
      <line x1={540 - 260 * spread} y1={820 + (lines.length - 1) * size * 1.05} x2={540 + 260 * spread} y2={820 + (lines.length - 1) * size * 1.05} stroke={GOLD} strokeWidth={2} />
      <Sparkle x={540 + 260 * spread} y={620} r={26} k={a * (0.5 + 0.5 * Math.sin(t * 5))} />
    </svg>
  );
};
