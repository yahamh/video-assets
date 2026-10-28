import React from "react";
import { AbsoluteFill } from "remotion";
import { BG, GOLD, GOLD_LIGHT, IVORY, SANS, eased, popped } from "../look";
import { Spotlight } from "../art";
import { Card, cardSpot } from "../Card";
import { SceneProps, num, str } from "./types";

// The 3D file (or a CAD screenshot) and its render: the render wipes in over the file from left to right. For lessons,
// and the best first scene of one. Options: before and after (files in public/renders), at (seconds when the wipe
// starts; right away on the first scene), beforeLabel (default "3D file"), afterLabel (default "Render").
export const Compare: React.FC<SceneProps> = ({ t, dur, p, hook }) => {
  const before = str(p.before, "matthew-rose-input.webp");
  const after = str(p.after, "matthew-rose-render.webp");
  const start = num(p.at, hook ? 0.15 : Math.min(1.2, dur * 0.35));
  const w = eased(t, start, start + 0.9);
  const { S, X, Y } = cardSpot(hook);
  const zoom = 1 + 0.05 * eased(t, 0, Math.max(1.5, dur));
  // a tag in the top corner of the card: the file's on the left, the render's on the right
  const tag = (text: string, right: boolean, k: number) => {
    const tw = text.length * 22 + 64;
    const x = right ? X + S - 24 - tw : X + 24;
    return (
      <g opacity={k}>
        <rect x={x} y={Y + 24} width={tw} height={60} rx={30} fill={right ? GOLD : BG} stroke={GOLD} strokeWidth={3} />
        <text x={x + tw / 2} y={Y + 65} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={28} letterSpacing={4} fill={right ? BG : IVORY}>
          {text.toUpperCase()}
        </text>
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ background: BG }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="cmBg" cx="0.5" cy="0.4" r="0.65">
            <stop offset="0" stopColor="#1d2440" />
            <stop offset="1" stopColor={BG} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#cmBg)" />
        <Spotlight id="cmSpot" x={540} bottom={1300} w={1100} k={0.35} />
      </svg>
      <Card src={before} x={X} y={Y} size={S} zoom={zoom} opacity={hook ? 1 : popped(t, 0, 0.3)} />
      {w > 0 && <Card src={after} x={X} y={Y} size={S} zoom={zoom} clip={w} />}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        {w > 0 && w < 1 && <rect x={X + S * w - 4} y={Y - 10} width={8} height={S + 20} rx={4} fill={GOLD_LIGHT} />}
        {tag(str(p.beforeLabel, "3D file"), false, (hook ? 1 : popped(t, 0.1, 0.4)) * (1 - w))}
        {tag(str(p.afterLabel, "Render"), true, popped(t, start + 0.5, start + 0.9))}
      </svg>
    </AbsoluteFill>
  );
};
