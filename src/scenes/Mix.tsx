import React from "react";
import { AbsoluteFill } from "remotion";
import { BG, DISPLAY, IVORY, SANS, eased, popped } from "../look";
import { Card } from "../Card";
import { SceneProps, str } from "./types";

type Part = { name: string; pct: number };

// Metal colours for the bar, by name; anything else is slate.
const COLOR: Record<string, string> = {
  gold: "#d9b45f",
  silver: "#c9ccd3",
  copper: "#c0703f",
  palladium: "#a7acb6",
  nickel: "#8f959d",
  zinc: "#9ba7ad",
  platinum: "#dfe3ea",
  aluminium: "#b7bcc4",
};

// What a metal is made of: a bar that fills part by part, with the percentages, under a render of the piece.
// For lessons. Options: parts ([{name, pct}], in the order they fill, up to 5), src (a file in public/renders, optional),
// label (line at the top).
export const Mix: React.FC<SceneProps> = ({ t, p }) => {
  const parts = (Array.isArray(p.parts) ? (p.parts as Part[]) : []).slice(0, 5);
  const src = str(p.src, "");
  const label = str(p.label, "");
  const total = parts.reduce((a, b) => a + b.pct, 0) || 1;
  const BX = 90;
  const BW = 900;
  const BY = src ? 1000 : 860;
  let x = BX;
  const segs = parts.map((part, i) => {
    const w = (part.pct / total) * BW;
    const seg = { ...part, x, w, k: eased(t, 0.25 + i * 0.35, 0.7 + i * 0.35), color: COLOR[part.name.toLowerCase()] ?? "#7d8796" };
    x += w;
    return seg;
  });
  const legend = segs.map((s) => `${s.name} ${s.pct}%`);
  const legendW = legend.reduce((a, b) => a + b.length * 19 + 70, 0);
  let lx = 540 - legendW / 2;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="mxBg" cx="0.5" cy="0.4" r="0.65">
            <stop offset="0" stopColor="#1d2440" />
            <stop offset="1" stopColor={BG} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#mxBg)" />
      </svg>
      {src && <Card src={src} x={240} y={350} size={600} zoom={1 + 0.05 * eased(t, 0, 4)} opacity={popped(t, 0, 0.3)} />}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        {label && (
          <text x={540} y={src ? 300 : 760} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={58} fill={IVORY} opacity={eased(t, 0.05, 0.5)}>
            {label}
          </text>
        )}
        <rect x={BX - 6} y={BY - 6} width={BW + 12} height={102} rx={20} fill="none" stroke={IVORY} strokeOpacity={0.35} strokeWidth={3} />
        {segs.map((s, i) => (
          <g key={i}>
            <rect x={s.x} y={BY} width={Math.max(0, s.w * s.k - 3)} height={90} rx={i === 0 ? 14 : 4} fill={s.color} />
            {s.w > 110 && s.k > 0.6 && (
              <text x={s.x + s.w / 2} y={BY + 60} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={44} fill={BG} opacity={(s.k - 0.6) / 0.4}>
                {s.pct}%
              </text>
            )}
          </g>
        ))}
        {segs.map((s, i) => {
          const w = legend[i].length * 19 + 70;
          const g = (
            <g key={`l${i}`} opacity={popped(t, 0.45 + i * 0.35, 0.8 + i * 0.35)}>
              <circle cx={lx + 16} cy={BY + 152} r={13} fill={s.color} />
              <text x={lx + 38} y={BY + 164} fontFamily={SANS} fontWeight={700} fontSize={34} fill={IVORY}>
                {legend[i]}
              </text>
            </g>
          );
          lx += w;
          return g;
        })}
      </svg>
    </AbsoluteFill>
  );
};
