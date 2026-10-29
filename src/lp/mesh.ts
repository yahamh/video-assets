// Low-poly mesh makers. Faces wind counter-clockwise seen from outside, so their normals point out.
import { Face, Mesh, V3, add, cross, dot, mul, norm, rnd, sub } from "./engine";

const tri = (a: number, b: number, c: number): Face => ({ idx: [a, b, c] });

// Drops faces with no area (where a profile touches the axis).
const clean = (m: Mesh): Mesh => ({
  v: m.v,
  f: m.f.filter((f) => {
    const [a, b, c] = f.idx.map((i) => m.v[i]);
    const n = cross(sub(b, a), sub(c, a));
    return Math.hypot(n[0], n[1], n[2]) > 1e-9;
  }),
});

// A shape turned around the y axis: `profile` is [radius, y] from bottom to top. `phase` turns the rings.
export const lathe = (profile: [number, number][], seg: number, phase = 0, caps = true): Mesh => {
  const v: V3[] = [];
  const f: Face[] = [];
  profile.forEach(([r, y]) => {
    for (let j = 0; j < seg; j++) {
      const a = phase + (j / seg) * Math.PI * 2;
      v.push([r * Math.cos(a), y, r * Math.sin(a)]);
    }
  });
  for (let i = 0; i < profile.length - 1; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * seg + j;
      const b = i * seg + ((j + 1) % seg);
      const c = (i + 1) * seg + ((j + 1) % seg);
      const d = (i + 1) * seg + j;
      f.push(tri(a, d, c), tri(a, c, b));
    }
  }
  if (caps) {
    const [r0, y0] = profile[0];
    const [r1, y1] = profile[profile.length - 1];
    if (r0 > 0) {
      const c = v.push([0, y0, 0]) - 1;
      for (let j = 0; j < seg; j++) f.push(tri(c, j, (j + 1) % seg));
    }
    if (r1 > 0) {
      const c = v.push([0, y1, 0]) - 1;
      const o = (profile.length - 1) * seg;
      for (let j = 0; j < seg; j++) f.push(tri(c, o + ((j + 1) % seg), o + j));
    }
  }
  return clean({ v, f });
};

// A box `w` wide, `h` tall, `d` deep, centred on the origin.
export const box = (w: number, h: number, d: number): Mesh => {
  const m = lathe([[Math.SQRT1_2, -0.5], [Math.SQRT1_2, 0.5]], 4, Math.PI / 4);
  return { v: m.v.map(([x, y, z]) => [x * w, y * h, z * d]), f: m.f };
};

// A prism or cylinder with `n` sides.
export const prism = (n: number, r: number, h: number, r2 = r): Mesh => lathe([[r, -h / 2], [r2, h / 2]], n);

// An icosphere: detail 0 is 20 faces, 1 is 80, 2 is 320.
export const ico = (detail = 1, r = 1): Mesh => {
  const t = (1 + Math.sqrt(5)) / 2;
  let v: V3[] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map((p) => norm(p as V3));
  let f = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let d = 0; d < detail; d++) {
    const cache = new Map<string, number>();
    const mid = (a: number, b: number) => {
      const k = a < b ? `${a}_${b}` : `${b}_${a}`;
      const hit = cache.get(k);
      if (hit !== undefined) return hit;
      v.push(norm(mul(add(v[a], v[b]), 0.5)));
      cache.set(k, v.length - 1);
      return v.length - 1;
    };
    const nf: number[][] = [];
    for (const [a, b, c] of f) {
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    f = nf;
  }
  v = v.map((p) => mul(p, r));
  return { v, f: f.map((x) => ({ idx: x })) };
};

// A brilliant-cut stone, table up, about 2 wide. `seg` 16 for round; scale it for an oval.
export const gem = (seg = 16): Mesh =>
  lathe(
    [
      [0, -0.86],
      [0.48, -0.44],
      [1, 0],
      [1, 0.05],
      [0.8, 0.19],
      [0.56, 0.32],
      [0, 0.32],
    ],
    seg,
    Math.PI / seg,
  );

// An egg, 2 tall, wider below its middle.
export const egg = (seg = 12, rings = 10): Mesh => {
  const prof: [number, number][] = [];
  for (let i = 0; i <= rings; i++) {
    const y = -1 + (2 * i) / rings;
    prof.push([Math.sqrt(Math.max(0, 1 - y * y)) * (0.72 - 0.1 * y), y]);
  }
  return lathe(prof, seg);
};

// A flat convex shape (x, y points, counter-clockwise) given `d` of thickness along z.
export const slab = (pts: [number, number][], d: number): Mesh => {
  const n = pts.length;
  const v: V3[] = [...pts.map(([x, y]) => [x, y, d / 2] as V3), ...pts.map(([x, y]) => [x, y, -d / 2] as V3)];
  const f: Face[] = [];
  for (let i = 1; i < n - 1; i++) f.push(tri(0, i, i + 1), tri(n, n + i + 1, n + i));
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    f.push(tri(i, n + i, n + j), tri(i, n + j, j));
  }
  return clean({ v, f });
};

