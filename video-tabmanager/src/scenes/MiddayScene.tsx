import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Audio,
  staticFile,
  Sequence,
} from "remotion";
import { lightTheme, chromeGroupColors } from "../utils/theme";
import { fontFamily } from "../utils/fonts";
import { TabManagerUI } from "../components/TabManagerUI";
import { DomainGroup } from "../components/DomainGroup";
import { TextOverlay } from "../components/TextOverlay";
import { DomainGroupData } from "../types";

const WINDOWS = [
  {
    label: "Work",
    borderColor: chromeGroupColors.blue,
    tabs: ["Jira", "Slack", "Google Docs"],
    x: -440,
    y: -120,
    pageContent: [
      { h: 14, w: "80%", color: "#0052cc", mb: 8 },
      { h: 10, w: "100%", color: "#e4e6e8", mb: 4 },
      { h: 10, w: "90%", color: "#e4e6e8", mb: 4 },
      { h: 24, w: "100%", color: "#f4f5f7", mb: 4 },
      { h: 24, w: "100%", color: "#ffffff", mb: 4 },
      { h: 24, w: "100%", color: "#f4f5f7", mb: 0 },
    ],
  },
  {
    label: "Research",
    borderColor: chromeGroupColors.yellow,
    tabs: ["Stack Overflow", "MDN"],
    x: 440,
    y: -60,
    pageContent: [
      { h: 12, w: "70%", color: "#3b4045", mb: 6 },
      { h: 8, w: "100%", color: "#e3e6e8", mb: 3 },
      { h: 8, w: "85%", color: "#e3e6e8", mb: 8 },
      { h: 20, w: "100%", color: "#fdf7e2", mb: 4 },
      { h: 8, w: "90%", color: "#e3e6e8", mb: 3 },
      { h: 8, w: "75%", color: "#e3e6e8", mb: 0 },
    ],
  },
  {
    label: "Personal",
    borderColor: chromeGroupColors.green,
    tabs: ["YouTube", "Reddit"],
    x: 0,
    y: 220,
    pageContent: [
      { h: 40, w: "100%", color: "#1a1a1a", mb: 6 },
      { h: 10, w: "60%", color: "#e5e5e5", mb: 4 },
      { h: 8, w: "80%", color: "#f0f0f0", mb: 3 },
      { h: 8, w: "50%", color: "#f0f0f0", mb: 0 },
    ],
  },
];

const makeDomainGroups = (isGroupPhase: boolean): DomainGroupData[] => [
  {
    domain: "jira.com",
    count: 3,
    age: "2h",
    expanded: false,
    tabs: [],
    groupColor: isGroupPhase ? chromeGroupColors.blue : undefined,
  },
  {
    domain: "slack.com",
    count: 2,
    age: "1h",
    expanded: false,
    tabs: [],
    groupColor: isGroupPhase ? chromeGroupColors.blue : undefined,
  },
  {
    domain: "stackoverflow.com",
    count: 1,
    age: "30m",
    expanded: false,
    tabs: [],
    groupColor: isGroupPhase ? chromeGroupColors.yellow : undefined,
  },
  {
    domain: "developer.mozilla.org",
    count: 1,
    age: "25m",
    expanded: false,
    tabs: [],
    groupColor: isGroupPhase ? chromeGroupColors.yellow : undefined,
  },
  {
    domain: "youtube.com",
    count: 1,
    age: "15m",
    expanded: false,
    tabs: [],
    groupColor: isGroupPhase ? chromeGroupColors.green : undefined,
  },
  {
    domain: "reddit.com",
    count: 1,
    age: "10m",
    expanded: false,
    tabs: [],
    groupColor: isGroupPhase ? chromeGroupColors.green : undefined,
  },
];

