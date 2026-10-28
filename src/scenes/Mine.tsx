import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, IVORY, SANS, eased, popped } from "../look";
import { RoughDiamond, Sparkle, Stars } from "../art";
import { SceneProps, num, str } from "./types";

// An open mine at night, drawn as gold contour lines. A glint shows in the pit, the view rushes in, and the rough stone appears.
// Options: place, year, carats (counts up under the stone), zoomAt (0..1 of the scene, when the view moves in), tone (rough stone tint).
export const Mine: React.FC<SceneProps> = ({ t, dur, p }) => {
  const place = str(p.place, "");
  const year = str(p.year, "");
  const carats = num(p.carats, 0);
  const zoomAt = num(p.zoomAt, 0.3) * dur;
  const glint = eased(t, 0.2, 0.6) * (0.75 + 0.25 * Math.sin(t * 9));
  const zoom = eased(t, zoomAt, zoomAt + 0.7);
  const reveal = popped(t, zoomAt + 0.45, zoomAt + 0.9);
  const count = Math.round(carats * eased(t, zoomAt + 0.6, zoomAt + 1.6));
  const gx = 452;
  const gy = 1206;
  const s = 1 + zoom * 3;
  const tx = gx + (540 - gx) * zoom;
  const ty = gy + (860 - gy) * zoom;
  const rings = 9;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <linearGradient id="miSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04060b" />
          <stop offset="1" stopColor="#1c2742" />
        </linearGradient>
        <radialGradient id="miHalo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#cfe3ff" stopOpacity={0.45} />
          <stop offset="1" stopColor="#cfe3ff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="miMoon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6ecd2" stopOpacity={0.4} />
          <stop offset="1" stopColor="#f6ecd2" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={BG} />
      <g transform={`translate(${tx} ${ty}) scale(${s}) translate(${-gx} ${-gy})`}>
        <rect width={1080} height={900} fill="url(#miSky)" />
        <Stars t={t} n={45} top={60} bottom={760} />
        <circle cx={790} cy={430} r={150} fill="url(#miMoon)" />
        <circle cx={790} cy={430} r={58} fill="#f6ecd2" />
        <path d="M0 860 Q200 800 420 845 T820 830 T1080 850 V920 H0Z" fill="#121a2c" />
        <rect y={900} width={1080} height={1020} fill="#0d121e" />
        {Array.from({ length: rings }, (_, i) => {
          const u = i / (rings - 1);
          return (
            <ellipse
              key={i}
              cx={540}
              cy={1110 + u * 150}
              rx={570 - u * 470}
              ry={215 - u * 180}
              fill={`rgb(${Math.round(22 - u * 16)},${Math.round(29 - u * 21)},${Math.round(48 - u * 36)})`}
              stroke={GOLD}
              strokeOpacity={0.75 - u * 0.45}
              strokeWidth={3}
            />
          );
        })}
        <g stroke={GOLD} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.9}>
          <path d="M150 930 L210 700 L270 930 M170 860 H250 M185 790 H235 M210 700 L300 930" />
          <circle cx={210} cy={696} r={26} fill={BG} />
          <line x1={210} y1={696} x2={300} y2={930} strokeWidth={2} />
        </g>
        {[
          [760, 905, 90],
          [870, 915, 70],
        ].map(([x, y, w], i) => (
          <g key={i}>
            <rect x={x} y={y - w * 0.6} width={w} height={w * 0.6} fill="#0b0f1a" stroke={GOLD} strokeOpacity={0.7} strokeWidth={2.5} />
            <path d={`M${x - 8} ${y - w * 0.6} L${x + w / 2} ${y - w * 0.95} L${x + w + 8} ${y - w * 0.6}Z`} fill="#0b0f1a" stroke={GOLD} strokeOpacity={0.7} strokeWidth={2.5} />
            <rect x={x + w * 0.35} y={y - w * 0.42} width={w * 0.3} height={w * 0.25} fill="#e9b95e" opacity={0.8} />
          </g>
        ))}
        <Sparkle x={gx} y={gy} r={40 * (1 - zoom * 0.7)} k={glint * (1 - reveal)} />
      </g>
      {reveal > 0 && (
        <g opacity={reveal}>
          <rect width={1080} height={1920} fill="#05070c" opacity={0.75} />
          <circle cx={540} cy={820} r={440} fill="url(#miHalo)" />
          <g transform={`translate(540 820) scale(${0.7 + 0.3 * reveal}) translate(-540 -820)`}>
            <RoughDiamond x={540} y={820} size={460} turn={Math.sin(t * 1.4)} />
          </g>
          <Sparkle x={460} y={720} r={48} k={0.5 + 0.5 * Math.sin(t * 4)} />
          <Sparkle x={650} y={860} r={32} k={0.5 + 0.5 * Math.sin(t * 3.2 + 1.5)} />
          {carats > 0 && (
            <g>
              <text x={540} y={1170} textAnchor="middle" fontFamily={DISPLAY} fontWeight={700} fontSize={150} fill={GOLD_LIGHT}>
                {count.toLocaleString("en-US")}
              </text>
              <text x={540} y={1230} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={36} letterSpacing={14} fill={IVORY}>
                CARATS
              </text>
            </g>
          )}
        </g>
      )}
      {(place || year) && (
        <text x={540} y={340} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={58} fill={GOLD_LIGHT} opacity={eased(t, 0.05, 0.4)}>
          {[place, year].filter(Boolean).join(", ")}
        </text>
      )}
    </svg>
  );
};
