import React from "react";
import { Composition } from "remotion";
import { FPS, H, W } from "./look";
import { StoryVideo } from "./Story";
import { Story, timeline } from "./story";
import sample from "../stories/001-cullinan.json";
import { GemShort, GemShortVideo, gemTimeline } from "./gemsize/GemSize";
import gemSample from "../gemsize/sample.json";
import { SAMPLE_SECONDS, StyleSample } from "./styles/Sample";

export const Root: React.FC = () => (
  <>
  <Composition id="GemSize" component={GemShortVideo} width={W} height={H} fps={FPS} durationInFrames={FPS * 22}
    defaultProps={{ short: gemSample as unknown as GemShort }}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(gemTimeline(props.short).total * FPS) })} />
  {(["jewelbox", "deco", "gouache"] as const).map((look) => (
    <Composition key={look} id={`Style-${look}`} component={StyleSample} width={W} height={H} fps={FPS} durationInFrames={Math.round(FPS * SAMPLE_SECONDS)} defaultProps={{ look }} />
  ))}
  <Composition
    id="Story"
    component={StoryVideo}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={FPS * 30}
    defaultProps={{ story: sample as unknown as Story }}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(timeline(props.story).total * FPS) })}
  />
  </>
);
