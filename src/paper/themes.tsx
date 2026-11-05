import React from "react";
import { AbsoluteFill } from "remotion";

// Looks for the paper style (ali, 3 Nov 2026: "use different arts in your videos"). The scenes are the same cut-paper
// drawings; a story's `theme` changes how they are printed:
//   cream       the original: cream paper, painted blobs
//   midnight    inverted: gold ink on a deep indigo night
//   blueprint   white drawing on blueprint blue, with a drafting grid
//   riso        two-ink print: indigo and pink on cream, with halftone dots
//   oldprint    sepia ink on aged paper, heavier grain and a darker edge
//   sunset      plum, coral and peach, like a screen print
//   watercolor  the colors kept, edges that wobble and bleed like wet paint
//   mint, blush, sky   the colors kept, on pale green, pink or blue paper
// ali, 5 Nov 2026: "stop doing one color ink". midnight, blueprint, riso, oldprint and sunset map the picture's light and
// dark onto a few colors (one or two inks), so new stories don't use them any more (scripts/check.py refuses them); they
// stay here for the videos already posted. cream, watercolor, mint, blush and sky keep every color of the picture.

export const THEMES = ["cream", "midnight", "blueprint", "riso", "oldprint", "sunset", "watercolor", "mint", "blush", "sky"] as const;
export type Theme = (typeof THEMES)[number];

// From the darkest part of the picture (the ink) to the lightest (the paper).
const RAMPS: Record<string, string[]> = {
  midnight: ["#fff1c9", "#f0b653", "#5a4a9c", "#121a3d"],
  blueprint: ["#f6fbff", "#a9cfff", "#3a74d0", "#143f94"],
  riso: ["#23288a", "#e6407f", "#ffb0c6", "#fff3e8"],
  oldprint: ["#2a1b10", "#6a4527", "#c29a5f", "#efe0bd"],
  sunset: ["#33173f", "#c4305a", "#ff9650", "#ffeac8"],
};

const hex = (h: string, k: number) => (parseInt(h.slice(1 + 2 * k, 3 + 2 * k), 16) / 255).toFixed(3);

const ThemeDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      {Object.entries(RAMPS).map(([name, ramp]) => (
        <filter key={name} id={`theme-${name}`} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feColorMatrix type="matrix" values="0.255 0.858 0.087 0 -0.17  0.255 0.858 0.087 0 -0.17  0.255 0.858 0.087 0 -0.17  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={ramp.map((h) => hex(h, 0)).join(" ")} />
            <feFuncG type="table" tableValues={ramp.map((h) => hex(h, 1)).join(" ")} />
            <feFuncB type="table" tableValues={ramp.map((h) => hex(h, 2)).join(" ")} />
          </feComponentTransfer>
        </filter>
      ))}
      <filter id="theme-watercolor" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.011 0.015" numOctaves={2} seed={7} result="wob" />
        <feDisplacementMap in="SourceGraphic" in2="wob" scale={13} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feGaussianBlur in="d" stdDeviation={0.9} result="b" />
        <feColorMatrix in="b" type="saturate" values="0.86" result="s" />
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} seed={3} result="bleed" />
        <feColorMatrix in="bleed" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.3" result="blotch" />
        <feComposite in="blotch" in2="s" operator="in" result="b2" />
        <feBlend in="s" in2="b2" mode="screen" />
      </filter>
    </defs>
  </svg>
);

// How a theme prints the scenes and how it prints the captions on top of them.
const scenesFilter = (theme: string) => (RAMPS[theme] || theme === "watercolor" ? `url(#theme-${theme})` : undefined);
const uiFilter = (theme: string) => (RAMPS[theme] ? `url(#theme-${theme})` : undefined);

export const ThemedScenes: React.FC<{ theme: string; children: React.ReactNode }> = ({ theme, children }) => (
  <AbsoluteFill style={{ filter: scenesFilter(theme) }}>{children}</AbsoluteFill>
);

export const ThemedUi: React.FC<{ theme: string; children: React.ReactNode }> = ({ theme, children }) => (
  <AbsoluteFill style={{ filter: uiFilter(theme) }}>{children}</AbsoluteFill>
);

// The paper of the mint, blush and sky themes: only the paper behind the scenes changes color (PaperTone in kit.tsx), the
// drawings keep their colors.
export const PAPER_TONES: Record<string, string> = { mint: "#d4ecdd", blush: "#f6d6da", sky: "#d3e5f4" };

// What a theme adds on top of everything: a drafting grid, halftone dots, an aged edge.
export const ThemeOverlay: React.FC<{ theme: string }> = ({ theme }) => {
  if (theme === "blueprint")
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="bpGrid" width={60} height={60} patternUnits="userSpaceOnUse">
              <path d="M60 0H0V60" fill="none" stroke="#ffffff" strokeWidth={1.5} opacity={0.2} />
            </pattern>
            <pattern id="bpGrid5" width={300} height={300} patternUnits="userSpaceOnUse">
              <path d="M300 0H0V300" fill="none" stroke="#ffffff" strokeWidth={3} opacity={0.22} />
            </pattern>
          </defs>
          <rect width={1080} height={1920} fill="url(#bpGrid)" />
          <rect width={1080} height={1920} fill="url(#bpGrid5)" />
        </svg>
      </AbsoluteFill>
    );
  if (theme === "riso")
    return (
      <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply" }}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="rsDots" width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
              <circle cx={8} cy={8} r={3.2} fill="#23288a" opacity={0.13} />
            </pattern>
          </defs>
          <rect width={1080} height={1920} fill="url(#rsDots)" />
        </svg>
      </AbsoluteFill>
    );
  if (theme === "oldprint")
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(60,36,14,0) 55%, rgba(60,36,14,0.42) 100%)" }} />
      </AbsoluteFill>
    );
  if (theme === "midnight")
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(255,214,120,0.10) 0%, rgba(255,214,120,0) 60%)" }} />
      </AbsoluteFill>
    );
  return null;
};

export { ThemeDefs };
