import { Config } from "@remotion/cli/config";

// Rendered in the cloud container with the Chromium that is already installed there.
Config.setBrowserExecutable(
  process.env.REMOTION_CHROME ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
);
Config.setVideoImageFormat("png");
Config.setCodec("h264");
Config.setCrf(14);
Config.setPixelFormat("yuv420p");
