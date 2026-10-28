import React from "react";
import { BG, DISPLAY, GOLD, GOLD_LIGHT, IVORY, SANS, eased, popped, rand } from "../look";
import { Stars, Waves } from "../art";
import { Expression, Look, Person } from "../people/Person";
import { SceneProps, num, str } from "./types";

type Member = Look & { expression?: Expression; react?: { at: number; expression: Expression }; look?: number };

// The people of the story, from the waist up, in a setting. Options: cast (1 to 3 people, see people/Person.tsx),
// setting (mine, ship, palace, workshop, street, study, vault, plain), name and role (a name card), gasp (seconds:
// the first person leans back in surprise).
export const Cast: React.FC<SceneProps> = ({ t, p }) => {
  const cast = (Array.isArray(p.cast) ? (p.cast as Member[]) : [{}]).slice(0, 3);
  const setting = str(p.setting, "plain");
  const name = str(p.name, "");
  const role = str(p.role, "");
  const gaspAt = num(p.gasp, -1);
  const gasp = gaspAt >= 0 ? Math.sin(Math.min(1, Math.max(0, (t - gaspAt) / 0.5)) * Math.PI) : 0;
  const n = cast.length;
  const spots = n === 1 ? [[540, 1.18]] : n === 2 ? [[320, 0.86], [770, 0.86]] : [[250, 0.66], [540, 0.72], [830, 0.66]];
  const enter = popped(t, 0, 0.45);
  const card = eased(t, 0.25, 0.6);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect width={1080} height={1920} fill={BG} />
      <Setting kind={setting} t={t} />
      {cast.map((m, i) => {
        const [x, s] = spots[i];
        const ex = m.react && t >= m.react.at ? m.react.expression : m.expression ?? "neutral";
        const y = 1060 + (1 - Math.min(1, s)) * 260 + (1 - enter) * 60;
        return (
          <g key={i} transform={`translate(${x + (i === 0 ? gasp * -14 : 0)} ${y}) scale(${s * (n > 1 && i === 0 ? -1 : i === 2 ? -1 : 1)} ${s})`}>
            <Person look={m} expression={ex} t={t + i * 0.7} id={`c${i}`} lookDir={(m.look ?? 0) * (n > 1 && i === 0 ? -1 : i === 2 ? -1 : 1)} gasp={i === 0 ? gasp : 0} />
          </g>
        );
      })}
      {name && (
        <g opacity={card} transform={`translate(${(1 - card) * -40} 0)`}>
          <rect x={70} y={300} width={6} height={role ? 118 : 70} fill={GOLD} />
          <text x={96} y={352} fontFamily={DISPLAY} fontStyle="italic" fontWeight={700} fontSize={56} fill={GOLD_LIGHT}>
            {name}
          </text>
          {role && (
            <text x={98} y={404} fontFamily={SANS} fontWeight={700} fontSize={28} letterSpacing={6} fill={IVORY}>
              {role.toUpperCase()}
            </text>
          )}
        </g>
      )}
    </svg>
  );
};

