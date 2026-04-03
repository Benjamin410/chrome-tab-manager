import React from "react";
import { Theme, fontStack } from "../utils/theme";

type SearchBarProps = {
  theme: Theme;
  value?: string;
  placeholder?: string;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  theme,
  value = "",
  placeholder = "Search tabs...",
}) => {
  const displayText = value || placeholder;
  const textColor = value ? theme.textPrimary : theme.textTertiary;

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          position: "relative",
          width: "100%",
        }}
      >
        {/* Search icon */}
        <svg
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 14,
            height: 14,
          }}
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.textTertiary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        {/* Input container */}
        <div
          style={{
            width: "100%",
            padding: "8px 12px 8px 34px",
            borderRadius: 20,
            border: `1px solid ${theme.border}`,
            background: theme.bgTertiary,
            fontSize: 13,
            fontFamily: fontStack,
            color: textColor,
            boxSizing: "border-box",
            lineHeight: "18px",
          }}
        >
          {displayText}
        </div>
      </div>
    </div>
  );
};
