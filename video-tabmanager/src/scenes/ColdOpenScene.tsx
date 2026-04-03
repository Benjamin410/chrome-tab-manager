import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
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

      {/* Browser window with wobble */}
      <div
        style={{
          width: 1400,
          backgroundColor: "#2d2d44",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          transform: `translate(${wobbleX}px, ${wobbleY}px)`,
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

        {/* Content area — fake webpage */}
        <div
          style={{
            height: 500,
            backgroundColor: "#ffffff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Navbar */}
          <div
            style={{
              height: 44,
              backgroundColor: "#1e293b",
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              gap: 24,
            }}
          >
            <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: 16 }}>
              SiteName
            </div>
            {["Home", "Products", "Blog", "Pricing", "Contact"].map((item) => (
              <div
                key={item}
                style={{ color: "#94a3b8", fontSize: 13 }}
              >
                {item}
              </div>
            ))}
            <div style={{ marginLeft: "auto", width: 140, height: 26, borderRadius: 4, backgroundColor: "#334155" }} />
          </div>

          <div style={{ display: "flex", height: 456 }}>
            {/* Main content */}
            <div style={{ flex: 1, padding: "20px 28px" }}>
              {/* Hero text block */}
              <div style={{ height: 18, width: "70%", backgroundColor: "#e2e8f0", borderRadius: 4, marginBottom: 10 }} />
              <div style={{ height: 14, width: "90%", backgroundColor: "#f1f5f9", borderRadius: 4, marginBottom: 6 }} />
              <div style={{ height: 14, width: "80%", backgroundColor: "#f1f5f9", borderRadius: 4, marginBottom: 6 }} />
              <div style={{ height: 14, width: "60%", backgroundColor: "#f1f5f9", borderRadius: 4, marginBottom: 20 }} />

              {/* Image placeholder row */}
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ width: 180, height: 110, backgroundColor: "#cbd5e1", borderRadius: 8, display: "flex", justifyContent: "center", alignItems: "center", color: "#64748b", fontSize: 24 }}>
                  🖼️
                </div>
                <div style={{ width: 180, height: 110, backgroundColor: "#cbd5e1", borderRadius: 8, display: "flex", justifyContent: "center", alignItems: "center", color: "#64748b", fontSize: 24 }}>
                  🖼️
                </div>
                <div style={{ width: 180, height: 110, backgroundColor: "#cbd5e1", borderRadius: 8, display: "flex", justifyContent: "center", alignItems: "center", color: "#64748b", fontSize: 24 }}>
                  🖼️
                </div>
              </div>

              {/* More text lines */}
              <div style={{ height: 16, width: "50%", backgroundColor: "#e2e8f0", borderRadius: 4, marginBottom: 10 }} />
              <div style={{ height: 12, width: "95%", backgroundColor: "#f1f5f9", borderRadius: 4, marginBottom: 5 }} />
              <div style={{ height: 12, width: "88%", backgroundColor: "#f1f5f9", borderRadius: 4, marginBottom: 5 }} />
              <div style={{ height: 12, width: "76%", backgroundColor: "#f1f5f9", borderRadius: 4, marginBottom: 5 }} />
              <div style={{ height: 12, width: "82%", backgroundColor: "#f1f5f9", borderRadius: 4, marginBottom: 16 }} />

              {/* Card row */}
              <div style={{ display: "flex", gap: 14 }}>
                {[1, 2, 3, 4].map((c) => (
                  <div
                    key={c}
                    style={{
                      flex: 1,
                      height: 90,
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: 10,
                    }}
                  >
                    <div style={{ height: 10, width: "60%", backgroundColor: "#e2e8f0", borderRadius: 3, marginBottom: 8 }} />
                    <div style={{ height: 8, width: "90%", backgroundColor: "#f1f5f9", borderRadius: 3, marginBottom: 4 }} />
                    <div style={{ height: 8, width: "70%", backgroundColor: "#f1f5f9", borderRadius: 3 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div
              style={{
                width: 240,
                backgroundColor: "#f8fafc",
                borderLeft: "1px solid #e2e8f0",
                padding: "18px 16px",
              }}
            >
              <div style={{ height: 14, width: "80%", backgroundColor: "#e2e8f0", borderRadius: 4, marginBottom: 12 }} />
              <div style={{ height: 60, backgroundColor: "#cbd5e1", borderRadius: 8, marginBottom: 14 }} />
              <div style={{ height: 10, width: "90%", backgroundColor: "#f1f5f9", borderRadius: 3, marginBottom: 5 }} />
              <div style={{ height: 10, width: "70%", backgroundColor: "#f1f5f9", borderRadius: 3, marginBottom: 14 }} />
              <div style={{ height: 14, width: "60%", backgroundColor: "#e2e8f0", borderRadius: 4, marginBottom: 12 }} />
              <div style={{ height: 48, backgroundColor: "#cbd5e1", borderRadius: 8, marginBottom: 14 }} />
              <div style={{ height: 10, width: "85%", backgroundColor: "#f1f5f9", borderRadius: 3, marginBottom: 5 }} />
              <div style={{ height: 10, width: "65%", backgroundColor: "#f1f5f9", borderRadius: 3 }} />
            </div>
          </div>

          {/* Emoji overlay — fades in as chaos peaks */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 100,
              opacity: interpolate(frame, [60, 100], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              pointerEvents: "none",
              background: `radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 50%, transparent 70%)`,
            }}
          >
            😵‍💫
          </div>
        </div>
      </div>

      {/* Text overlay 1 */}
      <Sequence from={0} durationInFrames={midpoint}>
        <TextOverlay
          text="We've all been here."
          delay={15}
          fontSize={42}
          position="bottom-center"
          fadeOutAfter={midpoint - 20}
        />
      </Sequence>

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
