// Renders stills or the MP4 of a new-look sample. Usage:
//   node scripts/style-sample.mjs stills jewelbox OUTDIR 0.6 3.2 ...
//   node scripts/style-sample.mjs video jewelbox out/style-jewelbox.mp4 [music.wav]
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const [mode, look, out, ...rest] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const shell = process.env.REMOTION_CHROME;
const browserExecutable = shell && fs.existsSync(shell) ? shell : null;
const inputProps = { look, music: mode === "video" ? rest[0] : undefined };
const composition = await selectComposition({ serveUrl, id: `Style-${look}`, inputProps, browserExecutable });
if (mode === "stills") {
  fs.mkdirSync(out, { recursive: true });
  for (const s of rest) {
    const output = path.join(out, `${look}-t${String(s).padStart(5, "0")}.png`);
    await renderStill({ composition, serveUrl, frame: Math.min(composition.durationInFrames - 1, Math.round(Number(s) * composition.fps)), output, inputProps, browserExecutable });
    console.log(output);
  }
} else {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await renderMedia({ composition, serveUrl, inputProps, browserExecutable, codec: "h264", crf: 17, pixelFormat: "yuv420p", audioBitrate: "192k", outputLocation: out });
  console.log(out);
}
