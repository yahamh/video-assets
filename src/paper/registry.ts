import React from "react";
import { SceneProps } from "../scenes/types";
import { PCast, PCrown, PCut, PGift, PHook, PJewel, PJourney, PMine, PParcel, PPortrait, PReveal, PShip, PStranger, PTitle } from "./scenes";

// The paper version of each story scene (ali, 30 Oct 2026). The lesson scenes (photo, compare, grid, steps, mix) show
// real renders and keep their look.
export const PAPER_SCENES: Record<string, React.FC<SceneProps>> = {
  hook: PHook,
  title: PTitle,
  cast: PCast,
  parcel: PParcel,
  mine: PMine,
  ship: PShip,
  reveal: PReveal,
  journey: PJourney,
  gift: PGift,
  cut: PCut,
  crown: PCrown,
  jewel: PJewel,
  portrait: PPortrait,
  stranger: PStranger,
};

// The paper scene for a line, or undefined where only the drawn one exists.
export const paperScene = (kind: string, p: Record<string, unknown>): React.FC<SceneProps> | undefined => {
  if (kind === "hook" && p.show === "sandwich") return undefined;
  return PAPER_SCENES[kind];
};
