import React from "react";
import { shade } from "../art";
import { CutGem, RoughDiamond, Pearl } from "../art";

// One character from the waist up, drawn around the base of the neck (0, 0). Faces are simple and friendly,
// never a likeness of a real person: clothes, hair and hats of the time say who they are.
export type Look = {
  skin?: string;
  hair?: "short" | "side" | "bald" | "slick" | "long" | "updo" | "curly" | "none";
  hairColor?: string;
  facial?: "none" | "mustache" | "handlebar" | "walrus" | "beard" | "fullbeard";
  hat?: "none" | "bowler" | "top" | "cap" | "crown" | "helmet" | "tiara";
  outfit?: "suit" | "coat" | "uniform" | "royal" | "apron" | "miner" | "dress" | "gown";
  outfitColor?: string;
  accent?: string;
  glasses?: "none" | "round" | "monocle" | "loupe";
  jewel?: "none" | "pearls" | "pendant" | "earrings";
  jewelTone?: string;
  old?: boolean;
  prop?: "none" | "lantern" | "gem" | "rough" | "blade" | "letter" | "magnifier";
  propTone?: string;
};

export type Expression = "neutral" | "smile" | "surprised" | "worried" | "focused" | "proud" | "sly";

const OUT = "#06080e";

export const Person: React.FC<{ look: Look; expression: Expression; t: number; id: string; lookDir?: number; gasp?: number }> = ({
  look,
  expression,
  t,
  id,
  lookDir = 0,
  gasp = 0,
}) => {
  const skin = look.skin ?? "#e2b48f";
  const hairColor = look.old ? "#b9b4ab" : look.hairColor ?? "#3a2a1e";
  const cloth = look.outfitColor ?? (look.outfit === "royal" ? "#8e1f2c" : look.outfit === "apron" ? "#ece2cc" : "#232b3f");
  const accent = look.accent ?? "#8e1f2c";
  const outfit = look.outfit ?? "suit";
  const hat = look.hat ?? "none";
  const hair = look.hair ?? "short";
  const facial = look.facial ?? "none";
  const breathe = 1 + 0.012 * Math.sin(t * 2.2);
  const tilt = Math.sin(t * 1.1) * 1.6 - gasp * 4;
  const blink = (t % 3.1) > 2.98 ? 0.1 : 1;
  const ex = expression;
  const surprised = ex === "surprised";
  const eyeOpen = (surprised ? 1.35 : ex === "focused" || ex === "sly" ? 0.6 : 1) * blink;
  const brow = { neutral: [0, 0], smile: [-4, 0], surprised: [-18, 0], worried: [-8, 14], focused: [6, -10], proud: [-6, -4], sly: [4, -12] }[ex];
  const px = lookDir * 6;

  const body = "M-300 900 V170 Q-295 60 -170 30 Q-90 12 -40 0 H40 Q90 12 170 30 Q295 60 300 170 V900Z";
  const handAt: [number, number] = [150, 250];

  // clothes
  let clothes: React.ReactNode;
  if (outfit === "suit" || outfit === "coat") {
    const coat = outfit === "coat";
    clothes = (
      <g>
        <path d={body} fill={cloth} stroke={OUT} strokeWidth={4} />
        <path d="M-62 0 L0 230 L62 0Z" fill="#efe8d8" stroke={OUT} strokeWidth={3} />
        {coat ? null : <path d="M-14 14 H14 L22 210 L0 240 L-22 210Z" fill={accent} stroke={OUT} strokeWidth={2.5} />}
        <path d="M-62 0 L-150 50 L-60 300 L0 230Z" fill={shade(cloth, 0.12)} stroke={OUT} strokeWidth={3} />
        <path d="M62 0 L150 50 L60 300 L0 230Z" fill={shade(cloth, 0.06)} stroke={OUT} strokeWidth={3} />
        {coat && (
          <g>
            <path d="M-62 0 L-120 -70 L-150 40Z" fill={shade(cloth, 0.08)} stroke={OUT} strokeWidth={3} />
            <path d="M62 0 L120 -70 L150 40Z" fill={shade(cloth, 0.02)} stroke={OUT} strokeWidth={3} />
          </g>
        )}
        <line x1={0} y1={300} x2={0} y2={900} stroke={OUT} strokeWidth={3} />
        {[360, 450].map((y) => (
          <circle key={y} cx={-24} cy={y} r={8} fill={shade(cloth, -0.4)} />
        ))}
      </g>
    );
  } else if (outfit === "uniform") {
    clothes = (
      <g>
        <path d={body} fill={cloth} stroke={OUT} strokeWidth={4} />
        <path d="M-60 -6 H60 V40 H-60Z" fill="#d9b45f" stroke={OUT} strokeWidth={3} />
        {[100, 180, 260, 340, 420].map((y) => (
          <g key={y}>
            <circle cx={-50} cy={y} r={10} fill="#e9c66f" stroke={OUT} strokeWidth={2} />
            <circle cx={50} cy={y} r={10} fill="#e9c66f" stroke={OUT} strokeWidth={2} />
          </g>
        ))}
        {[-1, 1].map((s) => (
          <path key={s} d={`M${s * 150} 40 Q${s * 250} 40 ${s * 290} 110 L${s * 290} 140 Q${s * 230} 90 ${s * 150} 90Z`} fill="#d9b45f" stroke={OUT} strokeWidth={3} />
        ))}
      </g>
    );
  } else if (outfit === "royal") {
    clothes = (
      <g>
        <path d={body} fill={cloth} stroke={OUT} strokeWidth={4} />
        <path d="M-62 0 L0 120 L62 0Z" fill="#efe8d8" stroke={OUT} strokeWidth={3} />
        <path d="M-300 170 Q-295 60 -170 30 Q-90 12 -40 0 L-20 60 Q-160 120 -300 330Z" fill="#f4efe4" stroke={OUT} strokeWidth={3} />
        <path d="M300 170 Q295 60 170 30 Q90 12 40 0 L20 60 Q160 120 300 330Z" fill="#ece6da" stroke={OUT} strokeWidth={3} />
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`M${(i % 2 ? 1 : -1) * (80 + (i * 37) % 180)} ${60 + ((i * 53) % 150)} l6 16 l6 -16Z`} fill={OUT} />
        ))}
        <path d="M-200 60 L230 560 L190 600 L-240 100Z" fill={look.accent ?? "#2f4f9e"} stroke={OUT} strokeWidth={3} />
        <g transform="translate(-130 330)">
          <path d="M0 -40 L10 -12 L40 -12 L16 6 L26 36 L0 18 L-26 36 L-16 6 L-40 -12 L-10 -12Z" fill="#e9c66f" stroke={OUT} strokeWidth={2} />
        </g>
      </g>
    );
  } else if (outfit === "apron" || outfit === "miner") {
    const miner = outfit === "miner";
    clothes = (
      <g>
        <path d={body} fill={miner ? cloth : "#ece2cc"} stroke={OUT} strokeWidth={4} />
        <path d="M-50 0 L0 70 L50 0" fill="none" stroke={OUT} strokeWidth={3} />
        {miner ? (
          <g>
            <path d="M-70 0 Q0 60 70 0 L40 60 Q0 90 -40 60Z" fill={accent} stroke={OUT} strokeWidth={3} />
            <line x1={-150} y1={40} x2={-120} y2={900} stroke="#4a3220" strokeWidth={22} />
            <line x1={150} y1={40} x2={120} y2={900} stroke="#4a3220" strokeWidth={22} />
          </g>
        ) : (
          <g>
            <path d="M-170 30 Q-90 12 -40 0 L-60 260 H-200Z" fill="#2c2530" stroke={OUT} strokeWidth={3} />
            <path d="M170 30 Q90 12 40 0 L60 260 H200Z" fill="#2c2530" stroke={OUT} strokeWidth={3} />
            <path d="M-170 200 H170 L200 900 H-200Z" fill={look.outfitColor ?? "#6b4a32"} stroke={OUT} strokeWidth={3} />
            <path d="M-170 200 L-60 0 M170 200 L60 0" stroke={look.outfitColor ?? "#6b4a32"} strokeWidth={14} />
          </g>
        )}
      </g>
    );
  } else {
    // dress or gown
    clothes = (
      <g>
        <path d={body} fill={cloth} stroke={OUT} strokeWidth={4} />
        <path d="M-160 30 Q-90 12 -40 0 H40 Q90 12 160 30 Q120 150 0 170 Q-120 150 -160 30Z" fill={skin} stroke={OUT} strokeWidth={3} />
        <path d="M-160 30 Q-120 150 0 170 Q120 150 160 30" fill="none" stroke={shade(cloth, 0.35)} strokeWidth={10} />
        {outfit === "gown" && <path d="M-300 170 Q-290 80 -200 50 L-160 30 Q-200 160 -300 300Z M300 170 Q290 80 200 50 L160 30 Q200 160 300 300Z" fill={shade(cloth, 0.15)} stroke={OUT} strokeWidth={3} />}
      </g>
    );
  }

  const jewel = look.jewel ?? "none";
  const jewelTone = look.jewelTone ?? "#e9f1f6";

  // the prop, held up in the right hand
  const prop = look.prop ?? "none";
  const propTone = look.propTone ?? "#e9f1f6";
  const held =
    prop === "none" ? null : (
      <g>
        {/* upper arm down the side, forearm up across the chest, hand holding the thing up by the shoulder */}
        <path d="M232 70 Q300 220 292 400" stroke={OUT} strokeWidth={96} fill="none" strokeLinecap="round" />
        <path d="M232 70 Q300 220 292 400" stroke={outfit === "apron" ? "#ece2cc" : cloth} strokeWidth={88} fill="none" strokeLinecap="round" />
        <path d="M292 400 Q270 240 214 150" stroke={OUT} strokeWidth={86} fill="none" strokeLinecap="round" />
        <path d="M292 400 Q270 240 214 150" stroke={outfit === "apron" ? "#ece2cc" : shade(cloth, 0.06)} strokeWidth={78} fill="none" strokeLinecap="round" />
        <g transform="translate(204 128)">
          {prop === "gem" && <CutGem x={0} y={-86} size={130} shape="round" tone={propTone} />}
          {prop === "rough" && <RoughDiamond x={0} y={-80} size={190} turn={Math.sin(t * 1.4)} />}
          {prop === "lantern" && (
            <g transform="translate(0 -56)">
              <circle r={140} fill="#ffd27a" opacity={0.16 + 0.04 * Math.sin(t * 9)} />
              <rect x={-32} y={-52} width={64} height={92} rx={8} fill="#ffd98a" stroke={OUT} strokeWidth={5} />
              <path d="M-36 -52 H36 L24 -72 H-24Z" fill="#2a2420" />
            </g>
          )}
          {prop === "blade" && (
            <g transform="translate(0 -60) rotate(-15)">
              <rect x={-16} y={-24} width={32} height={120} rx={6} fill="#4a3220" stroke={OUT} strokeWidth={3} />
              <polygon points="-28,-24 28,-24 0,-104" fill="#c9d1d8" stroke={OUT} strokeWidth={3} />
            </g>
          )}
          {prop === "letter" && <rect x={-70} y={-150} width={140} height={96} fill="#f3ead6" stroke={OUT} strokeWidth={3} transform="rotate(-8)" />}
          {prop === "magnifier" && (
            <g transform="translate(0 -70)">
              <circle r={62} fill="#cfe3ff" fillOpacity={0.25} stroke="#d9b45f" strokeWidth={10} />
              <rect x={-8} y={62} width={16} height={60} fill="#4a3220" />
            </g>
          )}
          <path d="M-46 -14 Q-50 -44 -20 -46 L26 -46 Q48 -40 44 -10 Q40 30 0 34 Q-40 30 -46 -14Z" fill={skin} stroke={OUT} strokeWidth={3} />
          <path d="M-30 -44 V-10 M-8 -46 V-8 M14 -46 V-10" stroke={OUT} strokeWidth={2.5} opacity={0.45} />
        </g>
      </g>
    );

  const hairBack = hair === "long" ? <path d="M-120 -230 Q-150 -40 -130 60 H130 Q150 -40 120 -230Z" fill={hairColor} stroke={OUT} strokeWidth={3} /> : null;
  const hairTop = (() => {
    switch (hair) {
      case "bald":
        return <path d="M-106 -200 Q-114 -150 -100 -118 L-90 -160Z M106 -200 Q114 -150 100 -118 L90 -160Z" fill={hairColor} />;
      case "updo":
        return (
          <g fill={hairColor} stroke={OUT} strokeWidth={3}>
            <path d="M-108 -180 Q-112 -300 0 -305 Q112 -300 108 -180 Q95 -250 0 -255 Q-95 -250 -108 -180Z" />
            <circle cx={0} cy={-320} r={58} />
          </g>
        );
      case "curly":
        return (
          <g fill={hairColor} stroke={OUT} strokeWidth={3}>
            {[-90, -55, -18, 18, 55, 90].map((x, i) => (
              <circle key={i} cx={x} cy={-268 + Math.abs(x) * 0.45} r={42} />
            ))}
          </g>
        );
      case "none":
        return null;
      default:
        return (
          <g>
            <path d="M-108 -180 Q-112 -300 0 -305 Q112 -300 108 -180 Q100 -232 30 -246 Q-20 -250 -60 -238 Q-100 -222 -108 -180Z" fill={hairColor} stroke={OUT} strokeWidth={3} />
            {hair === "side" && <path d="M-40 -298 Q-30 -260 -50 -240" stroke={shade(hairColor, -0.4)} strokeWidth={4} fill="none" />}
            {hair === "slick" && <path d="M-60 -280 Q0 -296 60 -280" stroke="#ffffff" strokeOpacity={0.3} strokeWidth={6} fill="none" />}
          </g>
        );
    }
  })();

  const mouth = (() => {
    switch (ex) {
      case "smile":
      case "proud":
        return <path d="M-34 -98 Q0 -70 34 -98" stroke={OUT} strokeWidth={5} fill="none" strokeLinecap="round" />;
      case "surprised":
        return <ellipse cx={0} cy={-88} rx={16} ry={22} fill="#3a1414" stroke={OUT} strokeWidth={3} />;
      case "worried":
        return <path d="M-28 -84 Q0 -100 28 -84" stroke={OUT} strokeWidth={5} fill="none" strokeLinecap="round" />;
      case "sly":
        return <path d="M-30 -94 Q0 -86 34 -104" stroke={OUT} strokeWidth={5} fill="none" strokeLinecap="round" />;
      case "focused":
        return <path d="M-22 -92 H22" stroke={OUT} strokeWidth={5} strokeLinecap="round" />;
      default:
        return <path d="M-26 -94 Q0 -88 26 -94" stroke={OUT} strokeWidth={5} fill="none" strokeLinecap="round" />;
    }
  })();

  const stache = (() => {
    switch (facial) {
      case "mustache":
        return <path d="M-46 -112 Q-24 -128 0 -116 Q24 -128 46 -112 Q24 -102 0 -108 Q-24 -102 -46 -112Z" fill={hairColor} stroke={OUT} strokeWidth={2.5} />;
      case "handlebar":
        return <path d="M-70 -128 Q-80 -104 -52 -106 Q-26 -96 0 -112 Q26 -96 52 -106 Q80 -104 70 -128 Q62 -114 44 -120 Q20 -128 0 -118 Q-20 -128 -44 -120 Q-62 -114 -70 -128Z" fill={hairColor} stroke={OUT} strokeWidth={2.5} />;
      case "walrus":
        return <path d="M-56 -118 Q0 -136 56 -118 L50 -86 Q0 -100 -50 -86Z" fill={hairColor} stroke={OUT} strokeWidth={2.5} />;
      default:
        return null;
    }
  })();
  const beard =
    facial === "beard" || facial === "fullbeard" ? (
      <g>
        <path
          d={facial === "fullbeard" ? "M-104 -170 Q-110 -40 0 -10 Q110 -40 104 -170 Q90 -110 50 -100 Q0 -80 -50 -100 Q-90 -110 -104 -170Z" : "M-96 -150 Q-90 -60 0 -46 Q90 -60 96 -150 Q80 -100 40 -96 Q0 -82 -40 -96 Q-80 -100 -96 -150Z"}
          fill={hairColor}
          stroke={OUT}
          strokeWidth={3}
        />
        <path d="M-50 -112 Q-24 -128 0 -116 Q24 -128 50 -112 Q24 -100 0 -106 Q-24 -100 -50 -112Z" fill={shade(hairColor, -0.1)} stroke={OUT} strokeWidth={2.5} />
      </g>
    ) : null;

  const hatEl = (() => {
    switch (hat) {
      case "bowler":
        return <path d="M-140 -240 Q-110 -228 -96 -250 Q-104 -350 0 -356 Q104 -350 96 -250 Q110 -228 140 -240 Q120 -262 96 -262 Q0 -280 -96 -262 Q-120 -262 -140 -240Z" fill="#14161e" stroke="#d9b45f" strokeOpacity={0.5} strokeWidth={3} />;
      case "top":
        return (
          <g fill="#14161e" stroke="#d9b45f" strokeOpacity={0.5} strokeWidth={3}>
            <path d="M-140 -244 Q-100 -232 -100 -256 H100 Q100 -232 140 -244 Q120 -266 100 -266 H-100 Q-120 -266 -140 -244Z" />
            <path d="M-92 -262 L-86 -430 H86 L92 -262Z" />
            <rect x={-90} y={-300} width={180} height={22} fill="#5a1a22" />
          </g>
        );
      case "cap":
        return <path d="M-112 -236 Q-112 -320 0 -318 Q100 -316 116 -250 L170 -236 Q150 -224 110 -228 Q0 -244 -112 -236Z" fill="#4a4036" stroke={OUT} strokeWidth={3} />;
      case "helmet":
        return (
          <g>
            <path d="M-120 -236 Q-118 -340 0 -344 Q118 -340 120 -236 Q140 -230 150 -222 H-150 Q-140 -230 -120 -236Z" fill="#6b5a3a" stroke={OUT} strokeWidth={3} />
            <circle cx={0} cy={-300} r={22} fill="#ffe2a0" stroke={OUT} strokeWidth={3} />
            <circle cx={0} cy={-300} r={70} fill="#ffe2a0" opacity={0.18} />
          </g>
        );
      case "crown":
        return (
          <g stroke="#8a6420" strokeWidth={3}>
            <path d="M-100 -250 L-112 -350 L-56 -300 L0 -370 L56 -300 L112 -350 L100 -250Z" fill="#e2bb5c" />
            <rect x={-104} y={-262} width={208} height={30} fill="#d9b45f" />
            <circle cx={0} cy={-300} r={14} fill="#b3202e" />
            <circle cx={-56} cy={-276} r={9} fill="#2f5fa8" />
            <circle cx={56} cy={-276} r={9} fill="#2f7a4f" />
          </g>
        );
      case "tiara":
        return (
          <g>
            <path d="M-92 -248 Q0 -330 92 -248" fill="none" stroke="#e2bb5c" strokeWidth={10} />
            {[-56, -28, 0, 28, 56].map((x) => (
              <CutGem key={x} x={x} y={-290 - (56 - Math.abs(x)) * 0.5} size={x === 0 ? 40 : 24} shape="round" tone={jewelTone} />
            ))}
          </g>
        );
      default:
        return null;
    }
  })();

  const eye = (x: number) => (
    <g transform={`translate(${x} -168)`}>
      <ellipse rx={17} ry={13 * eyeOpen} fill="#fbf7ee" stroke={OUT} strokeWidth={2.5} />
      {eyeOpen > 0.2 && <circle cx={px} cy={1} r={8.5} fill="#1b1410" />}
      {eyeOpen > 0.2 && <circle cx={px + 3} cy={-3} r={2.5} fill="#fff" />}
    </g>
  );

  return (
    <g>
      <defs>
        <linearGradient id={`${id}shade`} gradientUnits="userSpaceOnUse" x1={-60} y1={0} x2={120} y2={0}>
          <stop offset="0" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id={`${id}shadeB`} gradientUnits="userSpaceOnUse" x1={-120} y1={0} x2={300} y2={0}>
          <stop offset="0" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <g transform={`scale(1 ${breathe})`}>
        {clothes}
        {jewel === "pearls" &&
          Array.from({ length: 13 }, (_, i) => {
            const u = i / 12;
            return <Pearl key={i} x={-110 + u * 220} y={40 + Math.sin(u * Math.PI) * 80} r={11} />;
          })}
        {jewel === "pendant" && (
          <g>
            <path d="M-110 30 Q0 150 110 30" stroke="#e2bb5c" strokeWidth={4} fill="none" />
            <CutGem x={0} y={130} size={60} shape="pear" tone={jewelTone} rot={180} />
          </g>
        )}
      </g>
      <g transform={`rotate(${tilt} 0 -40)`}>
        {hairBack}
        <path d="M-42 -70 H42 V18 H-42Z" fill={shade(skin, -0.12)} stroke={OUT} strokeWidth={3} />
        <ellipse cx={-104} cy={-160} rx={18} ry={30} fill={skin} stroke={OUT} strokeWidth={3} />
        <ellipse cx={104} cy={-160} rx={18} ry={30} fill={skin} stroke={OUT} strokeWidth={3} />
        {jewel === "earrings" && [-104, 104].map((x) => <CutGem key={x} x={x} y={-112} size={26} shape="round" tone={jewelTone} />)}
        <ellipse cx={0} cy={-170} rx={105} ry={128} fill={skin} stroke={OUT} strokeWidth={4} />
        {beard}
        {look.old && (
          <g stroke={shade(skin, -0.3)} strokeWidth={3} fill="none">
            <path d="M-50 -236 Q0 -244 50 -236" />
            <path d="M-40 -222 Q0 -228 40 -222" />
            <path d="M-70 -160 l-10 6 M70 -160 l10 6" />
          </g>
        )}
        <ellipse cx={-62} cy={-128} rx={20} ry={10} fill="#d9826e" opacity={0.2} />
        <ellipse cx={62} cy={-128} rx={20} ry={10} fill="#d9826e" opacity={0.2} />
        {eye(-40)}
        {eye(40)}
        <path d={`M-62 ${-200 + brow[1] + brow[0]} Q-40 ${-212 + brow[0]} -18 ${-202 + brow[0] - brow[1] * 0.4}`} stroke={hairColor === "#b9b4ab" ? "#7d7870" : shade(hairColor, -0.2)} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d={`M62 ${-200 + brow[1] + brow[0]} Q40 ${-212 + brow[0]} 18 ${-202 + brow[0] - brow[1] * 0.4}`} stroke={hairColor === "#b9b4ab" ? "#7d7870" : shade(hairColor, -0.2)} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d="M4 -168 Q14 -138 6 -124 Q-2 -120 -10 -126" stroke={shade(skin, -0.35)} strokeWidth={4} fill="none" strokeLinecap="round" />
        {mouth}
        {stache}
        {look.glasses === "round" && (
          <g fill="none" stroke="#2a2420" strokeWidth={4}>
            <circle cx={-40} cy={-168} r={26} />
            <circle cx={40} cy={-168} r={26} />
            <path d="M-14 -170 Q0 -178 14 -170" />
          </g>
        )}
        {look.glasses === "monocle" && (
          <g fill="none" stroke="#d9b45f" strokeWidth={4}>
            <circle cx={40} cy={-168} r={28} />
            <path d="M64 -150 Q90 -60 70 20" strokeWidth={2} />
          </g>
        )}
        {look.glasses === "loupe" && <rect x={18} y={-196} width={44} height={56} rx={10} fill="#15161c" stroke="#d9b45f" strokeWidth={3} />}
        {hairTop}
        {hatEl}
        {/* the side away from the light */}
        <ellipse cx={0} cy={-170} rx={105} ry={128} fill={`url(#${id}shade)`} />
      </g>
      <path d={body} fill={`url(#${id}shadeB)`} transform={`scale(1 ${breathe})`} />
      <path d="M-300 900 V170 Q-295 60 -170 30" fill="none" stroke="#f4dc9b" strokeOpacity={0.55} strokeWidth={4} />
      {held}
    </g>
  );
};
