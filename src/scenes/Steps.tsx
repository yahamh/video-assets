import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, IVORY, SANS, eased, popped } from "../look";
import { SceneProps, num, str } from "./types";

// A short numbered list of the steps of a process, with the current one lit in gold, the ones before it ticked and
// the ones after it dim. For lessons. Options: items (up to 6 short steps), active (index of the current step),
// label (small line above the list).
export const Steps: React.FC<SceneProps> = ({ t, p }) => {
  const items = (Array.isArray(p.items) ? (p.items as string[]) : []).slice(0, 6);
  const active = num(p.active, 0);
  const label = str(p.label, "");
  const top = 960 - (items.length * 130) / 2;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <radialGradient id="stpBg" cx="0.5" cy="0.4" r="0.65">
          <stop offset="0" stopColor="#1d2440" />
          <stop offset="1" stopColor={BG} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#stpBg)" />
      {label && (
        <text x={540} y={top - 70} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} letterSpacing={10} fill={IVORY} opacity={eased(t, 0, 0.4)}>
          {label.toUpperCase()}
        </text>
      )}
      {items.map((it, i) => {
        const y = top + i * 130;
        const on = i === active;
        const done = i < active;
        const k = popped(t, 0.05 * i, 0.3 + 0.05 * i);
        const glow = on ? 0.6 + 0.4 * Math.sin(t * 4) : 0;
        return (
          <g key={i} opacity={k * (on ? 1 : done ? 0.75 : 0.4)} transform={`translate(${on ? 12 * popped(t, 0.2, 0.5) : 0} 0)`}>
            {on && <rect x={110} y={y - 56} width={860} height={112} rx={56} fill={GOLD} opacity={0.12 + 0.06 * glow} stroke={GOLD} strokeWidth={3} />}
            <circle cx={180} cy={y} r={40} fill={on ? GOLD : BG} stroke={GOLD} strokeWidth={4} />
            {done ? (
              <path d={`M162 ${y} l12 13 l24 -27`} stroke={GOLD_LIGHT} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <text x={180} y={y + 15} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={on ? BG : GOLD_LIGHT}>
                {i + 1}
              </text>
            )}
            <text x={250} y={y + 17} fontFamily={on ? DISPLAY : SANS} fontStyle={on ? "italic" : "normal"} fontWeight={700} fontSize={on ? 52 : 44} fill={on ? GOLD_LIGHT : IVORY}>
              {it}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
