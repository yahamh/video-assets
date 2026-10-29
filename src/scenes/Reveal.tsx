import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, RED, eased, popped, shake } from "../look";
import { CutGem, Egg, PearPearl, RoughDiamond, Sparkle, Spotlight } from "../art";
import { SceneProps, num, str } from "./types";

// A locked chest under a light. It opens to show what's inside, and a red word can slam on top.
// Options: item (rough, gem, glass, pearl, egg, empty), shape and tone (for gem or glass), openAt (seconds), stamp, stampAt,
// label, halo (a colour the item glows in, like "#ff6a2a"), light (the lamp's colour, like "#9b6bff" for ultraviolet),
// dark (true: the lamp is off).
export const Reveal: React.FC<SceneProps> = ({ t, p }) => {
  const item = str(p.item, "rough");
  const shape = str(p.shape, "round");
  const tone = str(p.tone, item === "glass" ? "#dcebe4" : "#e9f1f6");
  const openAt = num(p.openAt, 0.25);
  const stampText = str(p.stamp, "");
  const stampAt = num(p.stampAt, 1.2);
  const label = str(p.label, "");
  const halo = str(p.halo, "");
  const light = str(p.light, "");
  const dark = p.dark === true;
  const open = popped(t, openAt, openAt + 0.45);
  const stampK = stampText ? popped(t, stampAt, stampAt + 0.12) : 0;
  const [sx, sy] = stampText ? shake(t, stampAt + 0.05, 18) : [0, 0];
  const lidH = 170;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect width={1080} height={1920} fill={BG} />
      <g transform={`translate(${sx} ${sy})`}>
        <Spotlight id="rvSpot" x={540} bottom={1230} w={820} k={dark ? 0.06 : 0.85} color={light || undefined} />
        <rect x={0} y={1240} width={1080} height={700} fill="#120e0a" />
        <line x1={0} y1={1240} x2={1080} y2={1240} stroke={GOLD} strokeWidth={3} opacity={0.5} />
        <ellipse cx={540} cy={1240} rx={360} ry={26} fill="#000" opacity={0.6} />
        {/* chest body */}
        <rect x={240} y={940} width={600} height={300} rx={10} fill="#2a1d12" stroke={GOLD} strokeWidth={4} />
        <rect x={262} y={962} width={556} height={256} rx={6} fill="none" stroke={GOLD} strokeOpacity={0.5} strokeWidth={2} />
        {/* inside, seen when the lid lifts */}
        <path d={`M262 950 H818 L790 ${950 - 120 * open} H290Z`} fill="#3a0f1a" opacity={open} />
        <g opacity={open}>
          {halo && (
            <g>
              <defs>
                <radialGradient id="rvHalo" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor={halo} stopOpacity={0.9} />
                  <stop offset="1" stopColor={halo} stopOpacity={0} />
                </radialGradient>
              </defs>
              <ellipse cx={540} cy={850} rx={300 * (0.85 + 0.15 * Math.sin(t * 5))} ry={260 * (0.85 + 0.15 * Math.sin(t * 5))} fill="url(#rvHalo)" />
            </g>
          )}
          {item === "rough" && <RoughDiamond x={540} y={870 - open * 40} size={210} turn={Math.sin(t * 1.5)} />}
          {(item === "gem" || item === "glass") && <CutGem x={540} y={860 - open * 40} size={180} shape={shape} tone={tone} />}
          {item === "pearl" && <PearPearl x={540} y={850 - open * 40} h={190} />}
          {item === "egg" && <Egg x={540} y={800 - open * 40} h={230} turn={t * 0.5} />}
          {item === "empty" && <ellipse cx={540} cy={900} rx={90} ry={22} fill="#1d0710" />}
          {item !== "empty" && <Sparkle x={500} y={800} r={36} k={(0.5 + 0.5 * Math.sin(t * 4)) * (item === "glass" ? 0.4 : 1)} />}
        </g>
        {/* lid: from closed to swung up */}
        <g transform={`translate(0 ${-open * 150}) translate(540 ${940 - lidH * 0.35}) scale(1 ${1 - open * 0.5}) translate(-540 ${-(940 - lidH * 0.35)})`}>
          <path d={`M240 940 V${940 - lidH * 0.35} Q540 ${940 - lidH} 840 ${940 - lidH * 0.35} V940Z`} fill="#33241a" stroke={GOLD} strokeWidth={4} />
        </g>
        <rect x={510} y={1000} width={60} height={70} rx={6} fill={GOLD} />
        <circle cx={540} cy={1030} r={9} fill="#2a1d12" />
        <rect x={536} y={1030} width={8} height={22} fill="#2a1d12" />
        {[260, 820].map((x) => [960, 1220].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={7} fill={GOLD} />))}
        {stampText && (
          <g transform={`translate(540 860) rotate(-12) scale(${2.4 - 1.4 * stampK})`} opacity={stampK}>
            <rect x={-190} y={-62} width={380} height={124} rx={10} fill="none" stroke={RED} strokeWidth={10} />
            <text x={0} y={30} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={96} letterSpacing={10} fill={RED}>
              {stampText.toUpperCase()}
            </text>
          </g>
        )}
      </g>
      {label && (
        <text x={540} y={340} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={58} fill={GOLD_LIGHT} opacity={eased(t, 0.05, 0.4)}>
          {label}
        </text>
      )}
    </svg>
  );
};
