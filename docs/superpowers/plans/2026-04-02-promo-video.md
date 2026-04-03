# Tab Manager Promo Video — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 45-second animated promo video for the Tab Manager Chrome extension using Remotion, with pixel-perfect UI reproduction, TTS voiceover, and a "chaos → organized day" storyline.

**Architecture:** 5 custom scenes in a Remotion TransitionSeries. Scenes 2–4 use React components that exactly replicate the real Tab Manager UI from `extension/features/tab-browser/sidepanel.css`. TTS audio via ElevenLabs drives scene timing. The video project lives in `./video-tabmanager/` as a standalone Remotion app.

**Tech Stack:** Remotion 4.x, React, TypeScript, ElevenLabs TTS API, @remotion/transitions, @remotion/google-fonts, mediabunny, zod

**Design Spec:** `docs/superpowers/specs/2026-04-02-promo-video-design.md`

---

## File Structure

```
video-tabmanager/
├── public/
│   ├── images/
│   │   ├── icon128.png          # Tab Manager icon (copied from extension/icons/)
│   │   ├── screenshot-light.png  # Real screenshot (from store/screenshots/)
│   │   └── screenshot-dark.png
│   ├── voiceover/
│   │   ├── 01-cold-open.mp3
│   │   ├── 02-transition.mp3
│   │   ├── 03-morning-sort.mp3
│   │   ├── 04-morning-search.mp3
│   │   ├── 05-midday-windows.mp3
│   │   ├── 06-midday-groups.mp3
│   │   ├── 07-evening-localhost.mp3
│   │   ├── 08-evening-dev.mp3
│   │   ├── 09-outro-tagline.mp3
│   │   └── 10-outro-cta.mp3
│   └── music/
├── src/
│   ├── Root.tsx                   # Remotion entry — registers TabManagerVideo composition
│   ├── TabManagerVideo.tsx        # Main composition — TransitionSeries with 5 scenes
│   ├── schema.ts                  # Zod schema for video props
│   ├── calculate-metadata.ts     # Dynamic duration from voiceover audio lengths
│   ├── scenes/
│   │   ├── ColdOpenScene.tsx      # Scene 1: Tab chaos (0–8s)
│   │   ├── MorningScene.tsx       # Scene 2: Domain grouping + search (8–18s)
│   │   ├── MiddayScene.tsx        # Scene 3: Multi-window + tab groups (18–28s)
│   │   ├── EveningScene.tsx       # Scene 4: Developer features, dark mode (28–38s)
│   │   └── OutroScene.tsx         # Scene 5: Before/after + CTA (38–45s)
│   ├── components/
│   │   ├── TabManagerUI.tsx       # Pixel-perfect Side Panel shell (toolbar, footer, scrollable area)
│   │   ├── SearchBar.tsx          # Exact search input reproduction
│   │   ├── FilterRow.tsx          # Window filter, group toggle, labels toggle
│   │   ├── StatusBar.tsx          # Tab count + "Close old" link
│   │   ├── DomainGroup.tsx        # Domain accordion header + expandable tab list
│   │   ├── TabRow.tsx             # Individual tab entry (active dot, title, age, close)
│   │   ├── PanelFooter.tsx        # Banner controls, language select, theme toggle
│   │   └── TextOverlay.tsx        # Animated text overlay for narration captions
│   ├── utils/
│   │   ├── fonts.ts               # Google Font loading (Inter for overlays)
│   │   ├── theme.ts               # Light/dark CSS custom property values as JS objects
│   │   └── animations.ts          # Reusable animation helpers (slideUp, scalePop, fadeOut)
│   └── types.ts                   # Shared TypeScript types
├── generate-voiceover.ts          # ElevenLabs TTS generation script
├── voiceover-config.json          # TTS scene texts + voice config
├── .env                           # ELEVENLABS_API_KEY
├── package.json
└── tsconfig.json
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `video-tabmanager/` (entire project directory)
- Copy: `extension/icons/icon128.png` → `video-tabmanager/public/images/icon128.png`
- Copy: `store/screenshots/01-light-overview.png` → `video-tabmanager/public/images/screenshot-light.png`
- Copy: `store/screenshots/02-dark-overview.png` → `video-tabmanager/public/images/screenshot-dark.png`

- [ ] **Step 1: Create Remotion project**

```bash
cd /Users/benjamin/coding/Chrome
npx create-video@latest video-tabmanager
# Select "blank" template when prompted
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/benjamin/coding/Chrome/video-tabmanager
npm i zod @remotion/google-fonts @remotion/transitions @remotion/media @remotion/zod-types mediabunny
npm i -D dotenv-cli
```

- [ ] **Step 3: Create directory structure**

```bash
cd /Users/benjamin/coding/Chrome/video-tabmanager
mkdir -p public/images public/voiceover public/music
mkdir -p src/scenes src/components src/utils
```

- [ ] **Step 4: Copy assets from extension**

```bash
cd /Users/benjamin/coding/Chrome
cp extension/icons/icon128.png video-tabmanager/public/images/icon128.png
cp store/screenshots/01-light-overview.png video-tabmanager/public/images/screenshot-light.png
cp store/screenshots/02-dark-overview.png video-tabmanager/public/images/screenshot-dark.png
```

- [ ] **Step 5: Create .env and .gitignore entry**

Create `video-tabmanager/.env`:
```
ELEVENLABS_API_KEY=sk_your_key_here
```

Add to `video-tabmanager/.gitignore`:
```
.env
```

- [ ] **Step 6: Commit**

```bash
cd /Users/benjamin/coding/Chrome/video-tabmanager
git add -A
git commit -m "chore: scaffold Remotion project for Tab Manager promo video"
```

---

### Task 2: Theme & Utility Files

**Files:**
- Create: `src/utils/theme.ts`
- Create: `src/utils/fonts.ts`
- Create: `src/utils/animations.ts`
- Create: `src/types.ts`

- [ ] **Step 1: Create theme.ts with exact CSS custom property values**

Create `video-tabmanager/src/utils/theme.ts`:
```typescript
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
```

- [ ] **Step 2: Create fonts.ts**

Create `video-tabmanager/src/utils/fonts.ts`:
```typescript
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();
export { fontFamily };
```

- [ ] **Step 3: Create animations.ts**

Create `video-tabmanager/src/utils/animations.ts`:
```typescript
import { spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export function useSlideUp(delay = 0, distance = 40) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 200 } });
  const y = interpolate(progress, [0, 1], [distance, 0]);
  return { opacity: progress, transform: `translateY(${y}px)` };
}

export function useScalePop(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 15, stiffness: 200 } });
  const scale = interpolate(progress, [0, 1], [0.85, 1.0]);
  return { transform: `scale(${scale})`, opacity: progress };
}

