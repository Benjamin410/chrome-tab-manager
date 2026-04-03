import React from "react";
import { Theme, fontStack } from "../utils/theme";

type StatusBarProps = {
  theme: Theme;
  tabCount: number;
  showCloseOld?: boolean;
};

export const StatusBar: React.FC<StatusBarProps> = ({
  theme,
  tabCount,
  showCloseOld = false,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
        fontFamily: fontStack,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: theme.textTertiary,
        }}
      >
        {tabCount} tabs
      </span>
      {showCloseOld && (
        <span
          style={{
            fontSize: 11,
            color: theme.accent,
            cursor: "default",
          }}
        >
          Close old (&gt;7d)
        </span>
      )}
    </div>
  );
};
