import React from "react";
import { eased, DISPLAY, GOLD, IVORY } from "../look";
import { CutGem, MetalGradient, Pearl, Sparkle, shade } from "../art";
import { SceneProps, str } from "./types";

// One piece of jewelry, close up on velvet: a ring in its box, a necklace on a bust, earrings, a brooch or a tiara.
// Options: piece, shape (stone cut), tone (stone colour), metal (yellow, white, rose), velvet (colour), pearls (true for pearls
// instead of stones where the piece has small stones), label (small card under the piece).
export const Jewel: React.FC<SceneProps> = ({ t, p }) => {
  const piece = str(p.piece, "ring");
  const shape = str(p.shape, "round");
  const tone = str(p.tone, "#e9f1f6");
  const metal = str(p.metal, "yellow");
  const velvet = str(p.velvet, "#1b2647");
  const label = str(p.label, "");
  const pearls = p.pearls === true;
  const a = Math.min(1, 0.4 + eased(t, 0, 0.5));
  const sway = Math.sin(t * 1.3) * 2.2;
  const sweep = ((t * 0.35) % 1.4) - 0.2; // a band of light that crosses the piece every few seconds
  const tw = (ph: number, sp = 2.7) => 0.5 + 0.5 * Math.sin(t * sp + ph);

  const small = (x: number, y: number, r: number, k: number) =>
    pearls ? <Pearl key={k} x={x} y={y} r={r} /> : <CutGem key={k} x={x} y={y} size={r * 2} shape="round" tone={tone} />;

  let art: React.ReactNode = null;
  if (piece === "ring") {
    art = (
      <g>
        {/* open ring box */}
        <path d="M250 760 H830 L800 600 H280 Z" fill={shade(velvet, -0.35)} stroke="#15151f" strokeWidth={4} />
        <path d="M250 760 H830 V1240 H250 Z" fill={shade(velvet, -0.15)} stroke="#15151f" strokeWidth={4} />
        <path d="M290 1240 V1000 Q540 940 790 1000 V1240Z" fill={velvet} />
        <path d="M290 1000 Q540 940 790 1000" stroke="#000" strokeOpacity={0.35} strokeWidth={6} fill="none" />
        <path d="M290 1000 Q540 1060 790 1000" stroke="#000" strokeOpacity={0.35} strokeWidth={22} fill="none" />
        <g transform={`rotate(${sway} 540 1000)`}>
          <ellipse cx={540} cy={1010} rx={150} ry={64} fill="none" stroke="url(#jM)" strokeWidth={30} />
          <path d="M392 1010 A150 64 0 0 0 688 1010" fill="none" stroke="url(#jM)" strokeWidth={34} />
          {/* head and prongs */}
          <path d="M490 960 L515 860 H565 L590 960Z" fill="url(#jM)" stroke={shade("#8a6420", 0)} strokeOpacity={0.5} strokeWidth={3} />
          <CutGem x={540} y={830} size={170} shape={shape} tone={tone} />
          {[-62, -22, 22, 62].map((dx) => (
            <path key={dx} d={`M${540 + dx * 0.6} 890 L${540 + dx} 800`} stroke="url(#jM)" strokeWidth={10} strokeLinecap="round" />
          ))}
        </g>
      </g>
    );
  } else if (piece === "necklace") {
    const n = 23;
    const beads = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const x = 300 + u * 480;
      const y = 700 + Math.sin(u * Math.PI) * 330;
      beads.push(pearls ? <Pearl key={i} x={x} y={y} r={16} /> : <circle key={i} cx={x} cy={y} r={7} fill="url(#jM)" />);
    }
    art = (
      <g>
        <path d="M330 520 Q330 640 260 700 Q160 760 150 1300 H930 Q920 760 820 700 Q750 640 750 520Z" fill={velvet} stroke="#15151f" strokeWidth={4} />
        <path d="M330 520 Q540 600 750 520" fill="none" stroke="#000" strokeOpacity={0.25} strokeWidth={8} />
        <g transform={`rotate(${sway * 0.5} 540 700)`}>
          {pearls ? null : <path d="M300 700 Q540 1360 780 700" fill="none" stroke="url(#jM)" strokeWidth={6} />}
          {beads}
          <circle cx={540} cy={1040} r={14} fill="url(#jM)" />
          <CutGem x={540} y={1130} size={150} shape={shape === "round" ? "pear" : shape} tone={tone} rot={180} />
        </g>
      </g>
    );
  } else if (piece === "earrings") {
    art = (
      <g>
        {[380, 700].map((x, i) => (
          <g key={x} transform={`rotate(${sway * (i ? -1 : 1)} ${x} 640)`}>
            <path d={`M${x} 600 q30 -60 0 -90 q-24 -20 -36 10`} stroke="url(#jM)" strokeWidth={8} fill="none" strokeLinecap="round" />
            {small(x, 640, 26, 1)}
            <line x1={x} y1={666} x2={x} y2={720} stroke="url(#jM)" strokeWidth={6} />
            <CutGem x={x} y={820} size={150} shape={shape === "round" ? "pear" : shape} tone={tone} rot={180} />
          </g>
        ))}
      </g>
    );
  } else if (piece === "brooch") {
    const petals = [];
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      petals.push(small(540 + Math.cos(ang) * 150, 900 + Math.sin(ang) * 150, 34, i));
      petals.push(
        <path
          key={`l${i}`}
          d={`M540 900 Q${540 + Math.cos(ang + 0.3) * 120} ${900 + Math.sin(ang + 0.3) * 120} ${540 + Math.cos(ang) * 150} ${900 + Math.sin(ang) * 150}`}
          stroke="url(#jM)"
          strokeWidth={8}
          fill="none"
        />,
      );
    }
    art = (
      <g transform={`rotate(${sway} 540 900)`}>
        <circle cx={540} cy={900} r={200} fill="none" stroke="url(#jM)" strokeWidth={12} />
        {petals}
        <circle cx={540} cy={900} r={92} fill="url(#jM)" />
        <CutGem x={540} y={900} size={150} shape={shape} tone={tone} />
      </g>
    );
  } else {
    // tiara
    const peaks = [];
    for (let i = 0; i < 7; i++) {
      const u = i / 6;
      const x = 220 + u * 640;
      const base = 1060 - Math.sin(u * Math.PI) * 140;
      const h = 60 + Math.sin(u * Math.PI) * 190;
      peaks.push(
        <g key={i}>
          <path d={`M${x - 45} ${base} Q${x} ${base - h * 0.6} ${x} ${base - h} Q${x} ${base - h * 0.6} ${x + 45} ${base}`} stroke="url(#jM)" strokeWidth={9} fill="none" />
          {i === 3 ? <CutGem x={x} y={base - h - 10} size={130} shape={shape} tone={tone} /> : small(x, base - h - 4, 22 + Math.sin(u * Math.PI) * 12, i)}
        </g>,
      );
    }
    art = (
      <g transform={`rotate(${sway * 0.4} 540 1000)`}>
        <path d="M200 1080 Q540 860 880 1080" stroke="url(#jM)" strokeWidth={22} fill="none" />
        <path d="M200 1080 Q540 900 880 1080" stroke={shade(tone, 0.6)} strokeOpacity={0.6} strokeWidth={6} strokeDasharray="2 22" strokeLinecap="round" fill="none" />
        {peaks}
      </g>
    );
  }

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <MetalGradient id="jM" metal={metal} />
        <radialGradient id="jBg" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor={shade(velvet, 0.12)} />
          <stop offset="1" stopColor={shade(velvet, -0.6)} />
        </radialGradient>
        <linearGradient id="jSweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.22} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#jBg)" />
      <g opacity={a} transform={`translate(0 ${(1 - a) * 30})`}>{art}</g>
      <rect x={sweep * 1080 - 160} y={0} width={320} height={1920} fill="url(#jSweep)" transform={`rotate(14 ${sweep * 1080} 900)`} />
      <Sparkle x={500} y={790} r={40} k={a * tw(0)} />
      <Sparkle x={600} y={880} r={26} k={a * tw(2.2, 2.1)} />
      <Sparkle x={420} y={980} r={20} k={a * tw(4.1, 3.2)} />
      {label && (
        <g opacity={eased(t, 0.8, 1.5)}>
          <rect x={540 - Math.max(160, label.length * 13)} y={1100} width={Math.max(320, label.length * 26)} height={78} fill="#0a0e18" stroke={GOLD} strokeWidth={2} />
          <text x={540} y={1152} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={42} fill={IVORY}>
            {label}
          </text>
        </g>
      )}
    </svg>
  );
};
