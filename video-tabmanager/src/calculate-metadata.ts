import { CalculateMetadataFunction } from "remotion";
import { getAudioDuration } from "mediabunny";
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

export const calculateTabManagerVideoMetadata: CalculateMetadataFunction<TabManagerVideoProps> = async ({ props, abortSignal }) => {
  let totalAudioDuration = 0;

  if (props.voiceoverFiles.length > 0) {
    for (const file of props.voiceoverFiles) {
      try {
        const duration = await getAudioDuration(`public/${file}`, abortSignal);
        totalAudioDuration += duration;
      } catch {
        // File might not exist during preview
      }
    }
  }

  const effectiveDuration = Math.max(TARGET_DURATION_SECONDS, totalAudioDuration + 2);
  const netFrames = Math.ceil(effectiveDuration * FPS);
  const rawFrames = netFrames + NUM_TRANSITIONS * TRANSITION_FRAMES;

  return {
    durationInFrames: rawFrames,
    fps: FPS,
    width: 1920,
    height: 1080,
    props,
  };
};
