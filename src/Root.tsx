import React from "react";
import { Composition } from "remotion";
import { FPS, H, W } from "./look";
import { StoryVideo } from "./Story";
import { Story, timeline } from "./story";
import sample from "../stories/001-cullinan.json";

export const Root: React.FC = () => (
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
);
