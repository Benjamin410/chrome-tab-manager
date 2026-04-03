# Tab Manager — Promo Video Design Spec

## Overview

A 45-second animated promotional video for the Tab Manager Chrome extension, built with Remotion. The video tells a relatable story of tab chaos transforming into organized productivity throughout a day.

## Core Decisions

| Decision | Choice |
|----------|--------|
| Duration | 45 seconds |
| Language | English |
| Tone | Playful & approachable ("finally, order in the chaos") |
| Target audience | Both: general Chrome users + developers |
| Visual style | Mix — pixel-perfect Remotion reproductions of the real UI for feature scenes, stylized mockups for the chaos intro, real screenshots as proof in outro |
| Storyline | Hybrid: "Drowning in Tabs" cold open → "A Day With Tabs" feature showcase |

## Featured Capabilities (in order)

1. Domain grouping (auto-sorted by domain)
2. Search (instant find by title/URL/label)
3. Multi-window support (unified view across windows)
4. Chrome Tab Groups (one-click color-coded groups)
5. Developer features (localhost port separation, IP-to-title, rename groups)

## Storyline

### Scene 1: Cold Open — "The Chaos" (0–8s)

**Visual:** Stylized browser window. Tabs multiply rapidly (1→5→15→40+), shrinking until titles are unreadable. Slightly frantic, wobbly rhythm.

**Text overlay:** *"We've all been here."* (handwriting-style font, fade in)

**Transition:** Brief pause. *"But today is different."* → Smooth zoom into Tab Manager icon in the Chrome toolbar.

**Sound:** Rapid click sounds accelerating, then brief silence.

**Note:** This scene is intentionally stylized/generic — it shows the universal problem, not the extension.

### Scene 2: Morning — Domain Grouping + Search (8–18s)

**Visual (8–13s):** The Side Panel slides in from the right. Tabs animate into domain groups — a satisfying sorting animation where scattered tabs fly into their grouped positions. The UI is a pixel-perfect reproduction of the real Tab Manager in light theme.

**Text:** *"Everything sorted. Automatically."*

**Visual (13–18s):** Cursor types "PR #42" into the search bar. The tab list filters live, highlighting the matching result. The found tab gets a subtle glow/pulse.

**Text:** *"Find any tab. Instantly."*

**Sound:** Gentle swoosh on sort, soft typing sounds.

### Scene 3: Midday — Multi-Window + Chrome Tab Groups (18–28s)

**Visual (18–23s):** Three browser windows float side by side (Work, Research, Personal). Camera zooms out, windows merge/collapse into the Side Panel's unified "All windows" view showing the combined tab count.

**Text:** *"All windows. One panel."*

**Visual (23–28s):** Cursor clicks the folder icon on a domain header. Color-coded Chrome Tab Group badges pop into existence with a satisfying pop animation. The Chrome tab bar at the top colors in to match.

**Text:** *"Color-coded groups. One click."*

**Sound:** Merge/swoosh sound, pop sound on tab group creation.

### Scene 4: Evening — Developer Features (28–38s)

**Visual (28–33s):** Smooth theme transition to dark mode. The Side Panel now shows developer-focused tabs: `localhost:3000` (4 tabs), `localhost:8080` (2 tabs), `192.168.1.42` (1 tab) — each port in its own group with distinct Chrome tab group colors (green, cyan). Page titles shown instead of raw IPs.

**Text:** *"localhost:3000 and :8080 — each gets its own group."*

**Visual (33–38s):** Quick montage: rename a domain group (pencil icon → type custom name), page labels appear beneath tab titles, keyboard shortcut Cmd+M flashes on screen.

**Text:** *"Built for developers. By a developer."*

**Sound:** Mechanical keyboard tapping, subtle synth chord.

### Scene 5: Outro — Full Circle (38–45s)

**Visual (38–42s):** Wipe transition to split-screen. Left side: the chaotic browser from Scene 1 (dark, cramped, emoji 😵‍💫). Right side: the organized Tab Manager with color-coded groups (clean, spacious, emoji 😌). Slow, satisfying reveal.

**Visual (42–45s):** Split-screen fades out. Tab Manager logo centers on screen. Below: a real screenshot of the extension as proof (use `store/screenshots/01-light-overview.png` or `store/screenshots/02-dark-overview.png`).

**Text:** *"Your tabs. Finally organized."*  
**Subtext:** *"Free on Chrome Web Store"*

**Sound:** Satisfying "ding," calm fade-out.

## Visual Design Requirements

### Pixel-Perfect UI Reproduction

All scenes showing the Tab Manager (Scenes 2–5) must use the **exact CSS values** from the extension's source code. This is the #1 priority of the entire project — the video must look identical to the real extension, not a generic approximation. Every component (search bar, domain headers with time indicators, tab rows, footer, buttons) must match the original layout, spacing, and positioning exactly. When in doubt, read the actual CSS from `extension/features/tab-browser/sidepanel.css` and the HTML structure from `extension/features/tab-browser/sidepanel.html`.

**Source of truth:** `extension/features/tab-browser/sidepanel.css`

#### Color Palette (CSS Custom Properties)

