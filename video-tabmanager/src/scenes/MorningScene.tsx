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
import { lightTheme } from "../utils/theme";
import { fontFamily } from "../utils/fonts";
import { TabManagerUI } from "../components/TabManagerUI";
import { DomainGroup } from "../components/DomainGroup";
import { TextOverlay } from "../components/TextOverlay";
import { DomainGroupData } from "../types";

const faviconUrl = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;

const allGroups: DomainGroupData[] = [
  {
    domain: "github.com",
    favicon: faviconUrl("github.com"),
    count: 5,
    age: "2m",
    expanded: false,
    tabs: [],
  },
  {
    domain: "gmail.com",
    favicon: faviconUrl("gmail.com"),
    count: 3,
    age: "5m",
    expanded: true,
    tabs: [
      { title: "Inbox (4) — benjamin@gmail.com", active: true, age: "5m" },
      { title: "Drafts — Gmail", active: false, age: "10m" },
      { title: "Settings — Gmail", active: false, age: "15m" },
    ],
  },
  {
    domain: "youtube.com",
    favicon: faviconUrl("youtube.com"),
    count: 2,
    age: "15m",
    expanded: false,
    tabs: [],
  },
  {
    domain: "stackoverflow.com",
    favicon: faviconUrl("stackoverflow.com"),
    count: 4,
    age: "30m",
    expanded: false,
    tabs: [],
  },
  {
    domain: "developer.mozilla.org",
    favicon: faviconUrl("developer.mozilla.org"),
    count: 2,
    age: "1h",
    expanded: false,
    tabs: [],
  },
];

const searchFilteredGroup: DomainGroupData = {
  domain: "github.com",
  favicon: faviconUrl("github.com"),
  count: 2,
  age: "2m",
  expanded: true,
  tabs: [
    { title: "Pull Request #42 — Fix auth flow", active: true, age: "2m" },
    { title: "Issues · Benjamin410/Chrome", active: false, age: "5m" },
  ],
};

const searchText = "PR #42";

export const MorningScene: React.FC<{ voiceoverFiles: string[] }> = ({
  voiceoverFiles,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const midpoint = Math.floor(durationInFrames * 0.5);

  // Panel entrance animation
  const panelEntrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80, mass: 0.8 },
  });
  const panelTranslateX = interpolate(panelEntrance, [0, 1], [400, 0]);

  // Search phase
  const isSearchPhase = frame >= midpoint;
  const searchFrame = Math.max(0, frame - midpoint);

  // Typing animation: reveal one character every 4 frames
  const typedChars = isSearchPhase
    ? Math.min(Math.floor(searchFrame / 4), searchText.length)
    : 0;
  const searchValue = isSearchPhase
    ? searchText.substring(0, typedChars)
    : undefined;

  // Determine which groups and tab count to show
  const showFiltered = typedChars > 2;
  const tabCount = showFiltered ? 2 : 16;

  return (
    <AbsoluteFill
      style={{
        background: "#f0f4f8",
        fontFamily,
      }}
    >
      {/* Background browser mockup */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 80,
          width: 1000,
          height: 600,
          borderRadius: 12,
          background: "#ffffff",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
          border: "1px solid #dadce0",
          overflow: "hidden",
        }}
      >
        {/* Browser title bar */}
        <div
          style={{
            height: 40,
            background: "#f1f3f4",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            gap: 8,
            borderBottom: "1px solid #dadce0",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#d93025",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#f9ab00",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#188038",
            }}
          />
          <div
            style={{
              flex: 1,
              height: 28,
              background: "#ffffff",
              borderRadius: 14,
              marginLeft: 16,
              border: "1px solid #dadce0",
            }}
          />
        </div>
        {/* Browser content area */}
        <div
          style={{
            height: 560,
            background: "#fafbfc",
          }}
        />
      </div>

      {/* Tab Manager panel sliding in from right */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: 60,
          transform: `translateX(${panelTranslateX}px)`,
        }}
      >
        <TabManagerUI
          theme={lightTheme}
          tabCount={tabCount}
          searchValue={searchValue}
          height={800}
        >
          <div style={{ padding: "0" }}>
            {showFiltered ? (
              <DomainGroup theme={lightTheme} data={searchFilteredGroup} />
            ) : (
              allGroups.map((group, i) => {
                const groupSpring = spring({
                  frame: Math.max(0, frame - 10 - i * 6),
                  fps,
                  config: { damping: 16, stiffness: 100, mass: 0.6 },
                });
                const groupOpacity = interpolate(
                  groupSpring,
                  [0, 1],
                  [0, 1]
                );
                const groupTranslateY = interpolate(
                  groupSpring,
                  [0, 1],
                  [30, 0]
                );

                return (
                  <div
                    key={group.domain}
                    style={{
                      opacity: groupOpacity,
                      transform: `translateY(${groupTranslateY}px)`,
                    }}
                  >
                    <DomainGroup theme={lightTheme} data={group} />
                  </div>
                );
              })
            )}
          </div>
        </TabManagerUI>
      </div>

      {/* Audio: voiceover at start */}
      {voiceoverFiles[2] && (
        <Audio src={staticFile(voiceoverFiles[2])} />
      )}

      {/* Audio: voiceover at midpoint */}
      {voiceoverFiles[3] && (
        <Sequence from={midpoint}>
          <Audio src={staticFile(voiceoverFiles[3])} />
        </Sequence>
      )}

      {/* Text overlay: Phase 1 */}
      <TextOverlay
        text="Everything sorted. Automatically."
        delay={20}
        fontSize={38}
        position="bottom-left"
      />

      {/* Text overlay: Phase 2 */}
      <Sequence from={midpoint}>
        <TextOverlay
          text="Find any tab. Instantly."
          delay={15}
          fontSize={38}
          position="bottom-left"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
