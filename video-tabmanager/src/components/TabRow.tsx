import React from "react";
import { Theme, fontStack } from "../utils/theme";

type TabRowProps = {
  theme: Theme;
  title: string;
  active: boolean;
  age: string;
  showClose?: boolean;
  label?: string;
};

export const TabRow: React.FC<TabRowProps> = ({
  theme,
  title,
  active,
  age,
  showClose = false,
  label,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "7px 12px 7px 38px",
        gap: 8,
        borderTop: `1px solid ${theme.borderLight}`,
        fontFamily: fontStack,
      }}
    >
      {/* Active dot */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? theme.activeDot : "transparent",
          flexShrink: 0,
        }}
      />

      {/* Title + optional label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            color: active ? theme.textPrimary : theme.textSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {label && (
          <div
            style={{
              fontSize: 10,
              color: theme.textSecondary,
              marginTop: 2,
            }}
          >
            {label}
          </div>
        )}
      </div>

      {/* Age */}
      <span
        style={{
          fontSize: 10,
          color: theme.textTertiary,
          flexShrink: 0,
        }}
      >
        {age}
      </span>

      {/* Close button */}
      {showClose && (
        <span
          style={{
            fontSize: 16,
            color: theme.textTertiary,
            cursor: "default",
            lineHeight: 1,
          }}
        >
          &times;
        </span>
      )}
    </div>
  );
};
