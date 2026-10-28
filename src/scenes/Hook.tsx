import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, RED } from "../look";
import { CutGem, PearPearl, RoughDiamond, Sparkle, Spotlight } from "../art";
import { SceneProps, num, str } from "./types";

// The opening shot: the payoff of the story, big, already moving on the very first frame, so the video stops the scroll
// before a word is heard. The story's hook text sits above it (see HookText in Frame.tsx).
// Options: show ("parcel": an open parcel with the stone rising out of it, "rough", "gem", "pearl" (a pear-shaped pearl),
// "chest"), shape and tone (for gem; tone for pearl), label (address on the parcel), stamp (red word on the parcel or chest).
export const Hook: React.FC<SceneProps> = ({ t, p }) => {
  const show = str(p.show, "rough");
  const shape = str(p.shape, "cushion");
  const tone = str(p.tone, "#e9f1f6");
  const label = str(p.label, "London");
  const stamp = str(p.stamp, "");
  const size = num(p.size, show === "parcel" || show === "chest" ? 470 : 600);
  const bob = Math.sin(t * 2.2) * 10;
  const turn = Math.sin(t * 1.7);
  const pulse = 0.75 + 0.25 * Math.sin(t * 5.3);
  const cy = show === "parcel" || show === "chest" ? 1010 : 1060;
  const rays = [];
  for (let i = 0; i < 16; i++) {
    const a = ((i * 360) / 16 + t * 14) * (Math.PI / 180);
    const len = 520 + ((i * 97) % 260);
    rays.push(
      <polygon
        key={i}
        points={`540,${cy} ${540 + Math.cos(a - 0.05) * len},${cy + Math.sin(a - 0.05) * len} ${540 + Math.cos(a + 0.05) * len},${cy + Math.sin(a + 0.05) * len}`}
        fill={GOLD_LIGHT}
        opacity={(i % 2 ? 0.07 : 0.12) * pulse}
      />,
    );
  }
  const stone =
    show === "gem" ? (
      <CutGem x={540} y={cy + bob} size={size} shape={shape} tone={tone} />
    ) : show === "pearl" ? (
      <g transform={`rotate(${turn * 4} 540 ${cy - size * 0.55})`}>
        <line x1={540} y1={cy - size * 1.1} x2={540} y2={cy - size * 0.5} stroke={GOLD} strokeWidth={6} />
        <circle cx={540} cy={cy - size * 0.5} r={14} fill={GOLD} />
        <PearPearl x={540} y={cy + bob * 0.4} h={size} tone={p.tone ? tone : undefined} />
      </g>
    ) : (
      <RoughDiamond x={540} y={cy + bob} size={size} turn={turn} />
    );
  const B = 1250; // top of the box front
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <radialGradient id="hkGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3cf" stopOpacity={0.95} />
          <stop offset="0.45" stopColor={GOLD} stopOpacity={0.35} />
          <stop offset="1" stopColor={GOLD} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={BG} />
      {rays}
      <Spotlight id="hkSpot" x={540} bottom={1500} w={900} k={0.75} />
      <ellipse cx={540} cy={cy} rx={430 * pulse} ry={430 * pulse} fill="url(#hkGlow)" opacity={0.7} />
      {show === "parcel" && (
        <g>
          {/* back flap, then the stone rising out of the box, then the front of the box over its bottom */}
          <polygon points={`300,${B} 780,${B} 840,${B - 70} 360,${B - 70}`} fill="#5c4329" stroke="#0a0705" strokeWidth={4} strokeLinejoin="round" />
          <polygon points={`360,${B - 70} 840,${B - 70} 880,${B - 230} 400,${B - 230}`} fill="#9a7650" stroke="#0a0705" strokeWidth={4} strokeLinejoin="round" transform={`rotate(${-4 + Math.sin(t * 3) * 1.5} 600 ${B - 70})`} />
          {stone}
          <polygon points={`300,${B} 220,${B + 150} 300,${B + 40}`} fill="#9a7650" stroke="#0a0705" strokeWidth={4} strokeLinejoin="round" />
          <rect x={300} y={B} width={480} height={300} fill="#86643f" stroke="#0a0705" strokeWidth={4} />
          <polygon points={`780,${B} 840,${B - 70} 840,${B + 230} 780,${B + 300}`} fill="#5c4329" stroke="#0a0705" strokeWidth={4} strokeLinejoin="round" />
          <polygon points={`780,${B} 900,${B + 120} 840,${B - 70}`} fill="#a4805a" stroke="#0a0705" strokeWidth={4} strokeLinejoin="round" />
          <line x1={540} y1={B} x2={540} y2={B + 300} stroke="#efe2c4" strokeWidth={7} strokeLinecap="round" />
          <g transform={`translate(326 ${B + 70}) rotate(-4)`}>
            <rect width={196} height={120} fill="#f3ead6" stroke="#0a0705" strokeWidth={3} />
            <text x={16} y={36} fontFamily={DISPLAY} fontSize={22} fill="#3b3326" opacity={0.75}>
              To:
            </text>
            <text x={98} y={84} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={label.length > 9 ? 28 : 38} fill="#1d1712">
              {label}
            </text>
          </g>
          {[
            [600, "#2f6b4f"],
            [680, "#9e3a30"],
          ].map(([x, c], i) => (
            <g key={i} transform={`translate(${x} ${B + 40}) rotate(${i ? 4 : -2})`}>
              <rect width={66} height={78} fill="#f3ead6" stroke="#f3ead6" strokeWidth={6} strokeDasharray="4 4" />
              <rect x={6} y={6} width={54} height={66} fill={c as string} />
              <circle cx={33} cy={34} r={13} fill="#f3ead6" opacity={0.85} />
              <path d="M18 70 Q33 48 48 70Z" fill="#f3ead6" opacity={0.85} />
            </g>
          ))}
          {stamp && (
            <g transform={`translate(650 ${B + 215}) rotate(-9)`}>
              <rect x={-120} y={-36} width={240} height={72} rx={8} fill="none" stroke={RED} strokeWidth={6} />
              <text x={0} y={13} textAnchor="middle" fontFamily={DISPLAY} fontWeight={800} fontSize={stamp.length > 10 ? 28 : 36} letterSpacing={4} fill={RED}>
                {stamp.toUpperCase()}
              </text>
            </g>
          )}
        </g>
      )}
      {show === "chest" && (
        <g>
          <polygon points={`300,${B - 20} 780,${B - 20} 820,${B - 240} 340,${B - 240}`} fill="#3a1f14" stroke={GOLD} strokeWidth={4} strokeLinejoin="round" />
          {stone}
          <rect x={300} y={B - 20} width={480} height={300} rx={10} fill="#4a2a1a" stroke={GOLD} strokeWidth={5} />
          <rect x={300} y={B + 40} width={480} height={18} fill={GOLD} opacity={0.7} />
          <rect x={300} y={B + 200} width={480} height={18} fill={GOLD} opacity={0.7} />
        </g>
      )}
      {show !== "parcel" && show !== "chest" && stone}
      <Sparkle x={540 - size * 0.18} y={cy - size * 0.43 + bob} r={70 + 40 * Math.max(0, Math.sin(t * 5.2))} k={Math.max(0, Math.sin(t * 5.2))} />
      <Sparkle x={540 - size * 0.42} y={cy - size * 0.28 + bob} r={46} k={0.5 + 0.5 * Math.sin(t * 6.1)} />
      <Sparkle x={540 + size * 0.36} y={cy - size * 0.36 + bob} r={34} k={0.5 + 0.5 * Math.sin(t * 4.7 + 2)} />
      <Sparkle x={540 + size * 0.46} y={cy + size * 0.1 + bob} r={28} k={0.5 + 0.5 * Math.sin(t * 5.3 + 4)} />
      <Sparkle x={540 - size * 0.12} y={cy - size * 0.44 + bob} r={22} k={0.5 + 0.5 * Math.sin(t * 7.2 + 1)} />
    </svg>
  );
};
