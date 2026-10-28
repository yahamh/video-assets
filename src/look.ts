import { Easing } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Dark and gold: night blues, gold line work, ivory light, one spot colour per story.
export const BG = "#0a0e18";
export const BG2 = "#141b2d";
export const PANEL = "#1a2238";
export const GOLD = "#d9b45f";
export const GOLD_LIGHT = "#f4dc9b";
export const GOLD_DARK = "#8c6b2b";
export const IVORY = "#f5ecd8";
export const RED = "#c2413a";
export const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif';
export const DISPLAY = '"Playfair Display", Georgia, serif';

export const ease = Easing.bezier(0.45, 0, 0.25, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const prog = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
export const eased = (t: number, a: number, b: number) => ease(prog(t, a, b));
export const popped = (t: number, a: number, b: number) => easeOut(prog(t, a, b));

// A short shake after a hit at time `at`, in pixels.
export const shake = (t: number, at: number, px = 14, len = 0.35) => {
  const u = (t - at) / len;
  if (u < 0 || u > 1) return [0, 0];
  const k = (1 - u) * px;
  return [Math.sin(t * 97) * k, Math.cos(t * 83) * k * 0.7];
};

// Gentle repeatable randomness, so a scene draws the same way on every frame.
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
