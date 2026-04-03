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
      {voiceoverFiles?.[8] ? <Audio src={staticFile(voiceoverFiles[8])} /> : null}

      {/* Voiceover 2: plays at phase switch */}
      <Sequence from={phaseSwitch}>
        {voiceoverFiles?.[9] ? <Audio src={staticFile(voiceoverFiles[9])} /> : null}
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
              fontSize: 36,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 40,
            }}
          >
            BEFORE
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              justifyContent: "center",
              maxWidth: 500,
              marginBottom: 30,
            }}
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 64,
                  height: 16,
                  backgroundColor: "#3c3c5a",
                  borderRadius: 4,
                }}
              />
            ))}
          </div>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ff5f57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
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
              fontSize: 36,
              fontWeight: 700,
              color: lightTheme.textPrimary,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 40,
            }}
          >
            AFTER
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 30,
            }}
          >
            {tabGroups.map((group) => (
              <div
                key={group.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: `${group.color}18`,
                  border: `2px solid ${group.color}`,
                  borderRadius: 24,
                  padding: "12px 36px",
                  fontSize: 24,
                  fontWeight: 600,
                  color: group.color,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    backgroundColor: group.color,
                  }}
                />
                {group.label}
              </div>
            ))}
          </div>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#188038" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
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
              width: 128,
              height: 128,
              transform: `scale(${iconScale})`,
              marginBottom: 16,
            }}
          />

          {/* Title */}
          <div
            style={{
              fontSize: 64,
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
              fontSize: 38,
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
              padding: "18px 52px",
              borderRadius: 32,
              fontSize: 30,
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
              width: 380,
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
