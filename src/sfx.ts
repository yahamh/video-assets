import type { SceneSpec, Sfx } from "./story";

const n = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);

// The sounds each scene makes on its own, in seconds from the scene's start. Files are public/sfx/<name>.wav.
export const sceneSfx = (s: SceneSpec, dur: number): Sfx[] => {
  switch (s.kind) {
    case "parcel":
      return [...(s.glow ? [{ at: 0.1, name: "shimmer", vol: 0.5 }] : []), ...(s.stamp ? [{ at: n(s.stampAt, 0.5), name: "stamp" }] : [])];
    case "mine": {
      const z = n(s.zoomAt, 0.3) * dur;
      return [
        { at: 0.15, name: "shimmer", vol: 0.35 },
        { at: z - 0.05, name: "whoosh", vol: 0.8 },
        { at: z + 0.45, name: "impact" },
        { at: z + 0.55, name: "shimmer", vol: 0.6 },
      ];
    }
    case "ship":
      return [
        { at: 0, name: "waves", vol: 0.6 },
        { at: 0.25, name: "horn", vol: 0.55 },
      ];
    case "reveal":
      return [
        { at: n(s.openAt, 0.25), name: "creak", vol: 0.7 },
        ...(s.stamp ? [{ at: n(s.stampAt, 1.2), name: "stamp" }, { at: n(s.stampAt, 1.2), name: "boom", vol: 0.7 }] : []),
      ];
    case "journey":
      return [{ at: 0.3, name: "riser", vol: 0.45 }];
    case "gift":
      return [{ at: 0.2, name: "shimmer", vol: 0.6 }];
    case "cut": {
      const phase = typeof s.phase === "string" ? s.phase : "all";
      if (phase === "blade") return [{ at: 0, name: "heartbeat", vol: 0.9 }];
      if (phase === "result") return [{ at: 0.1, name: "shimmer", vol: 0.8 }];
      const hit = n(s.hitAt, phase === "all" ? dur * 0.25 : 0.5);
      return [
        { at: hit - 0.02, name: "crack" },
        { at: hit, name: "impact", vol: 0.9 },
        { at: hit + 0.8, name: "shimmer", vol: 0.7 },
      ];
    }
    case "crown":
      return [{ at: 0.15, name: "shimmer", vol: 0.7 }];
    case "stranger":
      return [{ at: 0.1, name: "steps", vol: 0.7 }];
    case "cast":
      return typeof s.gasp === "number" ? [{ at: s.gasp, name: "impact", vol: 0.5 }] : [];
    case "title":
      return [{ at: 0, name: "boom", vol: 0.8 }];
    case "jewel":
    case "portrait":
      return [{ at: 0.2, name: "shimmer", vol: 0.5 }];
    default:
      return [];
  }
};
