import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Audio,
  Sequence,
  staticFile,
} from "remotion";
import { fontFamily } from "../utils/fonts";
import { TextOverlay } from "../components/TextOverlay";

const TAB_NAMES = [
  "Gmail",
  "YouTube",
  "GitHub",
  "Reddit",
  "Slack",
  "Jira",
  "Google Docs",
  "Stack Overflow",
  "Twitter",
  "LinkedIn",
  "Figma",
  "Notion",
  "AWS Console",
  "ChatGPT",
  "Spotify",
  "Google Maps",
  "Amazon",
  "Netflix",
  "Wikipedia",
  "Trello",
  "VS Code Web",
  "Confluence",
  "Google Drive",
  "Calendar",
  "Discord",
  "Zoom",
  "Canva",
  "Medium",
  "Hacker News",
  "CodePen",
  "NPM",
  "Docker Hub",
  "Vercel",
  "Stripe",
  "Google Analytics",
  "Firebase",
  "Sentry",
  "Datadog",
  "PagerDuty",
  "Grafana",
  "Jenkins",
  "CircleCI",
  "Bitbucket",
  "GitLab",
  "Heroku",
];

export const ColdOpenScene: React.FC<{ voiceoverFiles: string[] }> = ({
  voiceoverFiles,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Number of tabs: 1 → 45 over first 100 frames
  const tabCount = Math.min(
    45,
    Math.max(1, Math.floor(interpolate(frame, [0, 100], [1, 45], {
      extrapolateRight: "clamp",
    })))
  );

  // Tab width shrinks as count grows: 140px → 18px
  const tabWidth = interpolate(tabCount, [1, 45], [140, 18], {
    extrapolateRight: "clamp",
  });

  // Wobble effect — intensity grows with frame
  const wobbleIntensity = interpolate(frame, [0, durationInFrames], [0, 8], {
    extrapolateRight: "clamp",
  });
  const wobbleX = Math.sin(frame * 0.8) * wobbleIntensity;
  const wobbleY = Math.cos(frame * 0.6) * wobbleIntensity * 0.5;

  // Zoom transition at end (last 30 frames)
  const zoomStart = durationInFrames - 30;
  const scale = interpolate(frame, [zoomStart, durationInFrames], [1, 2.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [zoomStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const midpoint = Math.floor(durationInFrames * 0.5);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a2e",
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      {/* Voiceover 1: plays at start */}
      <Audio src={staticFile(voiceoverFiles[0])} />

      {/* Voiceover 2: plays at midpoint */}
      <Sequence from={midpoint}>
        <Audio src={staticFile(voiceoverFiles[1])} />
      </Sequence>

      {/* Browser window with wobble and zoom */}
      <div
        style={{
          width: 900,
          backgroundColor: "#2d2d44",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          transform: `translate(${wobbleX}px, ${wobbleY}px) scale(${scale})`,
          opacity,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            backgroundColor: "#23233a",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#ff5f57",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#febc2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#28c840",
            }}
          />
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            padding: "4px 8px 0",
            backgroundColor: "#23233a",
            overflow: "hidden",
            height: 32,
            alignItems: "flex-end",
          }}
        >
          {Array.from({ length: tabCount }).map((_, i) => (
            <div
              key={i}
              style={{
                width: tabWidth,
                minWidth: 14,
                height: 28,
                backgroundColor: i === 0 ? "#2d2d44" : "#1e1e32",
                borderRadius: "6px 6px 0 0",
                marginRight: 1,
                padding: "4px 4px",
                fontSize: Math.min(11, tabWidth * 0.55),
                color: "#aaa",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              {tabWidth > 30 ? TAB_NAMES[i % TAB_NAMES.length] : ""}
            </div>
          ))}
        </div>

        {/* Content area */}
        <div
          style={{
            height: 300,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 80,
          }}
        >
          😵‍💫
        </div>
      </div>

      {/* Text overlay 1 */}
      <TextOverlay
        text="We've all been here."
        delay={15}
        fontSize={42}
        position="bottom-center"
      />

      {/* Text overlay 2 */}
      <Sequence from={midpoint}>
        <TextOverlay
          text="But today is different."
          delay={5}
          fontSize={42}
          position="bottom-center"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
