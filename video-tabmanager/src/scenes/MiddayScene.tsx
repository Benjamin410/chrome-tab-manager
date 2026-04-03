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
    x: -320,
    y: -80,
  },
  {
    label: "Research",
    borderColor: chromeGroupColors.yellow,
    tabs: ["Stack Overflow", "MDN"],
    x: 320,
    y: -40,
  },
  {
    label: "Personal",
    borderColor: chromeGroupColors.green,
    tabs: ["YouTube", "Reddit"],
    x: 0,
    y: 160,
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

  // Phase 1: merge animation
  const mergeProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.8 },
    delay: 15,
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
        const windowOpacity = interpolate(mergeProgress, [0.3, 0.8], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const windowScale = interpolate(mergeProgress, [0.3, 0.8], [1, 0], {
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
              width: 220,
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
            <div style={{ padding: "6px 10px" }}>
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
