import React from "react";
import { eased, DISPLAY, GOLD } from "../look";
import { CutGem, MetalGradient, Pearl, Sparkle, shade } from "../art";
import { SceneProps, str } from "./types";

// A painted portrait in a gilt oval frame, with a brass name plate. No real likeness: a simple figure dressed for the part.
// Options: name, years, dress (colour), skin, hair (short, long, updo, curls, bald), hairColor, crown, tiara, pearls, beard,
// ruff (a lace collar), pendant (stone colour), bg (painting background colour).
export const Portrait: React.FC<SceneProps> = ({ t, p }) => {
  const name = str(p.name, "");
  const years = str(p.years, "");
  const dress = str(p.dress, "#3b2f5c");
  const skin = str(p.skin, "#e8c4a0");
  const hair = str(p.hair, "short");
  const hairColor = str(p.hairColor, "#3a2a1e");
  const bg = str(p.bg, "#4c5a45");
  const pendant = typeof p.pendant === "string" ? p.pendant : "";
  const a = Math.min(1, 0.4 + eased(t, 0, 0.5));
  const plate = eased(t, 0.3, 0.8);
  const sweep = ((t * 0.3) % 1.5) - 0.25;
  const cx = 540;
  const cy = 830;

  const hairBack =
    hair === "long" ? (
      <path d={`M${cx - 120} ${cy - 60} Q${cx - 150} ${cy + 160} ${cx - 120} ${cy + 240} H${cx + 120} Q${cx + 150} ${cy + 160} ${cx + 120} ${cy - 60}Z`} fill={hairColor} />
    ) : hair === "curls" ? (
      <g fill={hairColor}>
        {[-120, -90, 90, 120].map((dx, i) => (
          <circle key={i} cx={cx + dx} cy={cy + 40 + (i % 2) * 50} r={44} />
        ))}
      </g>
    ) : null;
  const hairTop =
    hair === "bald" ? null : hair === "updo" ? (
      <g fill={hairColor}>
        <ellipse cx={cx} cy={cy - 108} rx={100} ry={56} />
        <circle cx={cx} cy={cy - 175} r={52} />
      </g>
    ) : (
      <path d={`M${cx - 104} ${cy - 20} Q${cx - 110} ${cy - 150} ${cx} ${cy - 158} Q${cx + 110} ${cy - 150} ${cx + 104} ${cy - 20} Q${cx + 60} ${cy - 100} ${cx} ${cy - 104} Q${cx - 60} ${cy - 100} ${cx - 104} ${cy - 20}Z`} fill={hairColor} />
    );

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <MetalGradient id="poG" metal="yellow" vertical />
        <clipPath id="poOval">
          <ellipse cx={cx} cy={860} rx={300} ry={400} />
        </clipPath>
        <radialGradient id="poBg" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor={shade(bg, 0.15)} />
          <stop offset="1" stopColor={shade(bg, -0.5)} />
        </radialGradient>
        <linearGradient id="poSweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.16} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* damask wall */}
      <rect width={1080} height={1920} fill="#0d1322" />
      {Array.from({ length: 7 }, (_, r) =>
        Array.from({ length: 6 }, (_, c) => (
          <path
            key={`${r}${c}`}
            transform={`translate(${c * 200 + (r % 2) * 100 - 40} ${r * 260 + 60})`}
            d="M0 -50 Q30 -20 0 50 Q-30 -20 0 -50Z M-40 0 Q0 20 40 0 Q0 -20 -40 0Z"
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.14}
            strokeWidth={2}
          />
        )),
      )}
      <g opacity={a} transform={`translate(${cx} 860) scale(${0.94 + 0.06 * a}) translate(${-cx} -860)`}>
        <ellipse cx={cx} cy={872} rx={346} ry={446} fill="#2a1512" opacity={0.4} />
        <g clipPath="url(#poOval)">
          <rect x={0} y={400} width={1080} height={1000} fill="url(#poBg)" />
          {hairBack}
          {/* shoulders and dress */}
          <path d={`M${cx - 330} 1300 Q${cx - 300} ${cy + 200} ${cx - 120} ${cy + 170} L${cx + 120} ${cy + 170} Q${cx + 300} ${cy + 200} ${cx + 330} 1300Z`} fill={dress} />
          <path d={`M${cx - 120} ${cy + 170} Q${cx} ${cy + 300} ${cx + 120} ${cy + 170}`} fill={skin} />
          {p.ruff === true && (
            <g fill="#f4efe4" stroke="#b9b0a0" strokeWidth={2}>
              {Array.from({ length: 9 }, (_, i) => (
                <ellipse key={i} cx={cx - 160 + i * 40} cy={cy + 160} rx={30} ry={22} />
              ))}
            </g>
          )}
          <rect x={cx - 38} y={cy + 70} width={76} height={110} fill={shade(skin, -0.06)} />
          <ellipse cx={cx} cy={cy} rx={96} ry={122} fill={skin} />
          {hairTop}
          {p.beard === true && <path d={`M${cx - 92} ${cy + 10} Q${cx - 80} ${cy + 150} ${cx} ${cy + 150} Q${cx + 80} ${cy + 150} ${cx + 92} ${cy + 10} Q${cx} ${cy + 80} ${cx - 92} ${cy + 10}Z`} fill={hairColor} />}
          <circle cx={cx - 34} cy={cy - 8} r={7} fill="#2a2020" />
          <circle cx={cx + 34} cy={cy - 8} r={7} fill="#2a2020" />
          <ellipse cx={cx - 52} cy={cy + 34} rx={18} ry={9} fill="#d9826e" opacity={0.25} />
          <ellipse cx={cx + 52} cy={cy + 34} rx={18} ry={9} fill="#d9826e" opacity={0.25} />
          {p.pearls === true &&
            Array.from({ length: 15 }, (_, i) => {
              const u = i / 14;
              return <Pearl key={i} x={cx - 130 + u * 260} y={cy + 190 + Math.sin(u * Math.PI) * 70} r={12} />;
            })}
          {pendant && <CutGem x={cx} y={cy + 300} size={70} shape="pear" tone={pendant} rot={180} />}
          {p.crown === true && (
            <g>
              <path d={`M${cx - 100} ${cy - 130} L${cx - 110} ${cy - 230} L${cx - 55} ${cy - 175} L${cx} ${cy - 250} L${cx + 55} ${cy - 175} L${cx + 110} ${cy - 230} L${cx + 100} ${cy - 130}Z`} fill="url(#poG)" stroke="#8a6420" strokeWidth={3} />
              <circle cx={cx} cy={cy - 160} r={14} fill="#b3202e" />
              <circle cx={cx - 60} cy={cy - 150} r={9} fill="#2f5fa8" />
              <circle cx={cx + 60} cy={cy - 150} r={9} fill="#2f7a4f" />
            </g>
          )}
          {p.tiara === true && (
            <g>
              <path d={`M${cx - 90} ${cy - 120} Q${cx} ${cy - 210} ${cx + 90} ${cy - 120}`} fill="none" stroke="url(#poG)" strokeWidth={10} />
              {[-60, -30, 0, 30, 60].map((dx) => (
                <CutGem key={dx} x={cx + dx} y={cy - 160 - (60 - Math.abs(dx)) * 0.6} size={dx === 0 ? 38 : 22} shape="round" />
              ))}
            </g>
          )}
          <rect x={sweep * 1080 - 120} y={400} width={240} height={1000} fill="url(#poSweep)" transform={`rotate(12 ${sweep * 1080} 860)`} />
        </g>
        {/* gilt frame */}
        <ellipse cx={cx} cy={860} rx={318} ry={418} fill="none" stroke="url(#poG)" strokeWidth={40} />
        <ellipse cx={cx} cy={860} rx={340} ry={440} fill="none" stroke="#8a6420" strokeWidth={6} />
        <ellipse cx={cx} cy={860} rx={298} ry={398} fill="none" stroke="#8a6420" strokeWidth={4} />
        {Array.from({ length: 24 }, (_, i) => {
          const ang = (i / 24) * Math.PI * 2;
          return <circle key={i} cx={cx + Math.cos(ang) * 318} cy={860 + Math.sin(ang) * 418} r={7} fill="#f6dc8e" opacity={0.85} />;
        })}
      </g>
      {pendant || p.crown === true || p.tiara === true ? <Sparkle x={cx + 30} y={p.crown === true || p.tiara === true ? cy - 175 : cy + 290} r={30} k={a * (0.5 + 0.5 * Math.sin(t * 2.8))} /> : null}
      {(name || years) && (
        <g opacity={plate} transform="translate(540 1352)">
          <rect x={-250} y={-46} width={500} height={years ? 104 : 74} rx={6} fill="url(#poG)" stroke="#8a6420" strokeWidth={3} />
          <text x={0} y={2} textAnchor="middle" fontFamily={DISPLAY} fontWeight={600} fontSize={name.length > 22 ? 30 : 38} fill="#1d1712">
            {name}
          </text>
          {years && (
            <text x={0} y={42} textAnchor="middle" fontFamily={DISPLAY} fontStyle="italic" fontSize={28} fill="#1d1712">
              {years}
            </text>
          )}
        </g>
      )}
    </svg>
  );
};
