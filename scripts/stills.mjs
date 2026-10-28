// Renders a few frames of a story as PNGs to check the look. Usage: node scripts/stills.mjs stories/x.json OUTDIR 1.0 5.2 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const [storyPath, outDir, ...times] = process.argv.slice(2);
const story = JSON.parse(fs.readFileSync(storyPath, "utf8"));
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_CHROME ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const inputProps = { story };
const composition = await selectComposition({ serveUrl, id: "Story", inputProps, browserExecutable });
console.log("duration", composition.durationInFrames / composition.fps, "s");
for (const s of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(s) * composition.fps));
  const output = path.join(outDir, `t${String(s).padStart(5, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, output, inputProps, browserExecutable });
  console.log(output);
}