**Light theme:**
- `--bg-primary: #ffffff`
- `--bg-secondary: #f8f9fa`
- `--bg-tertiary: #f1f3f4`
- `--bg-hover: #e8eaed`
- `--text-primary: #202124`
- `--text-secondary: #5f6368`
- `--text-tertiary: #80868b`
- `--accent: #1a73e8`
- `--accent-bg: #e8f0fe`
- `--border: #dadce0`
- `--border-light: #e8eaed`
- `--active-dot: #34a853`
- `--danger: #d93025`

**Dark theme:**
- `--bg-primary: #202124`
- `--bg-secondary: #303134`
- `--bg-tertiary: #3c4043`
- `--bg-hover: #44474a`
- `--text-primary: #e8eaed`
- `--text-secondary: #9aa0a6`
- `--accent: #8ab4f8`
- `--accent-bg: #394457`
- `--border: #3c4043`
- `--active-dot: #34a853`
- `--danger: #f28b82`

**Chrome Tab Group colors:**
- Grey `#5f6368`, Blue `#1a73e8`, Red `#d93025`, Yellow `#f9ab00`, Green `#188038`, Pink `#d01884`, Purple `#9334e6`, Cyan `#007b83`, Orange `#e8710a`

#### Typography

- Font family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Body: 13px
- Tab title: 12px
- Status/controls: 11px
- Labels/badges: 10px
- Tiny: 9px

#### Key Component Specs

**Search bar:** `padding: 8px 12px 8px 34px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg-tertiary);`

**Domain header:** `padding: 9px 12px; background: var(--bg-secondary); gap: 8px;` with arrow (8px), favicon (16×16, border-radius: 2px), domain name (font-weight: 500, 13px), count badge (background: var(--accent), border-radius: 10px, padding: 1px 8px, 10px font, font-weight: 600)

**Domain header must include:** Time indicator (e.g. "2m", "1h", "3d") showing last access time for the group

**Tab row:** `padding: 7px 12px 7px 38px; gap: 8px;` with active dot (6×6, border-radius: 50%), tab title (12px), tab age (10px, color: var(--text-tertiary))

**Footer:** `padding: 8px 12px; border-top: 1px solid var(--border); background: var(--bg-secondary);` with banner position controls (left/right/off), language select, theme toggle (32×32 circle)

**Group color border:** `border-left: 3px solid var(--group-color)` on `.domain-group.has-group-color`

**Button positioning:** Rename, close, and group buttons appear on domain header hover. Close button on tab row hover. Exact positions per CSS — do not approximate.

#### Transitions & Animations

- Hover: 0.1s–0.15s
- Expand/collapse: 0.2s–0.4s ease
- Border/shadow: 0.15s
- Domain arrow rotation: `transform: rotate(90deg)` with 0.2s transition

### Scene 1 (Chaos) — Stylized

Scene 1 is exempt from pixel-perfect requirements. Use a stylized, exaggerated browser chrome to emphasize the chaos. Dark background (#1a1a2e), cramped tabs with truncated titles.

## Voiceover (TTS)

All text overlays are also spoken via Text-to-Speech. The voiceover drives the pacing of the video — animations sync to the narration, not the other way around.

### Narration Script

| Scene | Timestamp | Spoken Text |
|-------|-----------|-------------|
| 1 — Cold Open | 0–4s | *"We've all been here."* |
| 1 — Transition | 4–8s | *"But today is different."* |
| 2 — Domain Grouping | 8–13s | *"Everything sorted. Automatically."* |
| 2 — Search | 13–18s | *"Find any tab. Instantly."* |
| 3 — Multi-Window | 18–23s | *"All windows. One panel."* |
| 3 — Tab Groups | 23–28s | *"Color-coded groups. One click."* |
| 4 — localhost | 28–33s | *"localhost:3000 and :8080 — each gets its own group."* |
| 4 — Dev montage | 33–38s | *"Built for developers. By a developer."* |
| 5 — Outro | 38–42s | *"Your tabs. Finally organized."* |
| 5 — CTA | 42–45s | *"Free on the Chrome Web Store."* |

### TTS Requirements

- **Voice:** Natural-sounding English, friendly/casual tone (not robotic). Male or female — whichever sounds warmer.
- **Provider options:** ElevenLabs, Google Cloud TTS, or OpenAI TTS — choose based on quality and availability.
- **Format:** Individual audio clips per line (for precise sync with animations), plus a combined full narration track.
- **Pacing:** Relaxed, not rushed. Short pauses between sentences. The narration should feel like a friend showing you something cool, not a sales pitch.
- **Text overlays remain** as visual reinforcement alongside the spoken narration.

## Technical Notes

- Video resolution: 1920×1080 (16:9) — standard for Chrome Web Store and social media
- Frame rate: 30fps
- Built with Remotion (React-based video framework)
- All UI components as React/Remotion components with the real CSS values
- Animations via Remotion's `interpolate`, `spring`, and `useCurrentFrame`
- Text overlays use a clean sans-serif (Inter or similar) for visual reinforcement of the narration
- TTS audio clips imported as Remotion `<Audio>` components, synced per scene
- Sound effects: royalty-free, subtle, layered beneath the voiceover

## Deliverables

1. Remotion project with all scenes as compositions
2. Exported MP4 (1920×1080, 30fps)
3. Individual scene compositions for potential re-editing
