import React from "react";
import { Img, staticFile } from "remotion";
import { GOLD } from "./look";

// A picture from public/renders on a white card with a thin gold edge, as a printed render would look on a desk.
// Used by the photo, compare, grid and mix scenes; not a scene itself.
export const Card: React.FC<{
  src: string;
  x: number;
  y: number;
  size: number;
  zoom?: number;
  origin?: [number, number]; // the point of the picture the zoom moves toward, 0 to 1 across and down
  opacity?: number;
  clip?: number; // how much of the card shows, from the left (for wipes)
}> = ({ src, x, y, size, zoom = 1, origin = [0.5, 0.5], opacity = 1, clip = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: 26,
      overflow: "hidden",
      background: "#ffffff",
      border: `3px solid ${GOLD}`,
      boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
      opacity,
      clipPath: clip < 1 ? `inset(0 ${(1 - clip) * 100}% 0 0)` : undefined,
    }}
  >
    <Img
      src={staticFile(`renders/${src}`)}
      style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, transformOrigin: `${origin[0] * 100}% ${origin[1] * 100}%` }}
    />
  </div>
);

// Where the picture sits: big in the middle, or lower and a little smaller under the hook words on the first scene.
export const cardSpot = (hook: boolean | undefined, size = 820) => {
  const S = hook ? Math.min(size, 760) : size;
  return { S, X: (1080 - S) / 2, Y: hook ? 730 : 380 + (820 - S) / 2 };
};
