import React from "react";
import { Theme, fontStack } from "../utils/theme";
import { DomainGroupData } from "../types";
import { TabRow } from "./TabRow";

type DomainGroupProps = {
  theme: Theme;
  data: DomainGroupData;
  showHoverButtons?: boolean;
};

export const DomainGroup: React.FC<DomainGroupProps> = ({
  theme,
  data,
  showHoverButtons = false,
}) => {
  return (
    <div
      style={{
        borderBottom: `1px solid ${theme.borderLight}`,
        borderLeft: data.groupColor
          ? `3px solid ${data.groupColor}`
          : undefined,
        fontFamily: fontStack,
      }}
    >
      {/* Domain header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "9px 12px",
          background: theme.bgSecondary,
          gap: 8,
        }}
      >
        {/* Arrow */}
        <span
          style={{
            fontSize: 8,
            color: theme.textTertiary,
            width: 12,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {data.expanded ? "▼" : "▶"}
        </span>

        {/* Favicon */}
        {data.favicon ? (
          <img
            src={data.favicon}
            style={{
              width: 16,
              height: 16,
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 2,
              background: theme.bgTertiary,
              flexShrink: 0,
            }}
          />
        )}

        {/* Domain name */}
        <span
          style={{
            fontWeight: 500,
            fontSize: 13,
            flex: 1,
            color: data.groupColor || theme.textPrimary,
            fontStyle: data.customName ? "italic" : undefined,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {data.customName || data.domain}
        </span>

        {/* Age */}
        <span
          style={{
            fontSize: 10,
            color: theme.textTertiary,
            flexShrink: 0,
          }}
        >
          {data.age}
        </span>

        {/* Hover buttons */}
        {showHoverButtons && (
          <>
            <span
              style={{
                fontSize: 12,
                cursor: "default",
                flexShrink: 0,
              }}
            >
              ✏️
            </span>
            <span
              style={{
                fontSize: 12,
                cursor: "default",
                flexShrink: 0,
              }}
            >
              📁
            </span>
          </>
        )}

        {/* Count badge */}
        <span
          style={{
            background: theme.accent,
            color: theme.bgPrimary,
            borderRadius: 10,
            padding: "1px 8px",
            fontSize: 10,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {data.count}
        </span>

        {/* Close button */}
        {showHoverButtons && (
          <span
            style={{
              fontSize: 14,
              color: theme.danger,
              cursor: "default",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </span>
        )}
      </div>

      {/* Expanded tabs */}
      {data.expanded &&
        data.tabs.map((tab, i) => (
          <TabRow
            key={i}
            theme={theme}
            title={tab.title}
            active={tab.active}
            age={tab.age}
          />
        ))}
    </div>
  );
};