export function useFadeOut(exitFrames = 20) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(
    frame,
    [durationInFrames - exitFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

export function useSpring(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame, fps, delay, config: { damping: 200 } });
}
```

- [ ] **Step 4: Create types.ts**

Create `video-tabmanager/src/types.ts`:
```typescript
export type TabData = {
  title: string;
  active: boolean;
  age: string;
};

export type DomainGroupData = {
  domain: string;
  favicon?: string;
  count: number;
  age: string;
  expanded: boolean;
  tabs: TabData[];
  groupColor?: string;
  customName?: string;
};

export type SceneTheme = "light" | "dark";
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/ src/types.ts
git commit -m "feat: add theme, fonts, animations and types utilities"
```

---

### Task 3: Pixel-Perfect UI Components

**Files:**
- Create: `src/components/SearchBar.tsx`
- Create: `src/components/FilterRow.tsx`
- Create: `src/components/StatusBar.tsx`
- Create: `src/components/DomainGroup.tsx`
- Create: `src/components/TabRow.tsx`
- Create: `src/components/PanelFooter.tsx`
- Create: `src/components/TabManagerUI.tsx`
- Create: `src/components/TextOverlay.tsx`

**Source of truth:** Read `extension/features/tab-browser/sidepanel.css` and `extension/features/tab-browser/sidepanel.html` for exact styles and structure. Every padding, margin, font-size, color, border-radius must match.

- [ ] **Step 1: Create SearchBar.tsx**

Create `video-tabmanager/src/components/SearchBar.tsx`:
```tsx
import React from "react";
import { Theme } from "../utils/theme";

type SearchBarProps = {
  theme: Theme;
  value?: string;
  placeholder?: string;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  theme,
  value = "",
  placeholder = "Search title, URL or label",
}) => {
  return (
    <div style={{ position: "relative", marginBottom: 8 }}>
      <svg
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: theme.textTertiary,
          pointerEvents: "none",
          width: 14,
          height: 14,
        }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <div
        style={{
          width: "100%",
          padding: "8px 12px 8px 34px",
          borderRadius: 20,
          border: `1px solid ${theme.border}`,
          background: theme.bgTertiary,
          color: value ? theme.textPrimary : theme.textTertiary,
          fontSize: 13,
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      >
        {value || placeholder}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create FilterRow.tsx**

Create `video-tabmanager/src/components/FilterRow.tsx`:
```tsx
import React from "react";
import { Theme } from "../utils/theme";

type FilterRowProps = {
  theme: Theme;
  windowLabel?: string;
  groupActive?: boolean;
  labelsActive?: boolean;
  sortLabel?: string;
  showMerge?: boolean;
};

export const FilterRow: React.FC<FilterRowProps> = ({
  theme,
  windowLabel = "All windows",
  groupActive = false,
  labelsActive = false,
  sortLabel = "Time ↓",
  showMerge = true,
}) => {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${active ? theme.accent : theme.border}`,
    background: active ? theme.accentBg : theme.bgTertiary,
    color: active ? theme.accent : theme.textSecondary,
    fontSize: 11,
    whiteSpace: "nowrap",
  });

  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
        <div
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: theme.bgTertiary,
            color: theme.textPrimary,
            fontSize: 12,
          }}
        >
          {windowLabel}
        </div>
        <div style={btnStyle(groupActive)}>⊞ Group</div>
        <div style={btnStyle(labelsActive)}>🏷 Labels</div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: theme.bgTertiary,
            color: theme.textPrimary,
            fontSize: 12,
          }}
        >
          ↕ {sortLabel}
        </div>
        {showMerge && (
          <div style={btnStyle(false)}>⊕ Merge</div>
        )}
      </div>
    </>
  );
};
```

- [ ] **Step 3: Create StatusBar.tsx**

Create `video-tabmanager/src/components/StatusBar.tsx`:
```tsx
import React from "react";
import { Theme } from "../utils/theme";

type StatusBarProps = {
  theme: Theme;
  tabCount: number;
  showCloseOld?: boolean;
};

export const StatusBar: React.FC<StatusBarProps> = ({
  theme,
  tabCount,
  showCloseOld = true,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
      }}
    >
      <span style={{ fontSize: 11, color: theme.textTertiary }}>
        {tabCount} tabs
      </span>
      {showCloseOld && (
        <span
          style={{
            fontSize: 11,
            color: theme.accent,
            cursor: "pointer",
            padding: "2px 4px",
            borderRadius: 4,
          }}
        >
          Close old (&gt;7d)
        </span>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Create TabRow.tsx**

Create `video-tabmanager/src/components/TabRow.tsx`:
```tsx
import React from "react";
import { Theme } from "../utils/theme";

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
        alignItems: label ? "flex-start" : "center",
        padding: label ? "8px 12px 8px 38px" : "7px 12px 7px 38px",
        gap: 8,
        borderTop: `1px solid ${theme.borderLight}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? theme.activeDot : "transparent",
          flexShrink: 0,
          marginTop: label ? 5 : 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontSize: 12,
            color: active ? theme.textPrimary : theme.textSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
        {label && (
          <span style={{ fontSize: 10, lineHeight: 1.25, color: theme.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}
          </span>
        )}
      </div>
      <span style={{ fontSize: 10, color: theme.textTertiary, whiteSpace: "nowrap", flexShrink: 0 }}>
        {age}
      </span>
      {showClose && (
        <span style={{ fontSize: 16, lineHeight: 1, color: theme.textTertiary, flexShrink: 0 }}>
          ×
        </span>
      )}
    </div>
  );
};
```

- [ ] **Step 5: Create DomainGroup.tsx**

Create `video-tabmanager/src/components/DomainGroup.tsx`:
```tsx
import React from "react";
import { Theme } from "../utils/theme";
import { TabRow } from "./TabRow";
import type { DomainGroupData } from "../types";

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
        ...(data.groupColor ? { borderLeft: `3px solid ${data.groupColor}` } : {}),
      }}
    >
      {/* Domain Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "9px 12px",
          background: theme.bgSecondary,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 8, color: theme.textTertiary, width: 12, textAlign: "center", flexShrink: 0 }}>
          {data.expanded ? "▼" : "▶"}
        </span>
        {data.favicon ? (
          <img
            src={data.favicon}
            width={16}
            height={16}
            style={{ borderRadius: 2, flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 16, height: 16, borderRadius: 2, background: theme.bgTertiary, flexShrink: 0 }} />
        )}
        <span
          style={{
            fontWeight: 500,
            fontSize: 13,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: data.groupColor || theme.textPrimary,
            fontStyle: data.customName ? "italic" : "normal",
          }}
        >
          {data.customName || data.domain}
        </span>
        <span style={{ fontSize: 10, color: theme.textTertiary, flexShrink: 0 }}>
          {data.age}
        </span>
        {showHoverButtons && (
          <>
            <span style={{ color: theme.textSecondary, fontSize: 12, padding: "2px 4px", borderRadius: 4 }}>✏️</span>
            <span style={{ color: theme.accent, fontSize: 12, padding: "2px 4px", borderRadius: 4 }}>📁</span>
          </>
        )}
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
        {showHoverButtons && (
          <span style={{ color: theme.danger, fontSize: 12, padding: "2px 4px", borderRadius: 4 }}>✕</span>
        )}
      </div>

      {/* Expanded Tabs */}
      {data.expanded && data.tabs.map((tab, i) => (
        <TabRow key={i} theme={theme} title={tab.title} active={tab.active} age={tab.age} />
      ))}
    </div>
  );
};
```

- [ ] **Step 6: Create PanelFooter.tsx**

Create `video-tabmanager/src/components/PanelFooter.tsx`:
```tsx
import React from "react";
import { Theme } from "../utils/theme";

