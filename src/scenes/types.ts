// What every scene gets: its own clock (seconds since the scene started), its length, and its settings from the story.
export type SceneProps = { t: number; dur: number; p: Record<string, unknown> };

export const str = (v: unknown, d: string) => (typeof v === "string" && v.length ? v : d);
export const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