export const MiddayScene: React.FC<{ voiceoverFiles: string[] }> = ({
  voiceoverFiles,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const midpoint = Math.floor(durationInFrames * 0.5);
  const isGroupPhase = frame >= midpoint;

  // Phase 1: merge animation (slower so windows stay visible longer)
  const mergeProgress = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 40, mass: 1.2 },
    delay: 25,
  });

  // Panel fade-in (slightly after merge starts)
  const panelOpacity = interpolate(mergeProgress, [0.4, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: group color pop
  const groupColorProgress = isGroupPhase
    ? spring({
        frame: frame - midpoint,
        fps,
        config: { damping: 15, stiffness: 200 },
      })
    : 0;

  const domainGroups = makeDomainGroups(isGroupPhase);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a2e",
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      {/* Voiceover 1: "All windows. One panel." */}
      {voiceoverFiles?.[4] ? <Audio src={staticFile(voiceoverFiles[4])} /> : null}

      {/* Voiceover 2: "Color-coded groups. One click." */}
      <Sequence from={midpoint}>
        {voiceoverFiles?.[5] ? <Audio src={staticFile(voiceoverFiles[5])} /> : null}
      </Sequence>

      {/* Floating window cards */}
      {WINDOWS.map((win, i) => {
        const windowOpacity = interpolate(mergeProgress, [0.5, 0.95], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const windowScale = interpolate(mergeProgress, [0.5, 0.95], [1, 0.3], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const xOffset = interpolate(mergeProgress, [0, 1], [win.x, 0], {
          extrapolateRight: "clamp",
        });
        const yOffset = interpolate(mergeProgress, [0, 1], [win.y, 0], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px)) scale(${windowScale})`,
              opacity: windowOpacity,
              width: 340,
              backgroundColor: "#2d2d44",
              borderRadius: 10,
              border: `2px solid ${win.borderColor}`,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Window title bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 10px",
                backgroundColor: "#23233a",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#ff5f57",
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#febc2e",
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#28c840",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "#aaa",
                  marginLeft: 6,
                  fontWeight: 500,
                }}
              >
                {win.label}
              </span>
            </div>

            {/* Tab list */}
            <div style={{ padding: "6px 10px", borderBottom: "1px solid #3c3c5a" }}>
              {win.tabs.map((tab, j) => (
                <div
                  key={j}
                  style={{
                    fontSize: 11,
                    color: "#ccc",
                    padding: "4px 0",
                    borderBottom:
                      j < win.tabs.length - 1
                        ? "1px solid #3c3c5a"
                        : undefined,
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Webpage content mockup */}
            <div style={{ padding: "8px 10px", background: "#ffffff", minHeight: 60 }}>
              {win.pageContent.map((block, k) => (
                <div
                  key={k}
                  style={{
                    height: block.h,
                    width: block.w,
                    backgroundColor: block.color,
                    borderRadius: 2,
                    marginBottom: block.mb,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Tab Manager panel */}
      <div
        style={{
          opacity: panelOpacity,
          transform: `scale(${interpolate(panelOpacity, [0, 1], [0.9, 1])})`,
        }}
      >
        <TabManagerUI
          theme={lightTheme}
          tabCount={9}
          windowLabel="All Windows"
          width={460}
          height={880}
        >
          <div style={{ padding: "0 0 4px" }}>
            {domainGroups.map((group, i) => (
              <div
                key={i}
                style={{
                  transform:
                    isGroupPhase && group.groupColor
                      ? `scale(${interpolate(
                          groupColorProgress,
                          [0, 0.5, 1],
                          [1, 1.03, 1]
                        )})`
                      : undefined,
                }}
              >
                <DomainGroup theme={lightTheme} data={group} />
              </div>
            ))}
          </div>
        </TabManagerUI>
      </div>

      {/* Text overlay 1: "All windows. One panel." */}
      <Sequence from={0} durationInFrames={midpoint}>
        <TextOverlay
          text="All windows. One panel."
          delay={25}
          fontSize={38}
          position="bottom-left"
          fadeOutAfter={midpoint - 20}
        />
      </Sequence>

      {/* Text overlay 2: "Color-coded groups. One click." */}
      <Sequence from={midpoint}>
        <TextOverlay
          text="Color-coded groups. One click."
          delay={15}
          fontSize={38}
          position="bottom-left"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
