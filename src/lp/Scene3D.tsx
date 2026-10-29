import React from "react";
import { Cam, Obj, RenderOpts, V3, mixRgb, render, rgb, rnd } from "./engine";

// Draws 3D objects as flat polygons. Each polygon gets a hairline of its own colour so no seams show between faces.
export const Scene3D: React.FC<{ objs: Obj[]; cam: Cam; opts?: RenderOpts }> = ({ objs, cam, opts }) => {
  const polys = render(objs, cam, opts);
  return (
    <g>
      {polys.map((p, i) => (
        <polygon
          key={i}
          points={p.pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
          fill={p.fill}
          stroke={p.fill}
          strokeWidth={1}
          strokeLinejoin="round"
          opacity={p.opacity < 1 ? p.opacity : undefined}
        />
      ))}
    </g>
  );
};

const css = (c: V3) => `rgb(${c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255)).join(",")})`;

// A faceted backdrop over the whole frame: a gradient from `top` to `bottom`, a soft glow at (gx, gy),
// each triangle a little lighter or darker, shimmering slowly.
export const Backdrop: React.FC<{
  t: number;
  top: string;
  bottom: string;
  glow?: string;
  gx?: number;
  gy?: number;
  gr?: number;
  cell?: number;
  seed?: number;
  W?: number;
  H?: number;
}> = ({ t, top, bottom, glow, gx = 540, gy = 760, gr = 700, cell = 135, seed = 3, W = 1080, H = 1920 }) => {
  const nx = Math.ceil(W / cell) + 1;
  const ny = Math.ceil(H / cell) + 1;
  const pt = (i: number, j: number): [number, number] => {
    const inside = i > 0 && i < nx && j > 0 && j < ny;
    const jx = inside ? (rnd(i * 17 + j * 131 + seed) - 0.5) * cell * 0.75 : 0;
    const jy = inside ? (rnd(i * 71 + j * 37 + seed * 3) - 0.5) * cell * 0.75 : 0;
    return [(i * W) / nx + jx, (j * H) / ny + jy];
  };
  const A = rgb(top);
  const B = rgb(bottom);
  const G = glow ? rgb(glow) : null;
  const tris: [number, number][][] = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const a = pt(i, j);
      const b = pt(i + 1, j);
      const c = pt(i + 1, j + 1);
      const d = pt(i, j + 1);
      if ((i + j) % 2) tris.push([a, b, d], [b, c, d]);
      else tris.push([a, b, c], [a, c, d]);
    }
  return (
    <g>
      {tris.map((tr, k) => {
        const cx = (tr[0][0] + tr[1][0] + tr[2][0]) / 3;
        const cy = (tr[0][1] + tr[1][1] + tr[2][1]) / 3;
        let c = mixRgb(A, B, Math.min(1, Math.max(0, cy / H)));
        if (G) {
          const d = Math.hypot(cx - gx, cy - gy) / gr;
          c = mixRgb(c, G, Math.max(0, 1 - d) ** 2 * 0.55);
        }
        const k1 = 1 + (rnd(k * 13 + seed) - 0.5) * 0.16 + Math.sin(t * 0.8 + rnd(k * 7 + seed) * 6.28) * 0.035;
        const fill = css([c[0] * k1, c[1] * k1, c[2] * k1]);
        return <polygon key={k} points={tr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} fill={fill} stroke={fill} strokeWidth={1} />;
      })}
    </g>
  );
};

// A faceted cone of light from above: a fan of thin triangles, alternately brighter.
export const LightCone: React.FC<{ x: number; top?: number; bottom: number; w: number; k?: number; color?: string; n?: number }> = ({
  x,
  top = -40,
  bottom,
  w,
  k = 1,
  color = "#fff3d6",
  n = 7,
}) => (
  <g opacity={k}>
    {Array.from({ length: n }, (_, i) => {
      const a = x - w / 2 + (w * i) / n;
      const b = x - w / 2 + (w * (i + 1)) / n;
      const t0 = x - 50 + (100 * i) / n;
      const t1 = x - 50 + (100 * (i + 1)) / n;
      return (
        <polygon
          key={i}
          points={`${t0},${top} ${t1},${top} ${b},${bottom} ${a},${bottom}`}
          fill={color}
          opacity={0.06 + 0.07 * ((i % 2) + rnd(i + 5) * 0.6)}
        />
      );
    })}
  </g>
);