type PanelFooterProps = {
  theme: Theme;
  language?: string;
  isDark?: boolean;
  bannerPosition?: "left" | "right" | "off";
};

export const PanelFooter: React.FC<PanelFooterProps> = ({
  theme,
  language = "EN",
  isDark = false,
  bannerPosition = "right",
}) => {
  const smallBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 6px",
    borderRadius: 4,
    border: `1px solid ${active ? theme.accent : theme.border}`,
    background: active ? theme.accentBg : theme.bgTertiary,
    color: active ? theme.accent : theme.textSecondary,
    fontSize: 10,
    lineHeight: 1,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderTop: `1px solid ${theme.border}`,
        background: theme.bgSecondary,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        <span style={smallBtnStyle(bannerPosition === "left")}>◀</span>
        <span style={smallBtnStyle(bannerPosition === "right")}>▶</span>
        <span style={smallBtnStyle(bannerPosition === "off")}>✕</span>
      </div>
      <div
        style={{
          padding: "4px 6px",
          borderRadius: 6,
          border: `1px solid ${theme.border}`,
          background: theme.bgTertiary,
          color: theme.textSecondary,
          fontSize: 11,
        }}
      >
        {language}
      </div>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.textSecondary,
          fontSize: 16,
        }}
      >
        {isDark ? "🌙" : "☀️"}
      </div>
    </div>
  );
};
```

- [ ] **Step 7: Create TabManagerUI.tsx (shell component)**

Create `video-tabmanager/src/components/TabManagerUI.tsx`:
```tsx
import React from "react";
import { Theme } from "../utils/theme";
import { SearchBar } from "./SearchBar";
import { FilterRow } from "./FilterRow";
import { StatusBar } from "./StatusBar";
import { PanelFooter } from "./PanelFooter";
import { fontStack } from "../utils/theme";

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
  language = "EN",
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
        color: theme.textPrimary,
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
      <div style={{ flexShrink: 0, padding: "10px 12px 8px", background: theme.bgPrimary }}>
        <SearchBar theme={theme} value={searchValue} />
        <FilterRow theme={theme} windowLabel={windowLabel} />
        <StatusBar theme={theme} tabCount={tabCount} />
      </div>

      {/* Scrollable Tab List */}
      <div style={{ flex: 1, overflowY: "hidden" }}>
        {children}
      </div>

      {/* Footer */}
      <PanelFooter theme={theme} isDark={isDark} language={language} />
    </div>
  );
};
```

- [ ] **Step 8: Create TextOverlay.tsx**

Create `video-tabmanager/src/components/TextOverlay.tsx`:
```tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { fontFamily } from "../utils/fonts";

type TextOverlayProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  position?: "bottom-left" | "bottom-center" | "center";
};

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  delay = 0,
  fontSize = 36,
  color = "#ffffff",
  position = "bottom-center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, delay, config: { damping: 200 } });
  const y = interpolate(progress, [0, 1], [20, 0]);

  const positionStyles: Record<string, React.CSSProperties> = {
    "bottom-left": { bottom: 60, left: 80 },
    "bottom-center": { bottom: 60, left: 0, right: 0, textAlign: "center" as const },
    center: { top: "50%", left: 0, right: 0, textAlign: "center" as const, transform: `translateY(calc(-50% + ${y}px))` },
  };

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles[position],
        opacity: progress,
        transform: position !== "center" ? `translateY(${y}px)` : positionStyles[position].transform,
        fontSize,
        fontWeight: 600,
        color,
        fontFamily,
        textShadow: "0 2px 8px rgba(0,0,0,0.5)",
        zIndex: 10,
      }}
    >
      {text}
    </div>
  );
};
```

- [ ] **Step 9: Commit**

```bash
git add src/components/
git commit -m "feat: add pixel-perfect Tab Manager UI components"
```

---

### Task 4: Scene 1 — Cold Open

**Files:**
- Create: `src/scenes/ColdOpenScene.tsx`

- [ ] **Step 1: Create ColdOpenScene.tsx**

Create `video-tabmanager/src/scenes/ColdOpenScene.tsx`:
```tsx
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
import { fontFamily } from "../utils/fonts";
import { TextOverlay } from "../components/TextOverlay";

