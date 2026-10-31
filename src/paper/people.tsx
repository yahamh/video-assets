import React from "react";
import { rand } from "../look";
import type { Look, Expression } from "../people/Person";
import { CORAL, CREAM, INK, LILAC, LIME, MINT, PINK, SKY, SUN, metal, tint } from "./kit";
import { Gem, Pearl, Rough, Carrot } from "./things";

// People in the paper look: whole figures cut from flat colored paper, standing on the ground at (0, 0), about
// 600 tall. Simple friendly faces, never a likeness: clothes, hair and hats say who they are. The options are the
// ones the drawn people take (src/people/Person.tsx), plus outfit "casual" and props "ringbox", "shovel", "carrot".

export type PLook = Omit<Look, "outfit" | "prop"> & { outfit?: Look["outfit"] | "casual"; prop?: Look["prop"] | "ringbox" | "shovel" | "carrot" };

export const PaperPerson: React.FC<{ look: PLook; expression: Expression; t: number; seed?: number; gasp?: number; flip?: boolean; id?: string }> = ({
  look,
  expression,
  t,
  seed = 1,
  gasp = 0,
  flip,
  id = "pp",
}) => {
  const skin = look.skin ?? "#e8b896";
  const hairColor = look.old ? "#c9c3b8" : look.hairColor ?? "#4a3326";
  const outfit = look.outfit ?? "suit";
  const cloth = look.outfitColor ?? ({ royal: "#c8314a", apron: SKY, miner: "#3f6fb5", dress: PINK, gown: LILAC, uniform: "#2f4f8f", casual: MINT } as Record<string, string>)[outfit] ?? "#3a4a6a";
  const accent = look.accent ?? CORAL;
  const hair = look.hair ?? "short";
  const hat = look.hat ?? "none";
  const facial = look.facial ?? "none";
  const prop = look.prop ?? "none";
  const ex = expression;
  const breathe = 1 + 0.012 * Math.sin(t * 2.2 + seed);
  const sway = Math.sin(t * 1.1 + seed) * 1.5;
  const hop = gasp > 0 ? Math.sin(Math.min(1, gasp) * Math.PI) * 30 : 0;
  const blink = ((t + seed * 0.7) % 3.3) > 3.18 ? 0.15 : 1;
  const longSkirt = outfit === "gown" || outfit === "royal";
  const skirt = outfit === "dress" || longSkirt;
  const legColor = outfit === "casual" ? "#3d5a8a" : skirt ? skin : tint(cloth, -0.3);
  const hold = prop !== "none";
  const handR: [number, number] = hold ? [118, -330] : [92, -235];
  const handL: [number, number] = [-92, -235];

  // the body, from the shoulders down
  const torso = `M-96 -440 Q-112 -330 -84 -235 H84 Q112 -330 96 -440 Q60 -462 0 -462 Q-60 -462 -96 -440Z`;
  const clothes = (
    <g>
      {/* legs and shoes */}
      {!longSkirt && (
        <g>
          <rect x={-56} y={-250} width={46} height={235} rx={18} fill={legColor} />
          <rect x={10} y={-250} width={46} height={235} rx={18} fill={tint(legColor, -0.08)} />
        </g>
      )}
      <ellipse cx={-36} cy={-10} rx={36} ry={16} fill={INK} />
      <ellipse cx={36} cy={-10} rx={36} ry={16} fill={INK} />
      {/* skirts and long coats */}
      {skirt && (
        <path
          d={longSkirt ? `M-84 -250 Q-150 -100 -165 -6 H165 Q150 -100 84 -250Z` : `M-84 -250 Q-140 -170 -150 -90 H150 Q140 -170 84 -250Z`}
          fill={cloth}
        />
      )}
      {outfit === "coat" && <path d="M-92 -250 L-112 -95 H112 L92 -250Z" fill={cloth} />}
      <path d={torso} fill={cloth} />
      {/* details */}
      {(outfit === "suit" || outfit === "coat" || outfit === "uniform") && (
        <g>
          <path d="M-34 -456 L0 -360 L34 -456Z" fill={CREAM} />
          {outfit !== "uniform" && <path d="M-9 -440 L0 -350 L9 -440Z" fill={accent} />}
          <path d="M-34 -456 L0 -360 M34 -456 L0 -360" stroke={tint(cloth, -0.3)} strokeWidth={5} />
          {outfit === "uniform" &&
            [-400, -360, -320, -280].map((y) => <circle key={y} cx={0} cy={y} r={7} fill={SUN} />)}
          {outfit === "uniform" && <rect x={-118} y={-452} width={44} height={14} rx={6} fill={SUN} />}
          {outfit === "uniform" && <rect x={74} y={-452} width={44} height={14} rx={6} fill={SUN} />}
        </g>
      )}
      {outfit === "royal" && (
        <g>
          <path d="M-130 -440 Q0 -500 130 -440 Q140 -380 100 -360 Q0 -400 -100 -360 Q-140 -380 -130 -440Z" fill={CREAM} />
          {[-90, -50, -10, 30, 70, -70, 10, 50].map((x, i) => (
            <path key={i} d={`M${x} ${-430 + (i > 4 ? 26 : 0)} l4 10 l-4 -2 l-4 2Z`} fill={INK} />
          ))}
          <path d="M-40 -250 Q-60 -120 -70 -6 M40 -250 Q60 -120 70 -6" stroke={SUN} strokeWidth={6} fill="none" />
        </g>
      )}
      {outfit === "apron" && <path d="M-62 -400 H62 L72 -150 H-72Z" fill={CREAM} />}
      {outfit === "apron" && <path d="M-62 -400 L-90 -450 M62 -400 L90 -450" stroke={CREAM} strokeWidth={8} />}
      {outfit === "miner" && <path d="M-60 -380 H60 V-235 H-60Z" fill={tint(cloth, -0.15)} />}
      {outfit === "casual" && <path d="M-40 -458 Q0 -420 40 -458" stroke={tint(cloth, -0.25)} strokeWidth={8} fill="none" />}
      {outfit === "dress" && <path d="M-84 -250 H84" stroke={tint(cloth, -0.25)} strokeWidth={10} />}
      {(outfit === "gown" || outfit === "dress") && <path d="M-50 -458 Q0 -410 50 -458" stroke={CREAM} strokeWidth={6} fill="none" opacity={0.7} />}
    </g>
  );

  // arms
  const sleeve = outfit === "apron" ? SKY : outfit === "royal" ? cloth : tint(cloth, -0.05);
  const arm = (from: [number, number], to: [number, number], k: string) => (
    <g key={k}>
      <path d={`M${from[0]} ${from[1]} Q${(from[0] + to[0]) / 2 + (to[0] > 0 ? 18 : -18)} ${(from[1] + to[1]) / 2} ${to[0]} ${to[1]}`} stroke={sleeve} strokeWidth={40} strokeLinecap="round" fill="none" />
      <circle cx={to[0]} cy={to[1]} r={21} fill={skin} />
    </g>
  );

  // the head
  const hx = 0, hy = -540;
  const eyeY = hy + 4;
  const mouth = (() => {
    const y = hy + 34;
    if (ex === "surprised" || gasp > 0.05) return <ellipse cx={hx} cy={y + 2} rx={9} ry={12} fill={INK} />;
    if (ex === "worried") return <path d={`M${hx - 14} ${y + 6} Q${hx} ${y - 4} ${hx + 14} ${y + 6}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
    if (ex === "focused" || ex === "neutral") return <path d={`M${hx - 12} ${y} H${hx + 12}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />;
    if (ex === "sly") return <path d={`M${hx - 14} ${y} Q${hx + 4} ${y + 10} ${hx + 16} ${y - 6}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
    return <path d={`M${hx - 18} ${y - 2} Q${hx} ${y + 18} ${hx + 18} ${y - 2}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
  })();
  const brow = { neutral: 0, smile: -3, surprised: -10, worried: 4, focused: 3, proud: -4, sly: 2 }[ex] ?? 0;
  const head = (
    <g>
      {/* hair behind the head */}
      {hair === "long" && <path d={`M${hx - 70} ${hy - 20} Q${hx - 92} ${hy + 90} ${hx - 70} ${hy + 140} H${hx + 70} Q${hx + 92} ${hy + 90} ${hx + 70} ${hy - 20}Z`} fill={hairColor} />}
      {hair === "curly" &&
        Array.from({ length: 11 }, (_, i) => {
          const a = Math.PI * (0.9 + (i / 10) * 1.2);
          return <circle key={i} cx={hx + Math.cos(a) * 66} cy={hy - 6 + Math.sin(a) * 66} r={26} fill={hairColor} />;
        })}
      <rect x={hx - 20} y={hy + 50} width={40} height={40} fill={tint(skin, -0.12)} />
      <circle cx={hx - 64} cy={hy + 6} r={14} fill={tint(skin, -0.06)} />
      <circle cx={hx + 64} cy={hy + 6} r={14} fill={tint(skin, -0.06)} />
      <circle cx={hx} cy={hy} r={64} fill={skin} />
      {/* hair on top */}
      {hair === "short" && <path d={`M${hx - 66} ${hy - 4} Q${hx - 64} ${hy - 76} ${hx} ${hy - 72} Q${hx + 60} ${hy - 74} ${hx + 66} ${hy - 6} Q${hx + 40} ${hy - 40} ${hx} ${hy - 44} Q${hx - 40} ${hy - 44} ${hx - 66} ${hy - 4}Z`} fill={hairColor} />}
      {hair === "side" && <path d={`M${hx - 66} ${hy + 2} Q${hx - 70} ${hy - 76} ${hx + 10} ${hy - 70} Q${hx + 66} ${hy - 66} ${hx + 66} ${hy - 4} Q${hx + 20} ${hy - 50} ${hx - 30} ${hy - 30} Q${hx - 52} ${hy - 20} ${hx - 66} ${hy + 2}Z`} fill={hairColor} />}
      {hair === "slick" && <path d={`M${hx - 64} ${hy - 10} Q${hx} ${hy - 90} ${hx + 64} ${hy - 10} Q${hx} ${hy - 50} ${hx - 64} ${hy - 10}Z`} fill={hairColor} />}
      {(hair === "long" || hair === "updo" || hair === "curly") && <path d={`M${hx - 66} ${hy + 4} Q${hx - 60} ${hy - 78} ${hx} ${hy - 72} Q${hx + 60} ${hy - 78} ${hx + 66} ${hy + 4} Q${hx + 30} ${hy - 46} ${hx} ${hy - 40} Q${hx - 30} ${hy - 46} ${hx - 66} ${hy + 4}Z`} fill={hairColor} />}
      {hair === "updo" && <circle cx={hx} cy={hy - 82} r={34} fill={hairColor} />}
      {/* face */}
      <ellipse cx={hx - 24} cy={eyeY} rx={7} ry={9 * blink * (ex === "surprised" ? 1.3 : 1)} fill={INK} />
      <ellipse cx={hx + 24} cy={eyeY} rx={7} ry={9 * blink * (ex === "surprised" ? 1.3 : 1)} fill={INK} />
      <path d={`M${hx - 36} ${eyeY - 22 + brow} q12 -7 24 0 M${hx + 12} ${eyeY - 22 + brow} q12 -7 24 0`} stroke={look.old ? "#bdb6aa" : hairColor} strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx={hx - 40} cy={hy + 26} r={11} fill={PINK} opacity={0.35} />
      <circle cx={hx + 40} cy={hy + 26} r={11} fill={PINK} opacity={0.35} />
      {facial === "beard" || facial === "fullbeard" ? (
        <path d={`M${hx - 58} ${hy + 10} Q${hx - 50} ${hy + (facial === "fullbeard" ? 110 : 84)} ${hx} ${hy + (facial === "fullbeard" ? 116 : 88)} Q${hx + 50} ${hy + (facial === "fullbeard" ? 110 : 84)} ${hx + 58} ${hy + 10} Q${hx + 30} ${hy + 46} ${hx} ${hy + 44} Q${hx - 30} ${hy + 46} ${hx - 58} ${hy + 10}Z`} fill={hairColor} />
      ) : null}
      {mouth}
      {(facial === "mustache" || facial === "beard" || facial === "fullbeard") && <path d={`M${hx - 22} ${hy + 26} Q${hx} ${hy + 14} ${hx + 22} ${hy + 26} Q${hx} ${hy + 22} ${hx - 22} ${hy + 26}Z`} fill={hairColor} stroke={hairColor} strokeWidth={6} strokeLinejoin="round" />}
      {facial === "handlebar" && <path d={`M${hx - 34} ${hy + 14} Q${hx - 20} ${hy + 30} ${hx} ${hy + 22} Q${hx + 20} ${hy + 30} ${hx + 34} ${hy + 14}`} stroke={hairColor} strokeWidth={8} fill="none" strokeLinecap="round" />}
      {facial === "walrus" && <path d={`M${hx - 30} ${hy + 34} Q${hx} ${hy + 8} ${hx + 30} ${hy + 34}Z`} fill={hairColor} />}
      {/* glasses */}
      {look.glasses === "round" && <path d={`M${hx - 42} ${eyeY} a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 M${hx + 6} ${eyeY} a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 M${hx - 6} ${eyeY} h12`} stroke={INK} strokeWidth={4} fill="none" />}
      {look.glasses === "monocle" && <circle cx={hx + 24} cy={eyeY} r={18} stroke={SUN} strokeWidth={4} fill="none" />}
      {look.glasses === "loupe" && (
        <g>
          <circle cx={hx + 24} cy={eyeY} r={19} fill="#d6e8f1" opacity={0.75} />
          <circle cx={hx + 24} cy={eyeY} r={19} fill="none" stroke="#6f757c" strokeWidth={6} />
          <path d={`M${hx + 14} ${eyeY - 8} q6 -6 14 -6`} stroke={CREAM} strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      )}
      {/* hats */}
      {hat === "bowler" && <path d={`M${hx - 84} ${hy - 40} H${hx + 84} Q${hx + 60} ${hy - 36} ${hx + 56} ${hy - 50} Q${hx + 50} ${hy - 124} ${hx} ${hy - 124} Q${hx - 50} ${hy - 124} ${hx - 56} ${hy - 50} Q${hx - 60} ${hy - 36} ${hx - 84} ${hy - 40}Z`} fill={INK} />}
      {hat === "top" && <path d={`M${hx - 84} ${hy - 44} H${hx + 84} V${hy - 56} H${hx + 54} V${hy - 170} H${hx - 54} V${hy - 56} H${hx - 84}Z`} fill={INK} />}
      {hat === "cap" && <path d={`M${hx - 66} ${hy - 30} Q${hx - 60} ${hy - 96} ${hx} ${hy - 96} Q${hx + 60} ${hy - 96} ${hx + 66} ${hy - 30} H${hx + 100} Q${hx + 96} ${hy - 20} ${hx + 66} ${hy - 22}Z`} fill={accent} />}
      {hat === "helmet" && (
        <g>
          <path d={`M${hx - 76} ${hy - 26} Q${hx - 70} ${hy - 110} ${hx} ${hy - 110} Q${hx + 70} ${hy - 110} ${hx + 76} ${hy - 26}Z`} fill={SUN} />
          <circle cx={hx} cy={hy - 70} r={14} fill={CREAM} />
        </g>
      )}
      {hat === "crown" && (
        <g>
          <path d={`M${hx - 56} ${hy - 50} L${hx - 62} ${hy - 120} L${hx - 30} ${hy - 86} L${hx} ${hy - 132} L${hx + 30} ${hy - 86} L${hx + 62} ${hy - 120} L${hx + 56} ${hy - 50}Z`} fill={metal("yellow")[0]} />
          <circle cx={hx} cy={hy - 70} r={9} fill={CORAL} />
        </g>
      )}
      {hat === "tiara" && (
        <g>
          <path d={`M${hx - 52} ${hy - 58} Q${hx} ${hy - 120} ${hx + 52} ${hy - 58} Q${hx} ${hy - 80} ${hx - 52} ${hy - 58}Z`} fill={metal("white")[0]} />
          <circle cx={hx} cy={hy - 98} r={8} fill={SKY} />
        </g>
      )}
      {/* jewels */}
      {look.jewel === "earrings" && [-64, 64].map((x) => <circle key={x} cx={hx + x} cy={hy + 26} r={7} fill={look.jewelTone ?? CREAM} />)}
    </g>
  );

  const propNode = (() => {
    const [x, y] = handR;
    switch (prop) {
      case "gem":
        return <g transform={`translate(${x + 4} ${y - 44})`}><Gem shape="oval" tone={look.propTone} s={34} t={t} /></g>;
      case "rough":
        return <g transform={`translate(${x + 4} ${y - 40})`}><Rough s={34} tone={look.propTone} /></g>;
      case "letter":
        return (
          <g transform={`translate(${x + 10} ${y - 40}) rotate(${-8 + Math.sin(t * 1.5) * 3})`}>
            <rect x={-46} y={-60} width={92} height={120} rx={4} fill={CREAM} />
            {[-34, -16, 2, 20, 38].map((ly) => <path key={ly} d={`M-32 ${ly} H${26 - (ly % 3) * 4}`} stroke={INK_LINE} strokeWidth={4} />)}
          </g>
        );
      case "magnifier":
        return (
          <g transform={`translate(${x + 20} ${y - 50})`}>
            <path d="M-20 40 L-44 76" stroke={INK} strokeWidth={14} strokeLinecap="round" />
            <circle r={40} fill={CREAM} opacity={0.6} stroke={SUN} strokeWidth={9} />
          </g>
        );
      case "lantern":
        return (
          <g transform={`translate(${x} ${y + 30})`}>
            <rect x={-26} y={-10} width={52} height={70} rx={8} fill={SUN} opacity={0.85} />
            <path d="M-26 -10 H26 M0 -10 V-30" stroke={INK} strokeWidth={6} />
          </g>
        );
      case "blade":
        return <path d={`M${x} ${y} L${x + 30} ${y - 90} L${x + 44} ${y - 84} L${x + 12} ${y + 4}Z`} fill={metal("white")[0]} stroke={INK} strokeWidth={3} />;
      case "ringbox":
        return (
          <g transform={`translate(${x + 10} ${y - 30})`}>
            <rect x={-40} y={-10} width={80} height={46} rx={8} fill={CORAL} />
            <path d="M-40 -10 L-36 -52 H36 L40 -10Z" fill={tint(CORAL, 0.2)} />
            <circle cx={0} cy={-8} r={16} fill="none" stroke={metal("yellow")[0]} strokeWidth={6} />
            <g transform="translate(0 -30)"><Gem s={13} t={t} /></g>
          </g>
        );
      case "shovel":
        return (
          <g transform={`translate(${x} ${y})`}>
            <path d="M0 -150 V160" stroke="#a8743f" strokeWidth={12} strokeLinecap="round" />
            <path d="M-30 150 H30 L24 220 Q0 240 -24 220Z" fill={metal("white")[1]} />
          </g>
        );
      case "carrot":
        return <g transform={`translate(${x + 10} ${y - 40}) rotate(20)`}><Carrot s={60} ring /></g>;
      default:
        return null;
    }
  })();

  return (
    <g transform={`translate(0 ${-hop}) ${flip ? "scale(-1 1)" : ""}`}>
      <g transform={`rotate(${sway} 0 0) scale(1 ${breathe})`}>
        {clothes}
        {arm([-84, -425], handL, "l")}
        {head}
        {look.jewel === "pearls" &&
          Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI * (0.15 + (i / 8) * 0.7);
            return <g key={i} transform={`translate(${Math.cos(a) * 46} ${-462 + Math.sin(a) * 34})`}><Pearl s={8} id={`${id}-${seed}-${i}`} /></g>;
          })}
        {look.jewel === "pendant" && <g transform="translate(0 -405)"><Gem shape="pear" tone={look.jewelTone} s={18} t={t} /></g>}
        {arm([84, -425], handR, "r")}
        {propNode}
      </g>
    </g>
  );
};

