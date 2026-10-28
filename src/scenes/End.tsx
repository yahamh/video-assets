import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, IVORY, SANS, popped } from "../look";
import { CutGem, Sparkle } from "../art";
import { SceneProps, str } from "./types";

// The last card: a stone, one line, and the account name.
export const End: React.FC<SceneProps> = ({ t, p }) => {
  const line = str(p.line, "A new jewelry story every day");
  const handle = str(p.handle, "@trygema");
  const a = popped(t, 0.05, 0.45);
  const b = popped(t, 0.3, 0.7);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <radialGradient id="enBg" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#1d2440" />
          <stop offset="1" stopColor={BG} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#enBg)" />
      <g opacity={a} transform={`translate(540 700) scale(${0.8 + 0.2 * a}) rotate(${(1 - a) * -20})`}>
        <CutGem x={0} y={0} size={220} shape="round" />
      </g>
      <Sparkle x={590} y={650} r={50} k={a * (0.5 + 0.5 * Math.sin(t * 4))} />
      <line x1={340} y1={900} x2={740} y2={900} stroke={GOLD} strokeWidth={2} opacity={a} />
      <text x={540} y={1000} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={64} fill={IVORY} opacity={a}>
        {line}
      </text>
      <text x={540} y={1110} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={76} letterSpacing={2} fill={GOLD_LIGHT} opacity={b}>
        {handle}
      </text>
    </svg>
  );
};