const Setting: React.FC<{ kind: string; t: number }> = ({ kind, t }) => {
  const sky = (
    <defs>
      <linearGradient id="csSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#04060b" />
        <stop offset="1" stopColor="#1c2742" />
      </linearGradient>
      <radialGradient id="csGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffd98a" stopOpacity={0.4} />
        <stop offset="1" stopColor="#ffd98a" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="csPlain" cx="0.5" cy="0.4" r="0.65">
        <stop offset="0" stopColor="#222b4a" />
        <stop offset="1" stopColor={BG} />
      </radialGradient>
    </defs>
  );
  switch (kind) {
    case "mine":
      return (
        <g>
          {sky}
          <rect width={1080} height={1200} fill="url(#csSky)" />
          <Stars t={t} n={40} top={80} bottom={760} />
          <circle cx={830} cy={430} r={54} fill="#f6ecd2" />
          <path d="M0 880 Q260 820 520 860 T1080 850 V1920 H0Z" fill="#0d121e" />
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse key={i} cx={540} cy={1250 + i * 40} rx={620 - i * 80} ry={240 - i * 30} fill="none" stroke={GOLD} strokeOpacity={0.5 - i * 0.07} strokeWidth={3} />
          ))}
          <g stroke={GOLD} strokeWidth={4} fill="none" opacity={0.8}>
            <path d="M90 880 L150 640 L210 880 M110 810 H190 M125 740 H175 M150 640 L240 880" />
            <circle cx={150} cy={636} r={24} fill={BG} />
          </g>
        </g>
      );
    case "ship":
      return (
        <g>
          {sky}
          <rect width={1080} height={1100} fill="url(#csSky)" />
          <Stars t={t} n={40} top={80} bottom={760} />
          <circle cx={840} cy={420} r={58} fill="#f6ecd2" />
          <Waves top={880} bottom={1200} shift={t * 60} color="#0c1424" stroke={GOLD} rowGap={60} arc={56} />
          <rect y={1150} width={1080} height={800} fill="#120e0a" />
          {[0, 1, 2].map((i) => (
            <line key={i} x1={0} y1={1000 + i * 50} x2={1080} y2={1000 + i * 50} stroke={GOLD} strokeWidth={6} opacity={0.7} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={i} x1={60 + i * 110} y1={1000} x2={60 + i * 110} y2={1150} stroke={GOLD} strokeWidth={5} opacity={0.6} />
          ))}
        </g>
      );
    case "palace":
      return (
        <g>
          <rect width={1080} height={1920} fill="#170a10" />
          {[120, 380, 700, 960].map((x) => (
            <g key={x}>
              <rect x={x - 40} y={0} width={80} height={1920} fill="#24101a" stroke={GOLD} strokeOpacity={0.6} strokeWidth={3} />
              <line x1={x - 20} y1={0} x2={x - 20} y2={1920} stroke={GOLD} strokeOpacity={0.25} strokeWidth={2} />
              <line x1={x + 20} y1={0} x2={x + 20} y2={1920} stroke={GOLD} strokeOpacity={0.25} strokeWidth={2} />
            </g>
          ))}
          <circle cx={540} cy={360} r={260} fill="url(#csGlow)" />
          {sky}
          <g stroke={GOLD} strokeWidth={3} fill="none" opacity={0.85}>
            <path d="M540 120 V250 M440 260 Q540 340 640 260 M440 260 H640" />
            {[-80, -40, 0, 40, 80].map((x) => (
              <circle key={x} cx={540 + x} cy={300 + Math.abs(x) * -0.3} r={8} fill="#ffe2a0" stroke="none" opacity={0.6 + 0.4 * Math.sin(t * 3 + x)} />
            ))}
          </g>
        </g>
      );
    case "workshop":
      return (
        <g>
          {sky}
          <rect width={1080} height={1920} fill="#0e0b09" />
          <rect x={160} y={300} width={760} height={600} fill="url(#csSky)" />
          <Stars t={t} n={18} top={320} bottom={520} />
          {[
            [160, 150, 600],
            [310, 140, 560],
            [450, 160, 620],
            [610, 150, 580],
            [760, 160, 610],
          ].map(([x, w, top], i) => (
            <path key={i} d={`M${x} 900 V${top + 60} L${x + w / 2} ${top - 30} L${x + w} ${top + 60} V900Z`} fill="#0a0e18" stroke={GOLD} strokeOpacity={0.5} strokeWidth={2.5} />
          ))}
          <rect x={160} y={300} width={760} height={600} fill="none" stroke={GOLD} strokeWidth={6} />
          <line x1={540} y1={300} x2={540} y2={900} stroke={GOLD} strokeWidth={4} />
          <circle cx={900} cy={1000} r={300} fill="url(#csGlow)" />
        </g>
      );
    case "street":
      return (
        <g>
          {sky}
          <rect width={1080} height={1920} fill="url(#csSky)" />
          <Stars t={t} n={25} top={80} bottom={500} />
          <path d="M0 640 H160 V540 H340 V600 H460 V480 H620 V560 H760 V510 H900 V600 H1080 V1920 H0Z" fill="#0b0f1a" stroke={GOLD} strokeOpacity={0.35} strokeWidth={2} />
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={50 + (i % 5) * 210 + rand(i) * 40} y={680 + Math.floor(i / 5) * 180} width={50} height={74} fill="#e9b95e" opacity={rand(i + 3) > 0.4 ? 0.7 : 0.1} />
          ))}
          <circle cx={170} cy={760} r={240} fill="url(#csGlow)" />
          <rect x={160} y={780} width={14} height={1200} fill="#07090f" />
          <rect x={150} y={736} width={34} height={44} fill="#ffe2a0" />
        </g>
      );
    case "study":
      return (
        <g>
          {sky}
          <rect width={1080} height={1920} fill="#100c0a" />
          {[0, 1, 2, 3, 4].map((r) => (
            <g key={r}>
              <line x1={60} y1={420 + r * 190} x2={1020} y2={420 + r * 190} stroke={GOLD} strokeOpacity={0.5} strokeWidth={4} />
              {Array.from({ length: 22 }, (_, i) => {
                const w = 26 + rand(r * 30 + i) * 22;
                const h = 110 + rand(r * 30 + i + 9) * 60;
                const x = 70 + i * 43;
                return <rect key={i} x={x} y={420 + r * 190 - h} width={w} height={h} fill={["#3a1a1e", "#1d2a3a", "#2f2a1a", "#1e2e24"][(r + i) % 4]} stroke={GOLD} strokeOpacity={0.25} strokeWidth={1.5} />;
              })}
            </g>
          ))}
          <circle cx={820} cy={900} r={380} fill="url(#csGlow)" />
        </g>
      );
    case "vault":
      return (
        <g>
          <rect width={1080} height={1920} fill="#0c0f16" />
          <circle cx={540} cy={760} r={420} fill="#151b28" stroke={GOLD} strokeOpacity={0.6} strokeWidth={6} />
          <circle cx={540} cy={760} r={340} fill="none" stroke={GOLD} strokeOpacity={0.4} strokeWidth={3} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={540 + Math.cos(a) * 380} cy={760 + Math.sin(a) * 380} r={12} fill={GOLD} opacity={0.6} />;
          })}
        </g>
      );
    default:
      return (
        <g>
          {sky}
          <rect width={1080} height={1920} fill="url(#csPlain)" />
        </g>
      );
  }
};
