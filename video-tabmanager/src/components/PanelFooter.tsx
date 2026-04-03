import React from "react";
import { Theme, fontStack } from "../utils/theme";

type PanelFooterProps = {
  theme: Theme;
  language?: string;
  isDark?: boolean;
  bannerPosition?: "left" | "right" | "off";
};

const BannerButton: React.FC<{
  theme: Theme;
  label: string;
  active?: boolean;
}> = ({ theme, label, active = false }) => (
  <span
    style={{
      padding: "4px 6px",
      borderRadius: 4,
      fontSize: 10,
      background: active ? theme.accentBg : "transparent",
      color: active ? theme.accent : theme.textTertiary,
      border: active ? `1px solid ${theme.accent}` : "1px solid transparent",
      cursor: "default",
      lineHeight: 1,
    }}
  >
    {label}
  </span>
);

export const PanelFooter: React.FC<PanelFooterProps> = ({
  theme,
  language = "en",
  isDark = false,
  bannerPosition = "right",
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderTop: `1px solid ${theme.border}`,
        background: theme.bgSecondary,
        fontFamily: fontStack,
      }}
    >
      {/* Banner controls */}
      <BannerButton
        theme={theme}
        label="◀"
        active={bannerPosition === "left"}
      />
      <BannerButton
        theme={theme}
        label="▶"
        active={bannerPosition === "right"}
      />
      <BannerButton
        theme={theme}
        label="✕"
        active={bannerPosition === "off"}
      />

      <div style={{ flex: 1 }} />

      {/* Language select */}
      <span
        style={{
          padding: "4px 6px",
          borderRadius: 6,
          fontSize: 11,
          color: theme.textSecondary,
          border: `1px solid ${theme.border}`,
          background: theme.bgPrimary,
          cursor: "default",
          fontFamily: fontStack,
        }}
      >
        {language.toUpperCase()}
      </span>

      {/* Theme toggle */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.bgTertiary,
          cursor: "default",
          fontSize: 16,
        }}
      >
        {isDark ? "🌙" : "☀️"}
      </div>
    </div>
  );
};
