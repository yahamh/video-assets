// Renders one story to an MP4. Usage: node scripts/render.mjs stories/001-cullinan.json out/001-cullinan.mp4
// The sound is then evened out to -14 LUFS with a -2 dB ceiling (what Reels, TikTok and Shorts play at), so it never clips.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [storyPath, outPath] = process.argv.slice(2);
const story = JSON.parse(fs.readFileSync(storyPath, "utf8"));
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const shell = process.env.REMOTION_CHROME ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(shell) ? shell : null;
const inputProps = { story };
const composition = await selectComposition({ serveUrl, id: "Story", inputProps, browserExecutable });
const raw = outPath.replace(/\.mp4$/, ".raw.mp4");
let last = -1;
await renderMedia({
  composition,
  serveUrl,
  inputProps,
  browserExecutable,
  codec: "h264",
  crf: 16,
  pixelFormat: "yuv420p",
  audioBitrate: "192k",
  outputLocation: raw,
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 10);
    if (p !== last) {
      last = p;
      console.log(`${p * 10}%`);
    }
  },
});

const ffmpeg = (args) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stderr;
};
const target = "I=-14:TP=-2:LRA=11";
const measured = JSON.parse(ffmpeg(["-i", raw, "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"]).match(/\{[^{}]*\}\s*$/)[0]);
const m = `measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}`;
ffmpeg(["-i", raw, "-af", `loudnorm=${target}:${m}:linear=true,aresample=48000`, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", outPath]);
fs.rmSync(raw);
console.log(`${outPath}: ${(composition.durationInFrames / composition.fps).toFixed(1)} s, sound was ${measured.input_i} LUFS`);
