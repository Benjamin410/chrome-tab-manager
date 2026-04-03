import React from "react";
import { Theme, fontStack } from "../utils/theme";
import { SearchBar } from "./SearchBar";
import { FilterRow } from "./FilterRow";
import { StatusBar } from "./StatusBar";
import { PanelFooter } from "./PanelFooter";

type TabManagerUIProps = {
  theme: Theme;
  isDark?: boolean;
  tabCount: number;
  searchValue?: string;
  windowLabel?: string;
  language?: string;
  children: React.ReactNode;
  width?: number;
  height?: number;
};

export const TabManagerUI: React.FC<TabManagerUIProps> = ({
  theme,
  isDark = false,
  tabCount,
  searchValue,
  windowLabel,
  language,
  children,
  width = 380,
  height = 700,
}) => {
  return (
    <div
      style={{
        fontFamily: fontStack,
        fontSize: 13,
        background: theme.bgPrimary,
        width,
        height,
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: `0 8px 32px ${theme.shadow}`,
        border: `1px solid ${theme.border}`,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 12px 8px",
          background: theme.bgPrimary,
        }}
      >
        <SearchBar theme={theme} value={searchValue} />
        <FilterRow theme={theme} windowLabel={windowLabel} />
        <StatusBar theme={theme} tabCount={tabCount} />
      </div>

      {/* Scrollable area */}
      <div
        style={{
          flex: 1,
          overflowY: "hidden",
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <PanelFooter
        theme={theme}
        language={language}
        isDark={isDark}
      />
    </div>
  );
};
