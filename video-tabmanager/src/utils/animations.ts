import { spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export function useSlideUp(delay = 0, distance = 40) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 200 } });
  const y = interpolate(progress, [0, 1], [distance, 0]);
  return { opacity: progress, transform: `translateY(${y}px)` };
}

export function useScalePop(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 15, stiffness: 200 } });
  const scale = interpolate(progress, [0, 1], [0.85, 1.0]);
  return { transform: `scale(${scale})`, opacity: progress };
}

export function useFadeOut(exitFrames = 20) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(
    frame,
    [durationInFrames - exitFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

export function useSpring(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame, fps, delay, config: { damping: 200 } });
}
