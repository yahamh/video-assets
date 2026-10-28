import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, IVORY, SANS, eased } from "../look";
import { SceneProps, str } from "./types";

type Place = { name?: string; x?: number; y?: number };

// A dark chart with gold grid lines: a dotted route draws itself from one place to another, with something travelling on it.
// Options: from and to ({name, x, y}, x and y from 0 to 1 across the chart), icon (parcel, ship, train, plane), label.
export const Journey: React.FC<SceneProps> = ({ t, dur, p }) => {
  const from = (p.from ?? {}) as Place;
  const to = (p.to ?? {}) as Place;
  const icon = str(p.icon, "parcel");
  const label = str(p.label, "");
  const X = (u: number | undefined, d: number) => 120 + (u ?? d) * 840;
  const Y = (u: number | undefined, d: number) => 420 + (u ?? d) * 820;
  const ax = X(from.x, 0.6);
  const ay = Y(from.y, 0.95);
  const bx = X(to.x, 0.4);
  const by = Y(to.y, 0.05);
  // a curve that bows out to one side
  const cx = (ax + bx) / 2 + (ay - by) * 0.35;
  const cy = (ay + by) / 2;
  const go = eased(t, 0.3, Math.max(0.8, dur - 0.4));
  const pt = (u: number) => [(1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx, (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by];
  const [ix, iy] = pt(go);
  const [jx, jy] = pt(Math.min(1, go + 0.01));
  const ang = (Math.atan2(jy - iy, jx - ix) * 180) / Math.PI;
  const pin = (x: number, y: number, name: string, k: number, below: boolean) => (
    <g opacity={k}>
      <circle cx={x} cy={y} r={34 * k} fill="none" stroke={GOLD} strokeWidth={2} opacity={0.6} />
      <circle cx={x} cy={y} r={12} fill={GOLD_LIGHT} />
      <text x={x} y={below ? y + 76 : y - 46} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} letterSpacing={4} fill={IVORY}>
        {name.toUpperCase()}
      </text>
    </g>
  );
  const pathD = `M${ax} ${ay} Q${cx} ${cy} ${bx} ${by}`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect width={1080} height={1920} fill={BG} />
      {/* chart grid, slightly curved like a globe */}
      {Array.from({ length: 11 }, (_, i) => (
        <path key={`v${i}`} d={`M${60 + i * 96} 300 Q${540 + (60 + i * 96 - 540) * 1.12} 830 ${60 + i * 96} 1360`} stroke={GOLD} strokeOpacity={0.14} strokeWidth={2} fill="none" />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <path key={`h${i}`} d={`M40 ${320 + i * 92} Q540 ${300 + i * 92} 1040 ${320 + i * 92}`} stroke={GOLD} strokeOpacity={0.14} strokeWidth={2} fill="none" />
      ))}
      {/* compass */}
      <g transform="translate(880 460)" opacity={0.7}>
        <circle r={56} fill="none" stroke={GOLD} strokeWidth={2} />
        <path d="M0 -70 L12 0 L0 70 L-12 0Z" fill={GOLD} opacity={0.8} />
        <path d="M-70 0 L0 10 L70 0 L0 -10Z" fill={GOLD} opacity={0.4} />
        <text y={-82} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={24} fill={GOLD_LIGHT}>
          N
        </text>
      </g>
      <path d={pathD} stroke={GOLD} strokeOpacity={0.25} strokeWidth={4} fill="none" strokeDasharray="2 16" strokeLinecap="round" />
      <mask id="jrMask">
        <path d={pathD} stroke="#fff" strokeWidth={40} fill="none" pathLength={1000} strokeDasharray={`${go * 1000} 1000`} />
      </mask>
      <path d={pathD} stroke={GOLD_LIGHT} strokeWidth={7} fill="none" strokeDasharray="2 16" strokeLinecap="round" mask="url(#jrMask)" />
      {pin(ax, ay, from.name ?? "", eased(t, 0, 0.3), true)}
      {pin(bx, by, to.name ?? "", 0.45 + 0.55 * eased(t, Math.max(0.5, dur - 0.9), dur - 0.5), false)}
      <g transform={`translate(${ix} ${iy}) rotate(${icon === "parcel" ? 0 : ang})`}>
        {icon === "parcel" && (
          <g>
            <rect x={-40} y={-32} width={80} height={64} fill="#86643f" stroke={GOLD_LIGHT} strokeWidth={3} />
            <line x1={0} y1={-32} x2={0} y2={32} stroke="#efe2c4" strokeWidth={5} />
            <line x1={-40} y1={0} x2={40} y2={0} stroke="#efe2c4" strokeWidth={5} />
          </g>
        )}
        {icon === "ship" && <path d="M-50 0 H50 L36 22 H-36Z M-20 0 V-26 H14 V0" fill="#0b0f1a" stroke={GOLD_LIGHT} strokeWidth={3} />}
        {icon === "train" && <path d="M-50 -24 H34 L50 0 V20 H-50Z" fill="#0b0f1a" stroke={GOLD_LIGHT} strokeWidth={3} />}
        {icon === "plane" && <path d="M-50 0 L50 -6 L58 0 L50 6Z M-8 -2 L-24 -40 H-12 L14 -2Z M-8 2 L-24 40 H-12 L14 2Z" fill={GOLD_LIGHT} />}
      </g>
      {label && (
        <text x={540} y={340} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={58} fill={GOLD_LIGHT} opacity={eased(t, 0.05, 0.4)}>
          {label}
        </text>
      )}
    </svg>
  );
};
