import React from "react";
import { SceneProps } from "../scenes/types";
import { LpCast, LpGift, LpHook, LpReveal, LpTitle } from "./scenes";
import { LpCrown, LpCut, LpJewel, LpJourney, LpMine, LpParcel, LpPortrait, LpShip, LpStranger } from "./scenes2";

// The low-poly version of each story scene. The lesson scenes (photo, compare, grid, steps, mix) show real renders and
// keep their look.
export const LP_SCENES: Record<string, React.FC<SceneProps>> = {
  hook: LpHook,
  gift: LpGift,
  cast: LpCast,
  title: LpTitle,
  reveal: LpReveal,
  jewel: LpJewel,
  cut: LpCut,
  stranger: LpStranger,
  parcel: LpParcel,
  mine: LpMine,
  crown: LpCrown,
  journey: LpJourney,
  ship: LpShip,
  portrait: LpPortrait,
};

// The low-poly scene for a line, or undefined where only the drawn one exists.
export const lowPolyScene = (kind: string, p: Record<string, unknown>): React.FC<SceneProps> | undefined => {
  if (kind === "hook" && p.show === "sandwich") return undefined;
  return LP_SCENES[kind];
};
