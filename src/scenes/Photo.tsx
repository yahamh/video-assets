import React from "react";
import { AbsoluteFill } from "remotion";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, IVORY, SANS, eased, popped } from "../look";
import { Spotlight } from "../art";
import { Card, cardSpot } from "../Card";
import { SceneProps, num, str } from "./types";

type Mark = { x: number; y: number; text: string; at?: number };

// A real render (or a view of the 3D file) on a white card, slowly pushing in. For lessons.
// Options: src (a file in public/renders), label (gold line at the top), size (default 820), focus ({x, y, k}: push in
// k times toward that point of the picture, for a close look at a detail), marks ([{x, y, text, at}]: x and y from 0 to 1
// across the picture; a dot and a tag appear at `at` seconds, by default one after another from 0.6 s; up to 4).
export const Photo: React.FC<SceneProps> = ({ t, dur, p, hook }) => {
  const src = str(p.src, "matthew-rose-render.webp");
  const label = hook ? "" : str(p.label, "");
  const marks = (Array.isArray(p.marks) ? (p.marks as Mark[]) : []).slice(0, 4);
  const focus = (p.focus ?? null) as { x?: number; y?: number; k?: number } | null;
  const { S, X, Y } = cardSpot(hook, num(p.size, 820));
  const o: [number, number] = focus ? [num(focus.x, 0.5), num(focus.y, 0.5)] : [0.5, 0.5];
  const zoom = focus ? 1 + (num(focus.k, 2) - 1) * eased(t, 0.15, Math.min(dur, 2.4)) : 1 + 0.07 * eased(t, 0, Math.max(1.5, dur));
  const a = hook ? 1 : popped(t, 0, 0.35);
  // where a point of the picture is on screen, with the zoom about the origin
  const at = (u: number, v: number) => [X + S * (o[0] + (u - o[0]) * zoom), Y + S * (o[1] + (v - o[1]) * zoom)];
  return (
    <AbsoluteFill style={{ background: BG }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="phBg" cx="0.5" cy="0.4" r="0.65">
            <stop offset="0" stopColor="#1d2440" />
            <stop offset="1" stopColor={BG} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#phBg)" />
        <Spotlight id="phSpot" x={540} bottom={1300} w={1100} k={0.35} />
      </svg>
      <Card src={src} x={X} y={Y} size={S} zoom={zoom} origin={o} opacity={a} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        {marks.map((m, i) => {
          const from = m.at ?? 0.6 + i * 0.7;
          const k = popped(t, from, from + 0.3);
          if (k <= 0) return null;
          const [px, py] = at(m.x, m.y);
          const left = m.x >= 0.5; // the tag sits on the side away from the point
          const w = Math.max(150, m.text.length * 21 + 50);
          const tx = left ? Math.max(40, px - 120 - w) : Math.min(1040 - w, px + 120);
          return (
            <g key={i} opacity={k}>
              <line x1={px} y1={py} x2={left ? tx + w : tx} y2={py} stroke={GOLD} strokeWidth={4} />
              <circle cx={px} cy={py} r={16 * k} fill={GOLD_LIGHT} stroke={BG} strokeWidth={5} />
              <rect x={tx} y={py - 36} width={w} height={72} rx={36} fill={BG} stroke={GOLD} strokeWidth={3} />
              <text x={tx + w / 2} y={py + 13} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={36} fill={GOLD_LIGHT}>
                {m.text}
              </text>
            </g>
          );
        })}
        {label && (
          <text x={540} y={Y - 50} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={54} fill={IVORY} opacity={eased(t, 0.1, 0.6)}>
            {label}
          </text>
        )}
      </svg>
    </AbsoluteFill>
  );
};
