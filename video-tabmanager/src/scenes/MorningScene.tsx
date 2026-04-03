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
          left: 40,
          top: 40,
          width: 1380,
          height: 900,
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
        {/* Browser content area — shows matching webpage */}
        <div
          style={{
            height: 856,
            background: "#fafbfc",
            padding: "20px 24px",
            overflow: "hidden",
          }}
        >
          {/* GitHub-style page when showing github tabs */}
          {!showFiltered ? (
            <>
              {/* Nav bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, borderBottom: "1px solid #d0d7de", paddingBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#24292f" }} />
                <div style={{ height: 14, width: 80, background: "#d0d7de", borderRadius: 4 }} />
                <div style={{ height: 14, width: 60, background: "#d0d7de", borderRadius: 4 }} />
                <div style={{ height: 14, width: 70, background: "#d0d7de", borderRadius: 4 }} />
                <div style={{ marginLeft: "auto", height: 28, width: 120, background: "#f6f8fa", border: "1px solid #d0d7de", borderRadius: 6 }} />
              </div>
              {/* Repo header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: "#d0d7de" }} />
                <div style={{ height: 16, width: 200, background: "#0969da", borderRadius: 4 }} />
              </div>
              <div style={{ height: 12, width: "60%", background: "#656d76", borderRadius: 3, marginBottom: 16, opacity: 0.4 }} />
              {/* Tabs row */}
              <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #d0d7de", marginBottom: 16 }}>
                {["Code", "Issues", "Pull requests", "Actions"].map((t, i) => (
                  <div key={t} style={{ padding: "8px 16px", fontSize: 12, color: i === 0 ? "#24292f" : "#656d76", borderBottom: i === 0 ? "2px solid #fd8c73" : "none", fontWeight: i === 0 ? 600 : 400 }}>{t}</div>
                ))}
              </div>
              {/* File list */}
              {["src", "tests", "docs", "package.json", "README.md"].map((f, i) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderBottom: "1px solid #d0d7de" }}>
                  <div style={{ width: 16, height: 16, background: i < 3 ? "#54aeff" : "#57606a", borderRadius: 2, opacity: 0.5 }} />
                  <div style={{ fontSize: 12, color: "#0969da" }}>{f}</div>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: "#656d76", opacity: 0.6 }}>2 days ago</div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* GitHub PR page when search filters to PR */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, borderBottom: "1px solid #d0d7de", paddingBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#24292f" }} />
                <div style={{ height: 14, width: 80, background: "#d0d7de", borderRadius: 4 }} />
                <div style={{ height: 14, width: 60, background: "#d0d7de", borderRadius: 4 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ background: "#1a7f37", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>Open</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#24292f" }}>Fix auth flow</div>
                <div style={{ fontSize: 18, color: "#656d76" }}>#42</div>
              </div>
              <div style={{ height: 12, width: "40%", background: "#656d76", borderRadius: 3, marginBottom: 20, opacity: 0.3 }} />
              {/* PR diff mockup */}
              <div style={{ background: "#f6f8fa", border: "1px solid #d0d7de", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #d0d7de", fontSize: 12, color: "#24292f", fontWeight: 600 }}>src/auth.ts</div>
                <div style={{ padding: "4px 12px", background: "#dafbe1", fontSize: 11, color: "#1a7f37", fontFamily: "monospace" }}>+ const token = await refreshToken();</div>
                <div style={{ padding: "4px 12px", background: "#dafbe1", fontSize: 11, color: "#1a7f37", fontFamily: "monospace" }}>+ validateSession(token);</div>
                <div style={{ padding: "4px 12px", background: "#ffebe9", fontSize: 11, color: "#cf222e", fontFamily: "monospace" }}>- legacyAuth();</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab Manager panel sliding in from right */}
      <div
        style={{
          position: "absolute",
          right: 30,
          top: 30,
          transform: `translateX(${panelTranslateX}px)`,
        }}
      >
        <TabManagerUI
          theme={lightTheme}
          tabCount={tabCount}
          searchValue={searchValue}
          width={440}
          height={960}
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
      {voiceoverFiles?.[2] ? <Audio src={staticFile(voiceoverFiles[2])} /> : null}

      {/* Audio: voiceover at midpoint */}
      <Sequence from={midpoint}>
        {voiceoverFiles?.[3] ? <Audio src={staticFile(voiceoverFiles[3])} /> : null}
      </Sequence>

      {/* Text overlay: Phase 1 */}
      <Sequence from={0} durationInFrames={midpoint}>
        <TextOverlay
          text="Everything sorted. Automatically."
          delay={20}
          fontSize={38}
          position="bottom-left"
          fadeOutAfter={midpoint - 20}
        />
      </Sequence>

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
