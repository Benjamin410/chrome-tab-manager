export const lightTheme = {
  bgPrimary: "#ffffff",
  bgSecondary: "#f8f9fa",
  bgTertiary: "#f1f3f4",
  bgHover: "#e8eaed",
  textPrimary: "#202124",
  textSecondary: "#5f6368",
  textTertiary: "#80868b",
  accent: "#1a73e8",
  accentHover: "#1557b0",
  accentBg: "#e8f0fe",
  border: "#dadce0",
  borderLight: "#e8eaed",
  activeDot: "#34a853",
  danger: "#d93025",
  dangerHover: "#b3261e",
  shadow: "rgba(0, 0, 0, 0.08)",
} as const;

export const darkTheme = {
  bgPrimary: "#202124",
  bgSecondary: "#303134",
  bgTertiary: "#3c4043",
  bgHover: "#44474a",
  textPrimary: "#e8eaed",
  textSecondary: "#9aa0a6",
  textTertiary: "#80868b",
  accent: "#8ab4f8",
  accentHover: "#aecbfa",
  accentBg: "#394457",
  border: "#3c4043",
  borderLight: "#3c4043",
  activeDot: "#34a853",
  danger: "#f28b82",
  dangerHover: "#ee675c",
  shadow: "rgba(0, 0, 0, 0.3)",
} as const;

export const chromeGroupColors = {
  grey: "#5f6368",
  blue: "#1a73e8",
  red: "#d93025",
  yellow: "#f9ab00",
  green: "#188038",
  pink: "#d01884",
  purple: "#9334e6",
  cyan: "#007b83",
  orange: "#e8710a",
} as const;

export type Theme = typeof lightTheme;

export const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
