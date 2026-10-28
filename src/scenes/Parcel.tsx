import React from "react";
import { DISPLAY, GOLD, GOLD_LIGHT, BG, RED, eased, popped, shake } from "../look";
import { Sparkle, Spotlight } from "../art";
import { SceneProps, num, str } from "./types";

// A plain brown parcel under one light on a dark table. Options: label (address), stamp (red word that slams on),
// stampAt (seconds), glow (light leaking out of the box), year (big gold text above), close (framed tight on the label).
export const Parcel: React.FC<SceneProps> = ({ t, dur, p }) => {
  const label = str(p.label, "London");
  const stampText = str(p.stamp, "");
  const stampAt = num(p.stampAt, 0.5);
  const year = str(p.year, "");
  const close = p.close === true;
  const enter = popped(t, 0, 0.6);
  const stampK = stampText ? popped(t, stampAt, stampAt + 0.12) : 0;
  const [sx, sy] = stampText ? shake(t, stampAt + 0.05, 16) : [0, 0];
  const T = 880 + (1 - enter) * 30;
  const pulse = 0.7 + 0.3 * Math.sin(t * 5);
  const rays = [];
  for (let i = 0; i < 9; i++) {
    const a = (-160 + i * 17.5) * (Math.PI / 180);
    const len = 260 + ((i * 53) % 140);
    rays.push(
      <line key={i} x1={570} y1={T + 70} x2={570 + Math.cos(a) * len} y2={T + 70 + Math.sin(a) * len} stroke={GOLD_LIGHT} strokeWidth={8 + (i % 3) * 7} strokeLinecap="round" opacity={0.28 * pulse} />,
    );
  }
  const zoom = close ? 1.75 : 1;
  const fx = close ? 470 : 540;
  const fy = close ? T + 260 : 960;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <radialGradient id="paGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe6a6" stopOpacity={0.85} />
          <stop offset="1" stopColor="#ffe6a6" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="paYear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1c4" />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={BG} />
      <g transform={`translate(${540 + sx} ${960 + sy}) scale(${zoom}) translate(${-fx} ${-fy})`}>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={45 + i * 90} y1={0} x2={45 + i * 90} y2={1250} stroke={GOLD} strokeWidth={2} opacity={0.08} />
        ))}
        <rect x={0} y={1250} width={1080} height={700} fill="#17110c" />
        <line x1={0} y1={1250} x2={1080} y2={1250} stroke={GOLD} strokeWidth={3} opacity={0.6} />
        <Spotlight id="paSpot" x={560} bottom={T + 380} w={760} k={0.9} />
        <ellipse cx={570} cy={T + 430} rx={330} ry={26} fill="#000" opacity={0.6} />
        {p.glow === true && (
          <g>
            <ellipse cx={570} cy={T + 60} rx={380} ry={280} fill="url(#paGlow)" opacity={0.55 * pulse} />
            {rays}
          </g>
        )}
        <polygon points={`290,${T + 120} 790,${T + 120} 850,${T + 40} 350,${T + 40}`} fill="#9a7650" stroke="#0a0705" strokeWidth={4} strokeLinejoin="round" />
        <rect x={290} y={T + 120} width={500} height={300} fill="#86643f" stroke="#0a0705" strokeWidth={4} />
        <polygon points={`790,${T + 120} 850,${T + 40} 850,${T + 340} 790,${T + 420}`} fill="#5c4329" stroke="#0a0705" strokeWidth={4} strokeLinejoin="round" />
        <g stroke="#efe2c4" strokeWidth={7} strokeLinecap="round">
          <line x1={540} y1={T + 120} x2={600} y2={T + 40} />
          <line x1={320} y1={T + 80} x2={820} y2={T + 80} />
          <line x1={540} y1={T + 120} x2={540} y2={T + 420} />
          <line x1={820} y1={T + 80} x2={820} y2={T + 380} />
        </g>
        <g transform={`translate(570 ${T + 80})`} fill="none" stroke="#efe2c4" strokeWidth={7} strokeLinecap="round">
          <ellipse cx={-26} cy={-14} rx={26} ry={14} transform="rotate(-15 -26 -14)" />
          <ellipse cx={26} cy={-14} rx={26} ry={14} transform="rotate(15 26 -14)" />
          <path d="M-4 4 L-24 34 M4 4 L22 36" />
        </g>
        <g transform={`translate(318 ${T + 176}) rotate(-4)`}>
          <rect width={196} height={120} fill="#f3ead6" stroke="#0a0705" strokeWidth={3} />
          <text x={16} y={36} fontFamily={DISPLAY} fontSize={22} fill="#3b3326" opacity={0.75}>
            To:
          </text>
          <text x={98} y={84} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={label.length > 9 ? 28 : 38} fill="#1d1712">
            {label}
          </text>
        </g>
        {[
          [610, "#2f6b4f"],
          [690, "#9e3a30"],
        ].map(([x, c], i) => (
          <g key={i} transform={`translate(${x} ${T + 146}) rotate(${i ? 4 : -2})`}>
            <rect width={66} height={78} fill="#f3ead6" stroke="#f3ead6" strokeWidth={6} strokeDasharray="4 4" />
            <rect x={6} y={6} width={54} height={66} fill={c as string} />
            <circle cx={33} cy={34} r={13} fill="#f3ead6" opacity={0.85} />
            <path d="M18 70 Q33 48 48 70Z" fill="#f3ead6" opacity={0.85} />
          </g>
        ))}
        {stampText && (
          <g transform={`translate(660 ${T + 330}) rotate(-9) scale(${2.2 - 1.2 * stampK})`} opacity={stampK}>
            <rect x={-140} y={-42} width={280} height={84} rx={8} fill="none" stroke={RED} strokeWidth={7} />
            <text x={0} y={15} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={stampText.length > 10 ? 32 : 40} letterSpacing={4} fill={RED}>
              {stampText.toUpperCase()}
            </text>
          </g>
        )}
        {p.glow === true && (
          <g>
            <Sparkle x={430} y={T + 42} r={34} k={0.5 + 0.5 * Math.sin(t * 4.1)} />
            <Sparkle x={760} y={T + 50} r={26} k={0.5 + 0.5 * Math.sin(t * 3.3 + 2)} />
            <Sparkle x={845} y={T + 160} r={22} k={0.5 + 0.5 * Math.sin(t * 3.7 + 4)} />
          </g>
        )}
      </g>
      {year && (
        <text x={540} y={640} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontWeight={700} fontSize={190} fill="url(#paYear)" opacity={eased(t, 0.05, 0.45)} letterSpacing={6 + 30 * (1 - eased(t, 0, 1.2))}>
          {year}
        </text>
      )}
    </svg>
  );
};
