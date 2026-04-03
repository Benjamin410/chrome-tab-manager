import React from "react";
import { Theme, fontStack } from "../utils/theme";

type FilterRowProps = {
  theme: Theme;
  windowLabel?: string;
  groupActive?: boolean;
  labelsActive?: boolean;
  sortLabel?: string;
  showMerge?: boolean;
};

const FilterButton: React.FC<{
  theme: Theme;
  label: string;
  active?: boolean;
  fontSize?: number;
  flex?: number;
}> = ({ theme, label, active = false, fontSize = 11, flex }) => (
  <div
    style={{
      padding: "6px 10px",
      borderRadius: 8,
      border: `1px solid ${active ? theme.accent : theme.border}`,
      fontSize,
      fontFamily: fontStack,
      background: active ? theme.accentBg : theme.bgPrimary,
      color: active ? theme.accent : theme.textSecondary,
      cursor: "default",
      whiteSpace: "nowrap",
      flex: flex,
      textAlign: flex ? "center" : undefined,
    }}
  >
    {label}
  </div>
);

export const FilterRow: React.FC<FilterRowProps> = ({
  theme,
  windowLabel = "All windows",
  groupActive = false,
  labelsActive = false,
  sortLabel = "Sort: Age",
  showMerge = false,
}) => {
  return (
    <div>
      {/* First row: window filter + Group + Labels */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <FilterButton
          theme={theme}
          label={windowLabel}
          fontSize={12}
          flex={1}
        />
        <FilterButton
          theme={theme}
          label="Group"
          active={groupActive}
        />
        <FilterButton
          theme={theme}
          label="Labels"
          active={labelsActive}
        />
      </div>

      {/* Second row: Sort + Merge */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <FilterButton theme={theme} label={sortLabel} />
        {showMerge && (
          <FilterButton theme={theme} label="Merge" />
        )}
      </div>
    </div>
  );
};
