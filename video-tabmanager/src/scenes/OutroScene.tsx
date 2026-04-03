import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Audio,
  staticFile,
  Img,
  Sequence,
} from "remotion";
import { fontFamily } from "../utils/fonts";
import { lightTheme, chromeGroupColors } from "../utils/theme";

export const OutroScene: React.FC<{ voiceoverFiles: string[] }> = ({
  voiceoverFiles,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const phaseSwitch = Math.floor(durationInFrames * 0.55);

  // Phase 1: Before/After split screen
  const splitWidth = spring({
    frame,
    fps,
    from: 0,
    to: 50,
    config: { damping: 15, stiffness: 80 },
  });

  // Phase 2 fade: split screen fades out
  const splitOpacity =
    frame >= phaseSwitch
      ? interpolate(frame, [phaseSwitch, phaseSwitch + 15], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  // Phase 2: Logo + CTA animations
  const phase2Frame = Math.max(0, frame - phaseSwitch);

  const iconScale = spring({
    frame: phase2Frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 10, stiffness: 100 },
  });

  const titleTranslateY = spring({
    frame: phase2Frame,
    fps,
    from: 30,
    to: 0,
    config: { damping: 12, stiffness: 80 },
  });

  const titleOpacity = spring({
    frame: phase2Frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12, stiffness: 80 },
  });

  const screenshotOpacity = interpolate(phase2Frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA pulse animation
  const pulseScale =
    1 + Math.sin(phase2Frame * 0.15) * 0.03;

  // Fade to black: last 15 frames
  const fadeToBlackOpacity = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const showPhase2 = frame >= phaseSwitch;

  const tabGroups = [
    { label: "Work", color: chromeGroupColors.blue },
    { label: "Dev", color: chromeGroupColors.green },
    { label: "Research", color: chromeGroupColors.yellow },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        fontFamily,
      }}
    >
      {/* Voiceover 1: plays at start */}
      <Audio src={staticFile(voiceoverFiles[8])} />

      {/* Voiceover 2: plays at phase switch */}
      <Sequence from={phaseSwitch}>
        <Audio src={staticFile(voiceoverFiles[9])} />
      </Sequence>

      {/* Phase 1: Before/After Split Screen */}
      <AbsoluteFill style={{ opacity: splitOpacity }}>
        {/* LEFT side - Before */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${100 - splitWidth}%`,
            height: "100%",
            backgroundColor: "#1a1a2e",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 30,
            }}
          >
            BEFORE
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              justifyContent: "center",
              maxWidth: 300,
              marginBottom: 20,
            }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 48,
                  height: 12,
                  backgroundColor: "#3c3c5a",
                  borderRadius: 3,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 48 }}>😵‍💫</div>
        </div>

        {/* RIGHT side - After */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: `${splitWidth}%`,
            height: "100%",
            backgroundColor: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: lightTheme.textPrimary,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 30,
            }}
          >
            AFTER
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {tabGroups.map((group) => (
              <div
                key={group.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: `${group.color}18`,
                  border: `2px solid ${group.color}`,
                  borderRadius: 20,
                  padding: "8px 24px",
                  fontSize: 18,
                  fontWeight: 600,
                  color: group.color,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: group.color,
                  }}
                />
                {group.label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 48 }}>😌</div>
        </div>

        {/* Divider */}
        {splitWidth > 1 && (
          <div
            style={{
              position: "absolute",
              left: `${100 - splitWidth}%`,
              top: 0,
              width: 2,
              height: "100%",
              backgroundColor: lightTheme.border,
            }}
          />
        )}
      </AbsoluteFill>

      {/* Phase 2: Logo + CTA */}
      {showPhase2 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: splitOpacity === 0 ? 1 : 0,
          }}
        >
          {/* Icon */}
          <Img
            src={staticFile("images/icon128.png")}
            style={{
              width: 96,
              height: 96,
              transform: `scale(${iconScale})`,
              marginBottom: 16,
            }}
          />

          {/* Title */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#202124",
              transform: `translateY(${titleTranslateY}px)`,
              opacity: titleOpacity,
              marginBottom: 8,
            }}
          >
            Tab Manager
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 32,
              color: "#5f6368",
              transform: `translateY(${titleTranslateY}px)`,
              opacity: titleOpacity,
              marginBottom: 32,
            }}
          >
            Your tabs. Finally organized.
          </div>

          {/* CTA Button */}
          <div
            style={{
              backgroundColor: lightTheme.accent,
              color: "#ffffff",
              padding: "14px 40px",
              borderRadius: 28,
              fontSize: 24,
              fontWeight: 600,
              transform: `scale(${pulseScale})`,
              opacity: titleOpacity,
              marginBottom: 28,
            }}
          >
            Free on Chrome Web Store
          </div>

          {/* Screenshot */}
          <Img
            src={staticFile("images/screenshot-light.png")}
            style={{
              width: 280,
              borderRadius: 8,
              opacity: screenshotOpacity,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Fade to black */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000000",
          opacity: fadeToBlackOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
