import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { fontFamily } from "../utils/fonts";

type TextOverlayProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  position?: "bottom-left" | "bottom-center" | "center";
};

const getPositionStyle = (
  position: "bottom-left" | "bottom-center" | "center"
): React.CSSProperties => {
  switch (position) {
    case "bottom-left":
      return { bottom: 60, left: 60 };
    case "bottom-center":
      return {
        bottom: 60,
        left: "50%",
        transform: "translateX(-50%)",
      };
    case "center":
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
  }
};

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  delay = 0,
  fontSize = 36,
  color = "#ffffff",
  position = "bottom-center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayedFrame = Math.max(0, frame - delay);

  const springValue = spring({
    frame: delayedFrame,
    fps,
    config: {
      damping: 20,
      stiffness: 100,
      mass: 0.5,
    },
  });

  const opacity = interpolate(springValue, [0, 1], [0, 1]);
  const translateY = interpolate(springValue, [0, 1], [20, 0]);

  const positionStyles = getPositionStyle(position);

  // Merge transform if position already has one
  let finalTransform = `translateY(${translateY}px)`;
  if (position === "bottom-center") {
    finalTransform = `translateX(-50%) translateY(${translateY}px)`;
  } else if (position === "center") {
    finalTransform = `translate(-50%, -50%) translateY(${translateY}px)`;
  }

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles,
        transform: finalTransform,
        opacity,
        fontFamily,
        fontSize,
        color,
        fontWeight: 700,
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};