export const ColdOpenScene: React.FC<{ voiceoverFiles: string[] }> = ({ voiceoverFiles }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Tabs multiply over first 4 seconds (120 frames)
  const tabCount = Math.min(
    Math.floor(interpolate(frame, [0, 100], [1, 45], { extrapolateRight: "clamp" })),
    45
  );

  // Wobble effect intensifies with tab count
  const wobble = Math.sin(frame * 0.8) * interpolate(frame, [0, 100], [0, 2], { extrapolateRight: "clamp" });

  // Transition zoom at end (last 30 frames)
  const zoomProgress = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 2.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoomOpacity = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tabs = Array.from({ length: tabCount }, (_, i) => {
    const names = [
      "Gmail", "YouTube", "GitHub", "Reddit", "Stack…", "Slack", "Jira",
      "Docs", "Drive", "Maps", "News", "Wiki", "AWS", "Figma", "Linear",
      "Notion", "Vercel", "NPM", "MDN", "Twitter", "HN", "Dev.to",
      "Medium", "Spotify", "Netflix", "Amazon", "eBay", "LinkedIn",
      "Calendar", "Meet", "Zoom", "Discord", "Trello", "Asana",
      "Confluence", "Bitbucket", "GitLab", "CodePen", "Repl.it",
      "Firebase", "Supabase", "Stripe", "Postman", "Jenkins", "Docker",
    ];
    return names[i % names.length];
  });

  const tabWidth = Math.max(18, interpolate(tabCount, [1, 45], [140, 18], { extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      {/* Voiceover: "We've all been here." */}
      {voiceoverFiles[0] && (
        <Audio src={staticFile(voiceoverFiles[0])} />
      )}

      {/* Voiceover: "But today is different." */}
      {voiceoverFiles[1] && (
        <Sequence from={Math.floor(durationInFrames * 0.5)} premountFor={30}>
          <Audio src={staticFile(voiceoverFiles[1])} />
        </Sequence>
      )}

      <div
        style={{
          transform: `scale(${zoomProgress}) rotate(${wobble}deg)`,
          opacity: zoomOpacity,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Fake browser chrome */}
        <div
          style={{
            width: 900,
            background: "#2d2d44",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Title bar */}
          <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", background: "#252540", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 1, padding: "0 4px", flexWrap: "wrap", background: "#333350" }}>
            {tabs.map((name, i) => (
              <div
                key={i}
                style={{
                  background: "#3d3d5c",
                  borderRadius: "4px 4px 0 0",
                  padding: "4px 6px",
                  fontSize: 9,
                  color: "#888",
                  maxWidth: tabWidth,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  fontFamily,
                }}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Browser content area */}
          <div
            style={{
              height: 300,
              background: "#2d2d44",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 64 }}>😵‍💫</span>
          </div>
        </div>
      </div>

      {/* Text overlays */}
      <TextOverlay text="We've all been here." delay={15} fontSize={42} position="bottom-center" />

      <Sequence from={Math.floor(durationInFrames * 0.5)}>
        <TextOverlay text="But today is different." delay={5} fontSize={42} position="bottom-center" />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/ColdOpenScene.tsx
git commit -m "feat: add Cold Open scene — tab chaos animation"
```

---

### Task 5: Scene 2 — Morning (Domain Grouping + Search)

**Files:**
- Create: `src/scenes/MorningScene.tsx`

- [ ] **Step 1: Create MorningScene.tsx**

Create `video-tabmanager/src/scenes/MorningScene.tsx`:
```tsx
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
import { lightTheme } from "../utils/theme";
import { fontFamily } from "../utils/fonts";
import { TabManagerUI } from "../components/TabManagerUI";
import { DomainGroup } from "../components/DomainGroup";
import { TextOverlay } from "../components/TextOverlay";
import type { DomainGroupData } from "../types";

const DOMAIN_GROUPS: DomainGroupData[] = [
  {
    domain: "github.com",
    favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=16",
    count: 5,
    age: "2m",
    expanded: false,
    tabs: [],
  },
  {
    domain: "gmail.com",
    favicon: "https://www.google.com/s2/favicons?domain=gmail.com&sz=16",
    count: 3,
    age: "5m",
    expanded: true,
    tabs: [
      { title: "Inbox (4) — benjamin@gmail.com", active: true, age: "2m" },
      { title: "Drafts — Gmail", active: false, age: "1h" },
      { title: "Settings — Gmail", active: false, age: "3d" },
    ],
  },
  {
    domain: "youtube.com",
    favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=16",
    count: 2,
    age: "15m",
    expanded: false,
    tabs: [],
  },
  {
    domain: "stackoverflow.com",
    favicon: "https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=16",
    count: 4,
    age: "30m",
    expanded: false,
    tabs: [],
  },
  {
    domain: "developer.mozilla.org",
    favicon: "https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=16",
    count: 2,
    age: "1h",
    expanded: false,
    tabs: [],
  },
];

export const MorningScene: React.FC<{ voiceoverFiles: string[] }> = ({ voiceoverFiles }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = lightTheme;
  const midpoint = Math.floor(durationInFrames * 0.5);

  // Side panel slides in from right
  const panelEntrance = spring({ frame, fps, config: { damping: 200 } });
  const panelX = interpolate(panelEntrance, [0, 1], [400, 0]);

  // Domain groups stagger in
  const isSearchPhase = frame >= midpoint;

  // Search text typing animation
  const searchText = "PR #42";
  const typedChars = isSearchPhase
    ? Math.min(
        searchText.length,
        Math.floor(interpolate(frame - midpoint, [10, 10 + searchText.length * 5], [0, searchText.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
      )
    : 0;
  const searchValue = isSearchPhase ? searchText.slice(0, typedChars) : "";

  // Filter: show only github.com when searching "PR #42"
  const filteredGroups = isSearchPhase && typedChars > 2
    ? [{
        ...DOMAIN_GROUPS[0],
        expanded: true,
        tabs: [
          { title: "Pull Request #42 — Fix auth flow", active: true, age: "2m" },
          { title: "Issues · Benjamin410/Chrome", active: false, age: "15m" },
        ],
      }]
    : DOMAIN_GROUPS;

  return (
    <AbsoluteFill style={{ backgroundColor: "#f0f4f8" }}>
      {/* Voiceover: "Everything sorted. Automatically." */}
      {voiceoverFiles[2] && <Audio src={staticFile(voiceoverFiles[2])} />}

      {/* Voiceover: "Find any tab. Instantly." */}
      {voiceoverFiles[3] && (
        <Sequence from={midpoint} premountFor={30}>
          <Audio src={staticFile(voiceoverFiles[3])} />
        </Sequence>
      )}

      {/* Background browser mockup */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 80,
          width: 1000,
          height: 600,
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: "1px solid #e0e0e0",
        }}
      >
        <div style={{ padding: 16, color: "#999", fontSize: 14, fontFamily }}>
          Browser Window
        </div>
      </div>

      {/* Tab Manager Side Panel */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: 60,
          transform: `translateX(${panelX}px)`,
          opacity: panelEntrance,
        }}
      >
        <TabManagerUI
          theme={theme}
          tabCount={isSearchPhase && typedChars > 2 ? 2 : 16}
          searchValue={searchValue}
          height={800}
        >
          {filteredGroups.map((group, i) => {
            const delay = i * 6 + 10;
            const groupEntrance = spring({ frame, fps, delay, config: { damping: 200 } });
            return (
              <div key={group.domain} style={{ opacity: groupEntrance, transform: `translateY(${interpolate(groupEntrance, [0, 1], [15, 0])}px)` }}>
                <DomainGroup theme={theme} data={group} />
              </div>
            );
          })}
        </TabManagerUI>
      </div>

      {/* Text overlays */}
      <TextOverlay text="Everything sorted. Automatically." delay={20} fontSize={38} position="bottom-left" />

      <Sequence from={midpoint}>
        <TextOverlay text="Find any tab. Instantly." delay={15} fontSize={38} position="bottom-left" />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/MorningScene.tsx
git commit -m "feat: add Morning scene — domain grouping + search"
```

---

### Task 6: Scene 3 — Midday (Multi-Window + Tab Groups)

**Files:**
- Create: `src/scenes/MiddayScene.tsx`

- [ ] **Step 1: Create MiddayScene.tsx**

Create `video-tabmanager/src/scenes/MiddayScene.tsx`:
```tsx
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
import { lightTheme, chromeGroupColors } from "../utils/theme";
import { fontFamily } from "../utils/fonts";
import { TabManagerUI } from "../components/TabManagerUI";
import { DomainGroup } from "../components/DomainGroup";
import { TextOverlay } from "../components/TextOverlay";

export const MiddayScene: React.FC<{ voiceoverFiles: string[] }> = ({ voiceoverFiles }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = lightTheme;
  const midpoint = Math.floor(durationInFrames * 0.5);

  const isGroupPhase = frame >= midpoint;

  // Phase 1: Three windows merge into one panel
  const mergeProgress = spring({ frame, fps, delay: 10, config: { damping: 200 } });

  // Window positions — converge to center-right
  const window1X = interpolate(mergeProgress, [0, 1], [100, 600]);
  const window1Y = interpolate(mergeProgress, [0, 1], [120, 200]);
  const window2X = interpolate(mergeProgress, [0, 1], [500, 600]);
  const window3X = interpolate(mergeProgress, [0, 1], [900, 600]);
  const windowScale = interpolate(mergeProgress, [0, 1], [1, 0]);
  const windowOpacity = interpolate(mergeProgress, [0, 1], [1, 0]);
  const panelOpacity = interpolate(mergeProgress, [0, 1], [0, 1]);

  // Phase 2: Tab group colors pop in
  const groupColorProgress = isGroupPhase
    ? spring({ frame: frame - midpoint, fps, delay: 15, config: { damping: 15, stiffness: 200 } })
    : 0;

  const windowStyle = (x: number, color: string, label: string): React.CSSProperties => ({
    position: "absolute",
    left: x,
    top: window1Y,
    width: 300,
    background: "#fff",
    borderRadius: 8,
    border: `2px solid ${color}`,
    padding: 12,
    opacity: windowOpacity,
    transform: `scale(${windowScale})`,
    fontFamily,
  });

  const groups = [
    { domain: "jira.com", count: 3, age: "5m", groupColor: isGroupPhase ? chromeGroupColors.blue : undefined },
    { domain: "slack.com", count: 2, age: "10m", groupColor: isGroupPhase ? chromeGroupColors.blue : undefined },
    { domain: "stackoverflow.com", count: 4, age: "20m", groupColor: isGroupPhase ? chromeGroupColors.yellow : undefined },
    { domain: "developer.mozilla.org", count: 2, age: "30m", groupColor: isGroupPhase ? chromeGroupColors.yellow : undefined },
    { domain: "youtube.com", count: 2, age: "1h", groupColor: isGroupPhase ? chromeGroupColors.green : undefined },
    { domain: "reddit.com", count: 1, age: "2h", groupColor: isGroupPhase ? chromeGroupColors.green : undefined },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#f0f4f8" }}>
      {/* Voiceover: "All windows. One panel." */}
      {voiceoverFiles[4] && <Audio src={staticFile(voiceoverFiles[4])} />}

      {/* Voiceover: "Color-coded groups. One click." */}
      {voiceoverFiles[5] && (
        <Sequence from={midpoint} premountFor={30}>
          <Audio src={staticFile(voiceoverFiles[5])} />
        </Sequence>
      )}

      {/* Floating windows (before merge) */}
      <div style={windowStyle(window1X, chromeGroupColors.blue, "Work")}>
        <div style={{ fontWeight: 700, color: chromeGroupColors.blue, marginBottom: 6, fontSize: 12 }}>🖥 Window 1 — Work</div>
        <div style={{ color: "#555", fontSize: 11 }}>Jira · Slack · Docs</div>
      </div>
      <div style={windowStyle(window2X, chromeGroupColors.yellow, "Research")}>
        <div style={{ fontWeight: 700, color: chromeGroupColors.orange, marginBottom: 6, fontSize: 12 }}>🖥 Window 2 — Research</div>
        <div style={{ color: "#555", fontSize: 11 }}>Stack Overflow · MDN</div>
      </div>
      <div style={windowStyle(window3X, chromeGroupColors.green, "Personal")}>
        <div style={{ fontWeight: 700, color: chromeGroupColors.green, marginBottom: 6, fontSize: 12 }}>🖥 Window 3 — Personal</div>
        <div style={{ color: "#555", fontSize: 11 }}>YouTube · Reddit</div>
      </div>

      {/* Tab Manager Panel (appears after merge) */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: 60,
          opacity: panelOpacity,
          transform: `scale(${interpolate(panelOpacity, [0, 1], [0.9, 1])})`,
        }}
      >
        <TabManagerUI theme={theme} tabCount={14} windowLabel="All windows" height={800}>
          {groups.map((g, i) => {
            const delay = i * 6 + 20;
            const entrance = spring({ frame, fps, delay, config: { damping: 200 } });
            const colorScale = isGroupPhase ? groupColorProgress : 1;
            return (
              <div key={g.domain} style={{ opacity: entrance, transform: `translateY(${interpolate(entrance, [0, 1], [10, 0])}px)` }}>
                <DomainGroup
                  theme={theme}
                  data={{
                    ...g,
                    expanded: false,
                    tabs: [],
                    favicon: `https://www.google.com/s2/favicons?domain=${g.domain}&sz=16`,
                    groupColor: g.groupColor ? g.groupColor : undefined,
                  }}
                />
              </div>
            );
          })}
        </TabManagerUI>
      </div>

      {/* Text overlays */}
      <TextOverlay text="All windows. One panel." delay={25} fontSize={38} position="bottom-left" />

      <Sequence from={midpoint}>
        <TextOverlay text="Color-coded groups. One click." delay={15} fontSize={38} position="bottom-left" />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/MiddayScene.tsx
git commit -m "feat: add Midday scene — multi-window merge + tab groups"
```

---

### Task 7: Scene 4 — Evening (Developer Features, Dark Mode)

**Files:**
- Create: `src/scenes/EveningScene.tsx`

- [ ] **Step 1: Create EveningScene.tsx**

Create `video-tabmanager/src/scenes/EveningScene.tsx`:
```tsx
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
import type { DomainGroupData } from "../types";

const DEV_GROUPS: DomainGroupData[] = [
  {
    domain: "localhost:3000",
    count: 4,
    age: "1m",
    expanded: true,
    groupColor: chromeGroupColors.green,
    tabs: [
      { title: "Dashboard — My App", active: true, age: "1m" },
      { title: "API Documentation", active: false, age: "15m" },
      { title: "Login Page", active: false, age: "1h" },
      { title: "Settings — My App", active: false, age: "2h" },
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
    domain: "Router Admin Panel",
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
    tabs: [],
    favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=16",
  },
];

export const EveningScene: React.FC<{ voiceoverFiles: string[] }> = ({ voiceoverFiles }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = darkTheme;
  const midpoint = Math.floor(durationInFrames * 0.5);

  // Theme transition: light → dark wipe
  const darkWipe = spring({ frame, fps, config: { damping: 200 } });
  const wipeX = interpolate(darkWipe, [0, 1], [1920, 0]);

  // Keyboard shortcut flash in second half
  const isDevMontage = frame >= midpoint;
  const kbdProgress = isDevMontage
    ? spring({ frame: frame - midpoint, fps, delay: 20, config: { damping: 200 } })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      {/* Dark mode wipe overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: darkTheme.bgPrimary,
          clipPath: `inset(0 ${wipeX}px 0 0)`,
          zIndex: 0,
        }}
      />

      {/* Voiceover: "localhost:3000 and :8080..." */}
      {voiceoverFiles[6] && <Audio src={staticFile(voiceoverFiles[6])} />}

      {/* Voiceover: "Built for developers. By a developer." */}
      {voiceoverFiles[7] && (
        <Sequence from={midpoint} premountFor={30}>
          <Audio src={staticFile(voiceoverFiles[7])} />
        </Sequence>
      )}

      {/* Tab Manager Panel — Dark Mode */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: 60,
          zIndex: 1,
        }}
      >
        <TabManagerUI theme={theme} isDark tabCount={10} language="EN" height={800}>
          {DEV_GROUPS.map((group, i) => {
            const delay = i * 8 + 15;
            const entrance = spring({ frame, fps, delay, config: { damping: 200 } });
            return (
              <div key={group.domain} style={{ opacity: entrance, transform: `translateY(${interpolate(entrance, [0, 1], [12, 0])}px)` }}>
                <DomainGroup theme={theme} data={group} showHoverButtons={i === 0} />
              </div>
            );
          })}
        </TabManagerUI>
      </div>

      {/* Code editor mockup on left */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 100,
          width: 900,
          height: 600,
          background: "#1e1e2e",
          borderRadius: 12,
          padding: 20,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: 14,
          color: "#cdd6f4",
          zIndex: 1,
          border: "1px solid #313244",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ color: "#6c7086" }}>// app.js — localhost:3000</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ color: "#cba6f7" }}>const</span>{" "}
          <span style={{ color: "#89b4fa" }}>express</span>{" "}
          <span style={{ color: "#cdd6f4" }}>=</span>{" "}
          <span style={{ color: "#a6e3a1" }}>require</span>
          <span style={{ color: "#f9e2af" }}>(</span>
          <span style={{ color: "#a6e3a1" }}>'express'</span>
          <span style={{ color: "#f9e2af" }}>)</span>;
        </div>
      </div>

      {/* Keyboard shortcut indicator */}
      {isDevMontage && (
        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 120,
            opacity: kbdProgress,
            transform: `translateY(${interpolate(kbdProgress, [0, 1], [20, 0])}px)`,
            display: "flex",
            gap: 8,
            alignItems: "center",
            zIndex: 2,
          }}
        >
          <div
            style={{
              background: "#313244",
              border: "1px solid #45475a",
              borderRadius: 6,
              padding: "8px 14px",
              color: "#cdd6f4",
              fontSize: 18,
              fontFamily,
              fontWeight: 600,
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            ⌘ M
          </div>
          <span style={{ color: "#9aa0a6", fontSize: 16, fontFamily }}>Open Tab Manager</span>
        </div>
      )}

      {/* Text overlays */}
      <TextOverlay
        text="localhost:3000 and :8080 — each gets its own group."
        delay={20}
        fontSize={34}
        position="bottom-left"
      />

      <Sequence from={midpoint}>
        <TextOverlay text="Built for developers. By a developer." delay={15} fontSize={38} position="bottom-left" />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/EveningScene.tsx
git commit -m "feat: add Evening scene — dark mode + developer features"
```

---

### Task 8: Scene 5 — Outro (Before/After + CTA)

**Files:**
- Create: `src/scenes/OutroScene.tsx`

- [ ] **Step 1: Create OutroScene.tsx**

Create `video-tabmanager/src/scenes/OutroScene.tsx`:
```tsx
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Audio,
  staticFile,
  Img,
  Sequence,
} from "remotion";
import { fontFamily } from "../utils/fonts";
import { lightTheme, chromeGroupColors } from "../utils/theme";

export const OutroScene: React.FC<{ voiceoverFiles: string[] }> = ({ voiceoverFiles }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const midpoint = Math.floor(durationInFrames * 0.55);

  // Split screen wipe
  const wipeProgress = spring({ frame, fps, config: { damping: 200 } });
  const splitWidth = interpolate(wipeProgress, [0, 1], [0, 50]);

  // Logo + CTA entrance
  const isCtaPhase = frame >= midpoint;
  const splitFadeOut = isCtaPhase
    ? interpolate(frame - midpoint, [0, 15], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const logoProgress = isCtaPhase
    ? spring({ frame: frame - midpoint, fps, delay: 10, config: { damping: 200 } })
    : 0;
  const ctaProgress = isCtaPhase
    ? spring({ frame: frame - midpoint, fps, delay: 20, config: { damping: 200 } })
    : 0;

  // Fade to black at very end
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#f8f9fa" }}>
      {/* Voiceover: "Your tabs. Finally organized." */}
      {voiceoverFiles[8] && <Audio src={staticFile(voiceoverFiles[8])} />}

      {/* Voiceover: "Free on the Chrome Web Store." */}
      {voiceoverFiles[9] && (
        <Sequence from={midpoint} premountFor={30}>
          <Audio src={staticFile(voiceoverFiles[9])} />
        </Sequence>
      )}

      {/* Before/After Split Screen */}
      <div style={{ opacity: splitFadeOut, position: "absolute", inset: 0, display: "flex" }}>
        {/* BEFORE — chaos */}
        <div
          style={{
            width: `${splitWidth}%`,
            background: "#1a1a2e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div style={{ color: "#666", fontSize: 14, fontFamily, marginBottom: 20, textTransform: "uppercase", letterSpacing: 2 }}>
            Before
          </div>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", maxWidth: 300 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} style={{ background: "#3d3d5c", borderRadius: 2, padding: "3px 6px", fontSize: 7, color: "#666", maxWidth: 25, overflow: "hidden" }}>
                …
              </div>
            ))}
          </div>
          <span style={{ fontSize: 48, marginTop: 20 }}>😵‍💫</span>
        </div>

        {/* Divider */}
        <div style={{ width: 2, background: "#dadce0" }} />

        {/* AFTER — organized */}
        <div
          style={{
            flex: 1,
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "#999", fontSize: 14, fontFamily, marginBottom: 20, textTransform: "uppercase", letterSpacing: 2 }}>
            After
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ background: chromeGroupColors.blue, color: "#fff", padding: "6px 16px", borderRadius: 16, fontSize: 14, fontWeight: 600, fontFamily }}>Work</span>
            <span style={{ background: chromeGroupColors.green, color: "#fff", padding: "6px 16px", borderRadius: 16, fontSize: 14, fontWeight: 600, fontFamily }}>Dev</span>
            <span style={{ background: chromeGroupColors.yellow, color: "#fff", padding: "6px 16px", borderRadius: 16, fontSize: 14, fontWeight: 600, fontFamily }}>Research</span>
          </div>
          <span style={{ fontSize: 48, marginTop: 20 }}>😌</span>
        </div>
      </div>

      {/* Logo + CTA (appears after split fades) */}
      {isCtaPhase && (
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Icon */}
          <div style={{ opacity: logoProgress, transform: `scale(${interpolate(logoProgress, [0, 1], [0.5, 1])})` }}>
            <Img src={staticFile("images/icon128.png")} style={{ width: 96, height: 96 }} />
          </div>

          {/* Product name */}
          <div
            style={{
              opacity: logoProgress,
              transform: `translateY(${interpolate(logoProgress, [0, 1], [20, 0])}px)`,
              fontSize: 52,
              fontWeight: 700,
              color: "#202124",
              fontFamily,
            }}
          >
            Tab Manager
          </div>

          {/* Tagline */}
          <div
            style={{
              opacity: ctaProgress,
              transform: `translateY(${interpolate(ctaProgress, [0, 1], [15, 0])}px)`,
              fontSize: 32,
              color: "#5f6368",
              fontFamily,
            }}
          >
            Your tabs. Finally organized.
          </div>

          {/* CTA */}
          <div
            style={{
              opacity: ctaProgress,
              transform: `translateY(${interpolate(ctaProgress, [0, 1], [15, 0])}px) scale(${1 + 0.02 * Math.sin(frame * 0.15)})`,
              background: lightTheme.accent,
              color: "#ffffff",
              padding: "14px 40px",
              borderRadius: 28,
              fontSize: 24,
              fontWeight: 600,
              fontFamily,
            }}
          >
            Free on Chrome Web Store
          </div>

          {/* Real screenshot */}
          <div
            style={{
              opacity: interpolate(ctaProgress, [0.5, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              marginTop: 16,
            }}
          >
            <Img
              src={staticFile("images/screenshot-light.png")}
              style={{
                width: 280,
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            />
          </div>
        </AbsoluteFill>
      )}

      {/* Fade to black */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/OutroScene.tsx
git commit -m "feat: add Outro scene — before/after split + CTA"
```

---

### Task 9: Schema, Metadata, Main Composition & Root

**Files:**
- Create: `src/schema.ts`
- Create: `src/calculate-metadata.ts`
- Create: `src/TabManagerVideo.tsx`
- Modify: `src/Root.tsx`

- [ ] **Step 1: Create schema.ts**

Create `video-tabmanager/src/schema.ts`:
```typescript
import { z } from "zod";

export const TabManagerVideoSchema = z.object({
  voiceoverFiles: z.array(z.string()).default([]),
});

export type TabManagerVideoProps = z.infer<typeof TabManagerVideoSchema>;
```

- [ ] **Step 2: Create calculate-metadata.ts**

Create `video-tabmanager/src/calculate-metadata.ts`:
```typescript
import { CalculateMetadataFunction } from "remotion";
import { getAudioDuration } from "mediabunny";
import type { TabManagerVideoProps } from "./schema";

const FPS = 30;
const TRANSITION_FRAMES = 15;
const NUM_TRANSITIONS = 4;
const TARGET_DURATION_SECONDS = 45;

// Scene durations in frames (default when no voiceover)
export const DEFAULT_SCENE_FRAMES = {
  coldOpen: 240,    // 8s
  morning: 300,     // 10s
  midday: 300,      // 10s
  evening: 300,     // 10s
  outro: 210,       // 7s
};

export const calculateTabManagerVideoMetadata: CalculateMetadataFunction<TabManagerVideoProps> = async ({ props, abortSignal }) => {
  let totalAudioDuration = 0;

  if (props.voiceoverFiles.length > 0) {
    for (const file of props.voiceoverFiles) {
      try {
        const duration = await getAudioDuration(`public/${file}`, abortSignal);
        totalAudioDuration += duration;
      } catch {
        // File might not exist during preview
      }
    }
  }

  const effectiveDuration = Math.max(TARGET_DURATION_SECONDS, totalAudioDuration + 2);
  const netFrames = Math.ceil(effectiveDuration * FPS);
  const rawFrames = netFrames + NUM_TRANSITIONS * TRANSITION_FRAMES;

  return {
    durationInFrames: rawFrames,
    fps: FPS,
    width: 1920,
    height: 1080,
    props,
  };
};
```

- [ ] **Step 3: Create TabManagerVideo.tsx**

Create `video-tabmanager/src/TabManagerVideo.tsx`:
```tsx
import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ColdOpenScene } from "./scenes/ColdOpenScene";
import { MorningScene } from "./scenes/MorningScene";
import { MiddayScene } from "./scenes/MiddayScene";
import { EveningScene } from "./scenes/EveningScene";
import { OutroScene } from "./scenes/OutroScene";
import { DEFAULT_SCENE_FRAMES } from "./calculate-metadata";
import type { TabManagerVideoProps } from "./schema";

const TRANSITION_DURATION = 15;

export const TabManagerVideo: React.FC<TabManagerVideoProps> = (props) => {
  const sf = DEFAULT_SCENE_FRAMES;

  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sf.coldOpen}>
          <ColdOpenScene voiceoverFiles={props.voiceoverFiles} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={sf.morning}>
          <MorningScene voiceoverFiles={props.voiceoverFiles} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={sf.midday}>
          <MiddayScene voiceoverFiles={props.voiceoverFiles} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={sf.evening}>
          <EveningScene voiceoverFiles={props.voiceoverFiles} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={sf.outro}>
          <OutroScene voiceoverFiles={props.voiceoverFiles} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: Update Root.tsx**

Replace content of `video-tabmanager/src/Root.tsx`:
```tsx
import { Composition } from "remotion";
import { TabManagerVideo } from "./TabManagerVideo";
import { TabManagerVideoSchema } from "./schema";
import { calculateTabManagerVideoMetadata } from "./calculate-metadata";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TabManagerVideo"
      component={TabManagerVideo}
      schema={TabManagerVideoSchema}
      defaultProps={{
        voiceoverFiles: [],
      }}
      calculateMetadata={calculateTabManagerVideoMetadata}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={1410}
    />
  );
};
```

- [ ] **Step 5: Verify studio starts**

```bash
cd /Users/benjamin/coding/Chrome/video-tabmanager
npx remotion studio
```

Expected: Studio opens, "TabManagerVideo" composition visible, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/schema.ts src/calculate-metadata.ts src/TabManagerVideo.tsx src/Root.tsx
git commit -m "feat: add main composition, schema and metadata calculation"
```

---

### Task 10: Voiceover Generation (TTS)

**Files:**
- Create: `voiceover-config.json`
- Create: `generate-voiceover.ts`

- [ ] **Step 1: Create voiceover-config.json**

Create `video-tabmanager/voiceover-config.json`:
```json
{
  "voiceId": "ErXwobaYiN019PkySvjV",
  "modelId": "eleven_multilingual_v2",
  "voiceSettings": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.5,
    "use_speaker_boost": true
  },
  "scenes": [
    { "id": "cold-open", "text": "We've all been here.", "output": "public/voiceover/01-cold-open.mp3" },
    { "id": "transition", "text": "But today is different.", "output": "public/voiceover/02-transition.mp3" },
    { "id": "morning-sort", "text": "Everything sorted. Automatically.", "output": "public/voiceover/03-morning-sort.mp3" },
    { "id": "morning-search", "text": "Find any tab. Instantly.", "output": "public/voiceover/04-morning-search.mp3" },
    { "id": "midday-windows", "text": "All windows. One panel.", "output": "public/voiceover/05-midday-windows.mp3" },
    { "id": "midday-groups", "text": "Color-coded groups. One click.", "output": "public/voiceover/06-midday-groups.mp3" },
    { "id": "evening-localhost", "text": "localhost 3000 and 8080. Each gets its own group.", "output": "public/voiceover/07-evening-localhost.mp3" },
    { "id": "evening-dev", "text": "Built for developers. By a developer.", "output": "public/voiceover/08-evening-dev.mp3" },
    { "id": "outro-tagline", "text": "Your tabs. Finally organized.", "output": "public/voiceover/09-outro-tagline.mp3" },
    { "id": "outro-cta", "text": "Free on the Chrome Web Store.", "output": "public/voiceover/10-outro-cta.mp3" }
  ]
}
```

**Note:** Voice ID `ErXwobaYiN019PkySvjV` = "Antoni" (warm, friendly). The user can change this before running.

- [ ] **Step 2: Create generate-voiceover.ts**

Create `video-tabmanager/generate-voiceover.ts`:
```typescript
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const config = JSON.parse(readFileSync("voiceover-config.json", "utf-8"));

const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error("❌ ELEVENLABS_API_KEY not set. Set it in .env or as an environment variable.");
  console.log("💡 Video will be rendered without voiceover.");
  process.exit(0);
}

async function generateVoiceover(sceneId: string, text: string, outputPath: string) {
  console.log(`🎙️  Generating voiceover for ${sceneId}...`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: config.modelId,
        voice_settings: config.voiceSettings,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error for ${sceneId}: ${response.status} ${error}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const dir = outputPath.substring(0, outputPath.lastIndexOf("/"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(outputPath, buffer);
  console.log(`✅ ${sceneId} → ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log(`\n🎬 Voiceover generation started (${config.scenes.length} scenes)\n`);

  for (const scene of config.scenes) {
    await generateVoiceover(scene.id, scene.text, scene.output);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n✅ All voiceover files generated!\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
```

- [ ] **Step 3: Set the ElevenLabs API key**

Ask user to set their key in `video-tabmanager/.env`:
```
ELEVENLABS_API_KEY=sk_actual_key_here
```

- [ ] **Step 4: Generate voiceover files**

```bash
cd /Users/benjamin/coding/Chrome/video-tabmanager
npx dotenv-cli -- npx tsx generate-voiceover.ts
```

- [ ] **Step 5: Verify all audio files exist**

```bash
ls -la public/voiceover/
# Expected: 10 MP3 files (01-cold-open.mp3 through 10-outro-cta.mp3)
```

- [ ] **Step 6: Measure audio durations and update scene frames**

```bash
for f in public/voiceover/0*.mp3; do
  d=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")
  echo "$f: ${d}s"
done
```

Based on the measured durations, update `DEFAULT_SCENE_FRAMES` in `src/calculate-metadata.ts`:
- Each scene's frames = `ceil(sum of its voiceover durations × 30) + 15` (transition buffer)
- Scene 1 uses voiceover files 01 + 02
- Scene 2 uses voiceover files 03 + 04
- Scene 3 uses voiceover files 05 + 06
- Scene 4 uses voiceover files 07 + 08
- Scene 5 uses voiceover files 09 + 10

Also update `defaultProps.voiceoverFiles` in `Root.tsx`:
```typescript
voiceoverFiles: [
  "voiceover/01-cold-open.mp3",
  "voiceover/02-transition.mp3",
  "voiceover/03-morning-sort.mp3",
  "voiceover/04-morning-search.mp3",
  "voiceover/05-midday-windows.mp3",
  "voiceover/06-midday-groups.mp3",
  "voiceover/07-evening-localhost.mp3",
  "voiceover/08-evening-dev.mp3",
  "voiceover/09-outro-tagline.mp3",
  "voiceover/10-outro-cta.mp3",
],
```

- [ ] **Step 7: Commit**

```bash
git add voiceover-config.json generate-voiceover.ts public/voiceover/ src/calculate-metadata.ts src/Root.tsx
git commit -m "feat: add TTS voiceover generation and audio files"
```

---

### Task 11: Preview, Visual Review & Render

**Files:**
- Modify: Various scene files if visual issues found

- [ ] **Step 1: Start Remotion Studio**

```bash
cd /Users/benjamin/coding/Chrome/video-tabmanager
npx remotion studio
```

- [ ] **Step 2: Visual review — check each scene**

Open http://localhost:3000 in browser. Scrub through the timeline and verify:

| Check | Expected |
|-------|----------|
| Scene 1 (0–8s) | Tabs multiply, text overlays appear, zoom transition |
| Scene 2 (8–18s) | Side Panel slides in, domain groups appear, search typing works |
| Scene 3 (18–28s) | Windows merge, panel appears, tab group colors pop in |
| Scene 4 (28–38s) | Dark mode wipe, localhost groups, keyboard shortcut |
| Scene 5 (38–45s) | Before/after split, logo + CTA, real screenshot |
| Audio sync | Voiceover matches visuals, no overlap between scenes |
| UI accuracy | Tab Manager components match real extension |
| Total duration | ~45 seconds |

Fix any visual issues in the scene components.

- [ ] **Step 3: Audio sync check**

```bash
# Total video duration
ffprobe -v quiet -show_entries format=duration -of csv=p=0 out/product-video.mp4 2>/dev/null || echo "Not yet rendered"

# Total audio duration
total=0; for f in public/voiceover/0*.mp3; do d=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f"); total=$(echo "$total + $d" | bc); done; echo "Audio total: ${total}s"
```

- [ ] **Step 4: Render final video**

```bash
npx remotion render TabManagerVideo out/tab-manager-promo.mp4 --codec h264 --crf 18
```

- [ ] **Step 5: Verify output**

```bash
ls -lh out/tab-manager-promo.mp4
ffprobe -v quiet -show_entries format=duration -of csv=p=0 out/tab-manager-promo.mp4
```

Expected: File exists, size > 1MB, duration ~45s.

- [ ] **Step 6: Commit final state**

```bash
git add -A
git commit -m "feat: complete Tab Manager promo video — ready for export"
```