const INK_LINE = "#9a8a7a";

// The place behind the people of a scene: a big painted shape and a few flat things that say where it is.
export const Setting: React.FC<{ kind: string; t: number; color: string; ground: number }> = ({ kind, t, color, ground }) => {
  const line = CREAM;
  const g = ground;
  switch (kind) {
    case "palace":
      return (
        <g>
          {[230, 540, 850].map((x, i) => (
            <path key={i} d={`M${x - 90} ${g - 40} V${g - 520} A90 90 0 0 1 ${x + 90} ${g - 520} V${g - 40}`} fill={tint(color, 0.25)} stroke={line} strokeWidth={5} />
          ))}
          <g transform={`translate(540 ${g - 860}) rotate(${Math.sin(t) * 2})`}>
            <path d="M0 -120 V-20" stroke={line} strokeWidth={4} />
            <path d="M-90 0 Q0 60 90 0" stroke={SUN} strokeWidth={8} fill="none" />
            {[-90, -45, 0, 45, 90].map((x) => <circle key={x} cx={x} cy={x === 0 ? 30 : Math.abs(x) === 45 ? 22 : 0} r={10} fill={SUN} />)}
          </g>
          {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 90} y={g - 40} width={90} height={46} fill={i % 2 ? CREAM : tint(color, -0.15)} opacity={0.6} />)}
        </g>
      );
    case "workshop":
      return (
        <g>
          <rect x={170} y={g - 900} width={420} height={360} fill={tint(SKY, 0.3)} stroke={line} strokeWidth={8} />
          <path d={`M380 ${g - 900} V${g - 540} M170 ${g - 720} H590`} stroke={line} strokeWidth={8} />
          <circle cx={500} cy={g - 820} r={40} fill={SUN} />
          <path d={`M780 ${g - 900} V${g - 760} M720 ${g - 700} L780 ${g - 760} L840 ${g - 700}Z`} stroke={line} strokeWidth={6} fill={SUN} />
          <rect x={60} y={g - 210} width={960} height={36} rx={8} fill="#b9773f" />
          <rect x={100} y={g - 174} width={24} height={170} fill="#9a5f2e" />
          <rect x={956} y={g - 174} width={24} height={170} fill="#9a5f2e" />
        </g>
      );
    case "street":
      return (
        <g>
          {[[60, 300, CORAL], [330, 380, SUN], [640, 280, MINT], [880, 340, LILAC]].map(([x, h, c], i) => (
            <g key={i}>
              <rect x={x as number} y={g - (h as number)} width={210} height={h as number} fill={tint(c as string, 0.2)} />
              <polygon points={`${(x as number) - 14},${g - (h as number)} ${(x as number) + 105},${g - (h as number) - 90} ${(x as number) + 224},${g - (h as number)}`} fill={tint(c as string, -0.15)} />
              <rect x={(x as number) + 40} y={g - (h as number) + 50} width={46} height={56} fill={CREAM} />
              <rect x={(x as number) + 124} y={g - (h as number) + 50} width={46} height={56} fill={CREAM} />
            </g>
          ))}
          <circle cx={860} cy={g - 860} r={70} fill={SUN} />
        </g>
      );
    case "study":
      return (
        <g>
          <rect x={90} y={g - 820} width={420} height={600} fill="#a8683a" />
          {[0, 1, 2, 3].map((r) => (
            <g key={r}>
              <rect x={100} y={g - 800 + r * 148} width={400} height={8} fill="#7d4a26" />
              {Array.from({ length: 9 }, (_, i) => (
                <rect key={i} x={112 + i * 42} y={g - 790 + r * 148} width={34} height={120 - (i * 13 + r * 7) % 30} fill={[CORAL, MINT, SUN, SKY, LILAC, PINK, LIME][(i + r) % 7]} />
              ))}
            </g>
          ))}
          <rect x={560} y={g - 230} width={460} height={30} rx={6} fill="#9a5f2e" />
          <path d={`M900 ${g - 230} V${g - 330} M860 ${g - 330} H940 L920 ${g - 380} H880Z`} stroke={INK} strokeWidth={6} fill={SUN} />
        </g>
      );
    case "garden":
      return (
        <g>
          <circle cx={830} cy={g - 900} r={80} fill={SUN} />
          {Array.from({ length: 13 }, (_, i) => <rect key={i} x={20 + i * 82} y={g - 260} width={30} height={240} rx={14} fill={CREAM} />)}
          <rect x={0} y={g - 220} width={1080} height={22} fill={CREAM} />
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} transform={`translate(${70 + i * 118} ${g - 6})`}>
              <path d={`M0 0 q-14 -40 -6 -70 M0 0 q4 -46 0 -80 M0 0 q16 -40 10 -66`} stroke="#3f9b47" strokeWidth={7} fill="none" strokeLinecap="round" />
            </g>
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i} transform={`translate(${130 + i * 170} ${g - 300 - (i % 2) * 30})`}>
              {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} rx={10} ry={18} transform={`rotate(${a}) translate(0 -16)`} fill={[PINK, SUN, CORAL][i % 3]} />)}
              <circle r={9} fill={CREAM} />
            </g>
          ))}
        </g>
      );
    case "field":
      return (
        <g>
          <circle cx={820} cy={g - 920} r={86} fill={SUN} />
          <path d={`M0 ${g - 260} Q270 ${g - 420} 560 ${g - 290} Q820 ${g - 180} 1080 ${g - 330} V${g} H0Z`} fill={tint(LIME, -0.05)} />
          <path d={`M0 ${g - 140} Q360 ${g - 260} 700 ${g - 150} Q900 ${g - 90} 1080 ${g - 160} V${g} H0Z`} fill={tint("#b98a52", 0.1)} />
          {[160, 260, 880].map((x, i) => (
            <path key={i} d={`M${x} ${g - 260 - i * 10} q-28 -120 0 -260 q28 140 0 260Z`} fill="#3f8a55" />
          ))}
          {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={60 + rand(i + 4) * 960} cy={g - 20 - rand(i + 9) * 100} r={6 + rand(i) * 6} fill={tint("#8a6a44", 0.15)} />)}
        </g>
      );
    case "lab":
      return (
        <g>
          <rect x={620} y={g - 640} width={330} height={420} rx={16} fill="#8a96a3" />
          <rect x={660} y={g - 600} width={250} height={60} rx={8} fill={tint("#8a96a3", -0.3)} />
          <circle cx={785} cy={g - 420} r={80} fill={CREAM} stroke={tint("#8a96a3", -0.4)} strokeWidth={10} />
          <path d={`M785 ${g - 420} L${785 + Math.cos(t * 1.3 - 1) * 60} ${g - 420 + Math.sin(t * 1.3 - 1) * 60}`} stroke={CORAL} strokeWidth={8} strokeLinecap="round" />
          <rect x={60} y={g - 230} width={540} height={28} rx={6} fill="#9aa6b0" />
          {[[150, MINT], [270, PINK], [400, SKY]].map(([x, c], i) => (
            <g key={i} transform={`translate(${x} ${g - 230})`}>
              <path d="M-14 -120 V-70 L-50 -6 H50 L14 -70 V-120Z" fill={CREAM} opacity={0.8} />
              <path d="M-36 -30 L-50 -6 H50 L36 -30Z" fill={c as string} />
              <circle cx={6} cy={-50 - ((t * 40 + i * 30) % 60)} r={6} fill={c as string} opacity={0.7} />
            </g>
          ))}
        </g>
      );
    case "mine":
      return (
        <g>
          <circle cx={830} cy={g - 900} r={80} fill={SUN} />
          <path d={`M-20 ${g} Q200 ${g - 700} 560 ${g - 640} Q900 ${g - 600} 1100 ${g}Z`} fill="#b07a48" />
          <path d={`M400 ${g} V${g - 280} A140 140 0 0 1 680 ${g - 280} V${g}Z`} fill={INK} opacity={0.85} />
          <path d={`M380 ${g} V${g - 290} A160 160 0 0 1 700 ${g - 290} V${g}`} stroke={CREAM} strokeWidth={10} fill="none" />
        </g>
      );
    case "ship":
      return (
        <g>
          <circle cx={820} cy={g - 900} r={80} fill={SUN} />
          <path d={`M0 ${g - 330} Q135 ${g - 360} 270 ${g - 330} T540 ${g - 330} T810 ${g - 330} T1080 ${g - 330} V${g - 220} H0Z`} fill={SKY} />
          <rect x={0} y={g - 220} width={1080} height={220} fill="#b9773f" />
          {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 96} y={g - 330} width={14} height={120} fill={CREAM} />)}
          <rect x={0} y={g - 340} width={1080} height={18} fill={CREAM} />
        </g>
      );
    case "vault":
      return (
        <g>
          <circle cx={540} cy={g - 560} r={340} fill="#9aa6b0" />
          <circle cx={540} cy={g - 560} r={290} fill="#b8c2ca" stroke={CREAM} strokeWidth={8} />
          <g transform={`rotate(${t * 10} 540 ${g - 560})`}>
            {[0, 60, 120].map((a) => <rect key={a} x={530} y={g - 700} width={20} height={280} rx={8} fill={tint("#9aa6b0", -0.3)} transform={`rotate(${a} 540 ${g - 560})`} />)}
          </g>
          <circle cx={540} cy={g - 560} r={40} fill={SUN} />
        </g>
      );
    default:
      return null;
  }
};
