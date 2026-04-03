import { CalculateMetadataFunction } from "remotion";
import type { TabManagerVideoProps } from "./schema";

const FPS = 30;
const TRANSITION_FRAMES = 15;
const NUM_TRANSITIONS = 4;
const TARGET_DURATION_SECONDS = 45;

export const DEFAULT_SCENE_FRAMES = {
  coldOpen: 240,    // 8s
  morning: 300,     // 10s
  midday: 300,      // 10s
  evening: 300,     // 10s
  outro: 210,       // 7s
};

export const calculateTabManagerVideoMetadata: CalculateMetadataFunction<TabManagerVideoProps> = async ({ props }) => {
  // Use fixed target duration; audio sync is handled per-scene
  const netFrames = Math.ceil(TARGET_DURATION_SECONDS * FPS);
  const rawFrames = netFrames + NUM_TRANSITIONS * TRANSITION_FRAMES;

  return {
    durationInFrames: rawFrames,
    fps: FPS,
    width: 1920,
    height: 1080,
    props,
  };
};