// A ground of `nx` by `nz` cells over w by d, height from `hf(x, z)`.
export const ground = (w: number, d: number, nx: number, nz: number, hf: (x: number, z: number) => number): Mesh => {
  const v: V3[] = [];
  const f: Face[] = [];
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const x = -w / 2 + (w * i) / nx + (i > 0 && i < nx ? (rnd(i * 31 + j * 7) - 0.5) * (w / nx) * 0.5 : 0);
      const z = -d / 2 + (d * j) / nz + (j > 0 && j < nz ? (rnd(i * 13 + j * 17) - 0.5) * (d / nz) * 0.5 : 0);
      v.push([x, hf(x, z), z]);
    }
  const at = (i: number, j: number) => j * (nx + 1) + i;
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const [a, b, c, e] = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
      if ((i + j) % 2) f.push(tri(a, e, b), tri(b, e, c));
      else f.push(tri(a, e, c), tri(a, c, b));
    }
  return { v, f };
};

// Moves each vertex a little, the same way every time, for rough and hand-made shapes.
export const jitter = (m: Mesh, k: number, seed = 1): Mesh => {
  const key = (p: V3) => `${p[0].toFixed(4)},${p[1].toFixed(4)},${p[2].toFixed(4)}`;
  const moved = new Map<string, V3>();
  return {
    f: m.f,
    v: m.v.map((p, i) => {
      const id = key(p);
      const hit = moved.get(id);
      if (hit) return hit;
      const q: V3 = [p[0] + (rnd(i * 3 + seed) - 0.5) * k, p[1] + (rnd(i * 5 + seed * 7) - 0.5) * k, p[2] + (rnd(i * 11 + seed * 13) - 0.5) * k];
      moved.set(id, q);
      return q;
    }),
  };
};

// Keeps the faces whose centre passes `keep` (a hair cap off a head, a beard off a jaw).
export const part = (m: Mesh, keep: (c: V3) => boolean): Mesh => ({
  v: m.v,
  f: m.f.filter((f) => {
    const c = f.idx.reduce((s, i) => add(s, m.v[i]), [0, 0, 0] as V3);
    return keep(mul(c, 1 / f.idx.length));
  }),
});

// A round bar along the points `pts`, `r` thick, with `n` sides (legs, arms, posts, wire).
export const tube = (pts: V3[], r: number | number[], n = 6): Mesh => {
  const v: V3[] = [];
  const f: Face[] = [];
  const dirs = pts.map((p, i) => norm(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)])));
  const d0 = dirs[0];
  let u = norm(cross(d0, Math.abs(d0[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]));
  pts.forEach((p, i) => {
    const d = dirs[i];
    u = norm(sub(u, mul(d, dot(u, d))));
    const w = cross(u, d);
    const rr = Array.isArray(r) ? r[i] : r;
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2;
      v.push(add(p, add(mul(u, Math.cos(a) * rr), mul(w, Math.sin(a) * rr))));
    }
  });
  for (let i = 0; i < pts.length - 1; i++)
    for (let j = 0; j < n; j++) {
      const a = i * n + j;
      const b = i * n + ((j + 1) % n);
      const c = (i + 1) * n + ((j + 1) % n);
      const d = (i + 1) * n + j;
      f.push(tri(a, d, c), tri(a, c, b));
    }
  const c0 = v.push(pts[0]) - 1;
  for (let j = 0; j < n; j++) f.push(tri(c0, j, (j + 1) % n));
  const c1 = v.push(pts[pts.length - 1]) - 1;
  const o = (pts.length - 1) * n;
  for (let j = 0; j < n; j++) f.push(tri(c1, o + ((j + 1) % n), o + j));
  return clean({ v, f });
};

// Colours the faces `pick` chooses by their outward normal and centre (the lining inside a chest lid).
export const paint = (m: Mesh, pick: (n: V3, c: V3) => string | undefined): Mesh => ({
  v: m.v,
  f: m.f.map((f) => {
    const [a, b, c] = f.idx.map((i) => m.v[i]);
    const n = norm(cross(sub(b, a), sub(c, a)));
    const ctr = mul(f.idx.reduce((s, i) => add(s, m.v[i]), [0, 0, 0] as V3), 1 / f.idx.length);
    const color = pick(n, ctr);
    return color ? { idx: f.idx, color } : f;
  }),
});

// A ring: a tube of radius `r` round a circle of radius `R` in the xz plane.
export const torus = (R: number, r: number, seg = 24, sides = 6): Mesh => {
  const v: V3[] = [];
  const f: Face[] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const c: V3 = [R * Math.cos(a), 0, R * Math.sin(a)];
    const out: V3 = [Math.cos(a), 0, Math.sin(a)];
    for (let j = 0; j < sides; j++) {
      const b = (j / sides) * Math.PI * 2;
      v.push(add(c, add(mul(out, Math.cos(b) * r), [0, Math.sin(b) * r, 0])));
    }
  }
  for (let i = 0; i < seg; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j;
      const b = i * sides + ((j + 1) % sides);
      const c = ((i + 1) % seg) * sides + ((j + 1) % sides);
      const d = ((i + 1) % seg) * sides + j;
      f.push(tri(a, b, c), tri(a, c, d));
    }
  return { v, f };
};

// Moves and scales a mesh's points (to build one mesh out of others).
export const shape = (m: Mesh, fn: (p: V3) => V3): Mesh => ({ v: m.v.map(fn), f: m.f });
