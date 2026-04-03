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
import { darkTheme, chromeGroupColors } from "../utils/theme";
import { fontFamily } from "../utils/fonts";
import { TabManagerUI } from "../components/TabManagerUI";
import { DomainGroup } from "../components/DomainGroup";
import { TextOverlay } from "../components/TextOverlay";
import { DomainGroupData } from "../types";

const CODE_LINES: { text: string; color: string }[] = [
  { text: "const express = require('express');", color: "#cba6f7" },
  { text: "const app = express();", color: "#89b4fa" },
  { text: "", color: "transparent" },
  { text: "app.use(express.json());", color: "#a6e3a1" },
  { text: "", color: "transparent" },
  { text: "app.get('/api/tabs', (req, res) => {", color: "#f9e2af" },
  { text: "  const tabs = db.getTabs(req.user);", color: "#89b4fa" },
  { text: "  res.json({ tabs });", color: "#a6e3a1" },
  { text: "});", color: "#f9e2af" },
  { text: "", color: "transparent" },
  { text: "app.listen(3000, () => {", color: "#f9e2af" },
  { text: "  console.log('Server running');", color: "#fab387" },
  { text: "});", color: "#f9e2af" },
];

const domainGroups: DomainGroupData[] = [
  {
    domain: "localhost:3000",
    count: 4,
    age: "1m",
    expanded: true,
    groupColor: chromeGroupColors.green,
    tabs: [
      { title: "Dashboard — My App", active: true, age: "1m" },
      { title: "API Documentation", active: false, age: "3m" },
      { title: "Login Page", active: false, age: "5m" },
      { title: "Settings — My App", active: false, age: "8m" },
    ],
  },
  {
    domain: "localhost:8080",
    count: 2,
    age: "10m",
    expanded: false,
    groupColor: chromeGroupColors.cyan,
    tabs: [],
  },
  {
    domain: "192.168.1.1",
    customName: "Router Admin Panel",
    count: 1,
    age: "3h",
    expanded: false,
    tabs: [],
  },
  {
    domain: "github.com",
    count: 3,
    age: "5m",
    expanded: false,
    groupColor: chromeGroupColors.blue,
    favicon:
      "https://github.githubassets.com/favicons/favicon-dark.svg",
    tabs: [],
  },
];

export const EveningScene: React.FC<{ voiceoverFiles: string[] }> = ({
  voiceoverFiles,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const midpoint = Math.floor(durationInFrames * 0.5);

  // Dark mode wipe transition — circle reveal expanding from center-right
  const wipeProgress = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 60, mass: 0.8 },
  });
  const clipRadius = interpolate(wipeProgress, [0, 1], [0, 150]);
  const clipPath = `circle(${clipRadius}% at 80% 50%)`;

  // Code editor entrance
  const editorSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 20, stiffness: 80, mass: 0.6 },
  });
  const editorOpacity = interpolate(editorSpring, [0, 1], [0, 1]);
  const editorX = interpolate(editorSpring, [0, 1], [-40, 0]);

  // Panel entrance
  const panelSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 20, stiffness: 80, mass: 0.6 },
  });
  const panelOpacity = interpolate(panelSpring, [0, 1], [0, 1]);
  const panelX = interpolate(panelSpring, [0, 1], [40, 0]);

  // Keyboard shortcut indicator (Phase 2)
  const keycapDelay = midpoint + 10;
  const keycapSpring = spring({
    frame: Math.max(0, frame - keycapDelay),
    fps,
    config: { damping: 18, stiffness: 100, mass: 0.5 },
  });
  const keycapOpacity = interpolate(keycapSpring, [0, 1], [0, 1]);
  const keycapY = interpolate(keycapSpring, [0, 1], [20, 0]);

  const totalTabs = domainGroups.reduce((sum, g) => sum + g.count, 0);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        fontFamily,
      }}
    >
      {/* Dark background with wipe reveal */}
      <AbsoluteFill
        style={{
          backgroundColor: darkTheme.bgPrimary,
          clipPath,
        }}
      />

      {/* Voiceover 1: plays at start */}
      <Audio src={staticFile(voiceoverFiles[6])} />

      {/* Voiceover 2: plays at midpoint */}
      <Sequence from={midpoint}>
        <Audio src={staticFile(voiceoverFiles[7])} />
      </Sequence>

      {/* Code editor mockup — left side */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 100,
          width: 900,
          height: 600,
          backgroundColor: "#1e1e2e",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
          opacity: editorOpacity,
          transform: `translateX(${editorX}px)`,
        }}
      >
        {/* Editor title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 14px",
            backgroundColor: "#181825",
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
          <span
            style={{
              marginLeft: 12,
              fontSize: 12,
              color: "#6c7086",
            }}
          >
            server.js — my-app
          </span>
        </div>

        {/* Code lines */}
        <div style={{ padding: "16px 20px" }}>
          {CODE_LINES.map((line, i) => {
            // Stagger code lines appearing
            const lineDelay = 20 + i * 3;
            const lineVisible = frame > lineDelay;
            return (
              <div
                key={i}
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 15,
                  lineHeight: "28px",
                  color: line.color,
                  opacity: lineVisible ? 1 : 0,
                  display: "flex",
                  gap: 16,
                }}
              >
                <span
                  style={{
                    color: "#45475a",
                    width: 28,
                    textAlign: "right",
                    flexShrink: 0,
                    userSelect: "none",
                  }}
                >
                  {i + 1}
                </span>
                <span>{line.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TabManagerUI panel — right side */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: 60,
          opacity: panelOpacity,
          transform: `translateX(${panelX}px)`,
        }}
      >
        <TabManagerUI
          theme={darkTheme}
          isDark={true}
          tabCount={totalTabs}
          height={800}
        >
          {domainGroups.map((group, i) => (
            <DomainGroup key={i} theme={darkTheme} data={group} />
          ))}
        </TabManagerUI>
      </div>

      {/* Keyboard shortcut indicator — Phase 2 */}
      {frame >= keycapDelay && (
        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 120,
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: keycapOpacity,
            transform: `translateY(${keycapY}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 4,
            }}
          >
            <span
              style={{
                backgroundColor: "#313244",
                border: "1px solid #45475a",
                borderRadius: 6,
                padding: "8px 14px",
                fontSize: 20,
                fontWeight: 600,
                color: "#cdd6f4",
                fontFamily,
                boxShadow: "0 2px 0 #45475a",
              }}
            >
              ⌘
            </span>
            <span
              style={{
                backgroundColor: "#313244",
                border: "1px solid #45475a",
                borderRadius: 6,
                padding: "8px 14px",
                fontSize: 20,
                fontWeight: 600,
                color: "#cdd6f4",
                fontFamily,
                boxShadow: "0 2px 0 #45475a",
              }}
            >
              M
            </span>
          </div>
          <span
            style={{
              fontSize: 16,
              color: "#9aa0a6",
              fontWeight: 500,
              fontFamily,
            }}
          >
            Open Tab Manager
          </span>
        </div>
      )}

      {/* Text overlay 1 */}
      <Sequence from={0} durationInFrames={midpoint}>
        <TextOverlay
          text="localhost:3000 and :8080 — each gets its own group."
          delay={20}
          fontSize={34}
          position="bottom-left"
          fadeOutAfter={midpoint - 20}
        />
      </Sequence>

      {/* Text overlay 2 — from midpoint */}
      <Sequence from={midpoint}>
        <TextOverlay
          text="Built for developers. By a developer."
          delay={15}
          fontSize={38}
          position="bottom-left"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
