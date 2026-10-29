// A small flat-shaded 3D renderer for the low-poly look (ali, 29 Oct 2026): meshes are projected to SVG
// polygons, each face one flat colour lit by a key and a rim light, drawn back to front.

export type V3 = [number, number, number];
export type Face = { idx: number[]; color?: string };
export type Mesh = { v: V3[]; f: Face[] };
export type Mat = {
  color: string;
  spec?: number; // 0..1 strength of the highlight
  shine?: number; // highlight tightness
  glow?: number; // 0..1 lit regardless of the lights
  sparkle?: number; // 0..1 random facets flash (gems)
  double?: boolean; // draw back faces too
  opacity?: number;
  bias?: number; // drawn this much nearer than it is (eyes and mouths on a face)
  facets?: number; // 0..1 each face a little lighter or darker at random (cut stones)
};
export type Obj = { mesh: Mesh; mat: Mat; pos?: V3; rot?: V3; scale?: V3 | number; key?: string };
export type Cam = { pos: V3; target: V3; fov?: number; roll?: number };
export type Light = { dir: V3; color?: string; k: number };
export type Poly = { pts: [number, number][]; fill: string; depth: number; opacity: number };

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export const rgb = (c: string): V3 => {
  const h = c.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const css = (c: V3) => `rgb(${c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255)).join(",")})`;
export const mixRgb = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Gentle repeatable randomness.
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Rotation about x, then y, then z.
export const rotate = (p: V3, r: V3): V3 => {
  let [x, y, z] = p;
  if (r[0]) {
    const c = Math.cos(r[0]);
    const s = Math.sin(r[0]);
    [y, z] = [y * c - z * s, y * s + z * c];
  }
  if (r[1]) {
    const c = Math.cos(r[1]);
    const s = Math.sin(r[1]);
    [x, z] = [x * c + z * s, -x * s + z * c];
  }
  if (r[2]) {
    const c = Math.cos(r[2]);
    const s = Math.sin(r[2]);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  return [x, y, z];
};

export const place = (p: V3, o: Obj): V3 => {
  const s = o.scale ?? 1;
  const sc: V3 = typeof s === "number" ? [s, s, s] : s;
  const q: V3 = [p[0] * sc[0], p[1] * sc[1], p[2] * sc[2]];
  return add(o.rot ? rotate(q, o.rot) : q, o.pos ?? [0, 0, 0]);
};

export const KEY: Light = { dir: [-0.55, -0.6, -0.58], color: "#fff1d6", k: 1.0 };
export const RIM: Light = { dir: [0.7, -0.15, 0.7], color: "#7f9cff", k: 0.45 };
export const FILL: Light = { dir: [0.3, 0.5, -0.8], color: "#d9b45f", k: 0.18 };

export type RenderOpts = {
  W?: number;
  H?: number;
  lights?: Light[];
  ambient?: number;
  fog?: { color: string; near: number; far: number; max?: number };
  t?: number;
};

// Projects and shades every face of every object; returns polygons sorted back to front.
export const render = (objs: Obj[], cam: Cam, o: RenderOpts = {}): Poly[] => {
  const W = o.W ?? 1080;
  const H = o.H ?? 1920;
  const lights = o.lights ?? [KEY, RIM, FILL];
  const ambient = o.ambient ?? 0.28;
  const f = norm(sub(cam.target, cam.pos));
  let r = norm(cross(f, [0, 1, 0]));
  let u = cross(r, f);
  if (cam.roll) {
    const c = Math.cos(cam.roll);
    const s = Math.sin(cam.roll);
    [r, u] = [add(mul(r, c), mul(u, s)), add(mul(u, c), mul(r, -s))];
  }
  const focal = H / 2 / Math.tan((((cam.fov ?? 35) * Math.PI) / 180) / 2);
  const Ls = lights.map((l) => ({ d: norm(mul(l.dir, -1)), c: rgb(l.color ?? "#ffffff"), k: l.k }));
  const fogC = o.fog ? rgb(o.fog.color) : null;
  const out: Poly[] = [];
  objs.forEach((ob, oi) => {
    const wv = ob.mesh.v.map((p) => place(p, ob));
    const cv = wv.map((p) => {
      const d = sub(p, cam.pos);
      return [dot(d, r), dot(d, u), dot(d, f)] as V3;
    });
    const base = rgb(ob.mat.color);
    ob.mesh.f.forEach((face, fi) => {
      const ids = face.idx;
      if (ids.some((i) => cv[i][2] < 0.05)) return;
      const a = wv[ids[0]];
      const n = norm(cross(sub(wv[ids[1]], a), sub(wv[ids[2]], a)));
      const toCam = norm(sub(cam.pos, a));
      let facing = dot(n, toCam);
      if (facing < 0) {
        if (!ob.mat.double) return;
        facing = -facing;
      }
      const nn = dot(n, toCam) < 0 ? mul(n, -1) : n;
      const col = face.color ? rgb(face.color) : base;
      let lit: V3 = mul(col, ambient + (ob.mat.glow ?? 0));
      for (const L of Ls) {
        const diff = Math.max(0, dot(nn, L.d)) * L.k;
        lit = add(lit, [col[0] * L.c[0] * diff, col[1] * L.c[1] * diff, col[2] * L.c[2] * diff]);
        if (ob.mat.spec) {
          const h = norm(add(L.d, toCam));
          const s = Math.pow(Math.max(0, dot(nn, h)), ob.mat.shine ?? 24) * ob.mat.spec * L.k;
          lit = add(lit, mul(L.c, s));
        }
      }
      if (ob.mat.facets) {
        const k = 1 + ob.mat.facets * (rnd(fi * 13.7 + oi * 3.1) * 1.3 - 0.65);
        lit = mul(lit, k);
      }
      if (ob.mat.sparkle) {
        const tw = Math.max(0, Math.sin((o.t ?? 0) * (2 + rnd(fi * 7 + oi) * 3) + rnd(fi + oi * 31) * 40));
        lit = add(lit, mul([1, 1, 1], Math.pow(tw, 12) * ob.mat.sparkle));
      }
      const depth = ids.reduce((s, i) => s + cv[i][2], 0) / ids.length - (ob.mat.bias ?? 0);
      if (fogC && o.fog) {
        const k = Math.min(o.fog.max ?? 0.85, Math.max(0, (depth - o.fog.near) / (o.fog.far - o.fog.near)));
        lit = mixRgb(lit, fogC, k);
      }
      out.push({
        pts: ids.map((i) => [W / 2 + (cv[i][0] / cv[i][2]) * focal, H / 2 - (cv[i][1] / cv[i][2]) * focal]),
        fill: css(lit),
        depth,
        opacity: ob.mat.opacity ?? 1,
      });
    });
  });
  out.sort((x, y) => y.depth - x.depth);
  return out;
};

// Where a point lands on screen (for labels and 2D details placed on a 3D object).
export const project = (p: V3, cam: Cam, W = 1080, H = 1920): [number, number, number] => {
  const f = norm(sub(cam.target, cam.pos));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const d = sub(p, cam.pos);
  const z = dot(d, f);
  const focal = H / 2 / Math.tan((((cam.fov ?? 35) * Math.PI) / 180) / 2);
  return [W / 2 + (dot(d, r) / z) * focal, H / 2 - (dot(d, u) / z) * focal, z];
};

// An SVG transform that lays flat 2D drawing (w by h, y down) onto a face of a 3D object: `o` is the face's top-left
// corner in the world, `ex` and `ey` the world vectors along its top and down its left side.
export const onFace = (cam: Cam, o: V3, ex: V3, ey: V3, w: number, h: number) => {
  const p0 = project(o, cam);
  const p1 = project([o[0] + ex[0], o[1] + ex[1], o[2] + ex[2]], cam);
  const p2 = project([o[0] + ey[0], o[1] + ey[1], o[2] + ey[2]], cam);
  return `matrix(${(p1[0] - p0[0]) / w} ${(p1[1] - p0[1]) / w} ${(p2[0] - p0[0]) / h} ${(p2[1] - p0[1]) / h} ${p0[0]} ${p0[1]})`;
};
