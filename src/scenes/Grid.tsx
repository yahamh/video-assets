import React from "react";
import { AbsoluteFill } from "remotion";
import { BG, DISPLAY, GOLD_LIGHT, IVORY, eased, popped } from "../look";
import { Card } from "../Card";
import { SceneProps, str } from "./types";

// Two to four pictures side by side, each with a label under it, popping in one after another. For lessons
// (the same ring in three golds, the views of one piece). Options: srcs (files in public/renders), labels, label (top
// line; not with four pictures).
export const Grid: React.FC<SceneProps> = ({ t, p }) => {
  const srcs = (Array.isArray(p.srcs) ? (p.srcs as string[]) : []).slice(0, 4);
  const labels = Array.isArray(p.labels) ? (p.labels as string[]) : [];
  const label = str(p.label, "");
  const n = srcs.length;
  // two or three in a row, four as two over two; everything ends above the captions
  const S = n === 2 ? 470 : n === 3 ? 320 : 360;
  const spots =
    n === 2
      ? [[60, 520], [550, 520]]
      : n === 3
        ? [[30, 560], [380, 560], [730, 560]]
        : [[160, 310], [560, 310], [160, 750], [560, 750]];
  const top = n === 2 ? 450 : 480;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="grBg" cx="0.5" cy="0.4" r="0.65">
            <stop offset="0" stopColor="#1d2440" />
            <stop offset="1" stopColor={BG} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#grBg)" />
      </svg>
      {srcs.map((s, i) => {
        const k = popped(t, 0.1 + i * 0.3, 0.45 + i * 0.3);
        const [x, y] = spots[i];
        return <Card key={i} src={s} x={x} y={y + (1 - k) * 40} size={S} opacity={k} zoom={1 + 0.04 * eased(t, 0, 4)} />;
      })}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        {srcs.map((_, i) =>
          labels[i] ? (
            <text key={i} x={spots[i][0] + S / 2} y={spots[i][1] + S + 52} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontWeight={700} fontSize={n === 3 ? 40 : 44} fill={GOLD_LIGHT} opacity={popped(t, 0.3 + i * 0.3, 0.7 + i * 0.3)}>
              {labels[i]}
            </text>
          ) : null,
        )}
        {label && n < 4 && (
          <text x={540} y={top} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={54} fill={IVORY} opacity={eased(t, 0.1, 0.6)}>
            {label}
          </text>
        )}
      </svg>
    </AbsoluteFill>
  );
};
