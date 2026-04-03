# Tab Manager Promo Video — Production Spec

> Complete specification to reproduce or iterate on the 45-second promotional video.
> All visual sizes, animations, colors, data, and voiceover texts are documented here.

---

## General

| Property | Value |
|----------|-------|
| Resolution | 1920 x 1080 (Full HD) |
| FPS | 30 |
| Total duration | ~47s (1410 frames incl. transitions) |
| Transitions | `fade()` via `TransitionSeries`, 15 frames each (4 transitions) |
| Font | Inter (Google Fonts, all weights) |
| Language | English |
| Tone | Playful, approachable |
| Target audience | General users + developers |

### Scene Durations

| Scene | Frames | Seconds | Description |
|-------|--------|---------|-------------|
| ColdOpen | 240 | 8s | Tab chaos — browser filling up |
| Morning | 300 | 10s | Domain grouping + search |
| Midday | 300 | 10s | Multi-window merge + Chrome Tab Groups |
| Evening | 300 | 10s | Dark mode, localhost groups, keyboard shortcut |
| Outro | 210 | 7s | Before/After + Logo + CTA |

---

## Voiceover (TTS)

**Provider:** ElevenLabs  
**Voice:** Antoni (`ErXwobaYiN019PkySvjV`)  
**Model:** `eleven_multilingual_v2`  
**Settings:** stability 0.5, similarity_boost 0.75, style 0.5, speaker_boost true

| ID | Text | File | Plays at |
|----|------|------|----------|
| cold-open | "We've all been here." | `01-cold-open.mp3` | ColdOpen start |
| transition | "But today is different." | `02-transition.mp3` | ColdOpen midpoint |
| morning-sort | "Everything sorted. Automatically." | `03-morning-sort.mp3` | Morning start |
| morning-search | "Find any tab. Instantly." | `04-morning-search.mp3` | Morning midpoint |
| midday-windows | "All windows. One panel." | `05-midday-windows.mp3` | Midday start |
| midday-groups | "Color-coded groups. One click." | `06-midday-groups.mp3` | Midday midpoint |
| evening-localhost | "localhost 3000 and 8080. Each gets its own group." | `07-evening-localhost.mp3` | Evening start |
| evening-dev | "Built for developers. By a developer." | `08-evening-dev.mp3` | Evening midpoint |
| outro-tagline | "Your tabs. Finally organized." | `09-outro-tagline.mp3` | Outro start |
| outro-cta | "Free on the Chrome Web Store." | `10-outro-cta.mp3` | Outro phase switch |

---

## TextOverlay (Global)

All scenes use the `<TextOverlay>` component for lower-third text.

| Property | Value |
|----------|-------|
| Default fontSize | 48px (scenes override to 38–42px) |
| Color | `#ffffff` |
| Background | `rgba(0, 0, 0, 0.6)` with `backdrop-filter: blur(8px)` |
| Padding | `12px 28px` |
| Border radius | 12px |
| Font weight | 700 |
| Text shadow | `0 2px 8px rgba(0,0,0,0.5)` |
| Animation | Spring fade-in + translateY(20 → 0) |

### Position: `bottom-left`
Centered within the **left half** of the screen (left 50% quarter):
- `bottom: 80px`, `left: 0`, `width: 50%`, `display: flex`, `justify-content: center`

### Position: `bottom-center`
- `bottom: 80px`, `left: 50%`, `translateX(-50%)`

### Overlap prevention
- Phase 1 text wrapped in `<Sequence from={0} durationInFrames={midpoint}>` with `fadeOutAfter={midpoint - 20}`
- Phase 2 text wrapped in `<Sequence from={midpoint}>`

---

## Scene 1: ColdOpen

**Theme:** Dark (`#1a1a2e` background)  
**Concept:** Browser fills with tabs, wobbles under pressure, warning overlay appears.

### Browser mockup
- **Width:** 1760px, centered in viewport
- **Colors:** `#2d2d44` (body), `#23233a` (title bar + tab bar)
- **Traffic lights:** `#ff5f57` / `#febc2e` / `#28c840` (12px circles)
- **Border radius:** 12px
- **Shadow:** `0 20px 60px rgba(0,0,0,0.5)`

### Tab bar
- Tabs grow from 1 → 45 over first 100 frames
- Tab width shrinks from 140px → 18px (min 14px)
- Active tab: `#2d2d44`, inactive: `#1e1e32`
- Labels hidden when width < 30px
- 45 tab names: Gmail, YouTube, GitHub, Reddit, Slack, Jira, Google Docs, Stack Overflow, Twitter, LinkedIn, Figma, Notion, AWS Console, ChatGPT, Spotify, Google Maps, Amazon, Netflix, Wikipedia, Trello, VS Code Web, Confluence, Google Drive, Calendar, Discord, Zoom, Canva, Medium, Hacker News, CodePen, NPM, Docker Hub, Vercel, Stripe, Google Analytics, Firebase, Sentry, Datadog, PagerDuty, Grafana, Jenkins, CircleCI, Bitbucket, GitLab, Heroku

### Webpage content (visible throughout)
- **Content area height:** 720px, white background
- **Navbar:** 44px, `#1e293b`, with "SiteName" brand (`#38bdf8`), nav items (Home, Products, Blog, Pricing, Contact) in `#94a3b8`, search bar mockup
- **Main content:** Hero text blocks, 3 image placeholders (180×110, `#cbd5e1`), paragraph skeleton lines, 4 card row
- **Sidebar:** 240px, `#f8fafc` background, skeleton blocks

### Wobble animation
- Intensity grows linearly from 0 → 8 over full scene duration
- X: `sin(frame * 0.8) * intensity`
- Y: `cos(frame * 0.6) * intensity * 0.5`

### Warning overlay (replaces emoji)
- Fades in from frame 60 → 100
- Radial gradient background: `rgba(255,255,255,0.92)` center → transparent
- Red warning triangle SVG (80×80, stroke `#d93025`)
- "TOO MANY TABS" label: 22px, bold, `#d93025`, letter-spacing 1

### Text overlays
1. **Phase 1:** "We've all been here." — fontSize 42, position `bottom-center`, fadeOutAfter `midpoint - 20`
2. **Phase 2:** "But today is different." — fontSize 42, position `bottom-center`

---

## Scene 2: Morning

**Theme:** Light (`#f0f4f8` background)  
**Concept:** Tab Manager panel slides in showing domain groups. Browser shows matching webpage. Second half: search typing filters results.

### Browser mockup (background, left side)
- **Position:** left 40px, top 40px
- **Size:** 1380 x 900px
- **Title bar:** 40px, `#f1f3f4`, traffic lights (`#d93025` / `#f9ab00` / `#188038`), address bar mockup
- **Content area:** 856px height, `#fafbfc` background

### Browser content (dynamic — matches Tab Manager state)

**Phase 1 (overview):** GitHub repo page mockup
- Nav bar with avatar circle, nav links, search box
- Repo header with blue link (200px)
- Tab row: Code (active, orange underline), Issues, Pull requests, Actions
- File list: src, tests, docs, package.json, README.md with timestamps

**Phase 2 (search filtered):** GitHub PR page mockup
- Same nav bar
- PR badge: green "Open" pill (`#1a7f37`), title "Fix auth flow", number "#42"
- Diff mockup: `src/auth.ts` header, green added lines, red removed line

### Tab Manager panel (right side, slides in)
- **Position:** right 30px, top 30px
- **Size:** 440 x 960px
- **Slide animation:** spring (damping 18, stiffness 80, mass 0.8), translateX 400 → 0

**Phase 1 — Domain groups (16 tabs total):**

| Domain | Count | Age | Expanded | Tabs |
|--------|-------|-----|----------|------|
| github.com | 5 | 2m | No | — |
| gmail.com | 3 | 5m | Yes | Inbox (4), Drafts, Settings |
| youtube.com | 2 | 15m | No | — |
| stackoverflow.com | 4 | 30m | No | — |
| developer.mozilla.org | 2 | 1h | No | — |

- Groups animate in staggered: each delayed by `10 + i*6` frames, spring (damping 16, stiffness 100, mass 0.6)

**Phase 2 — Search filter (2 tabs):**
- Search text: "PR #42" (typed 1 char / 4 frames)
- Filters to github.com group (expanded) showing:
  - "Pull Request #42 — Fix auth flow" (active)
  - "Issues · Benjamin410/Chrome"
- Transition: `showFiltered = typedChars > 2`

### Text overlays
1. **Phase 1:** "Everything sorted. Automatically." — fontSize 38, position `bottom-left`
2. **Phase 2:** "Find any tab. Instantly." — fontSize 38, position `bottom-left`

---

## Scene 3: Midday

**Theme:** Dark background (`#1a1a2e`), light Tab Manager panel  
**Concept:** Three floating browser windows merge into one Tab Manager panel. Second half: Chrome Tab Group colors pop in.

### Floating window cards

| Window | Label | Border color | Position (x, y) | Tabs | Page content |
|--------|-------|-------------|------------------|------|--------------|
| Work | Work | `chromeGroupColors.blue` | -440, -120 | Jira, Slack, Google Docs | Blue header, gray lines, table rows |
| Research | Research | `chromeGroupColors.yellow` | 440, -60 | Stack Overflow, MDN | Dark header, gray lines, yellow highlight box |
| Personal | Personal | `chromeGroupColors.green` | 0, 220 | YouTube, Reddit | Dark thumbnail area, gray lines |

**Window card styling:**
- Width: 340px
- Background: `#2d2d44`, border radius 10px
- Border: `2px solid {borderColor}`
- Shadow: `0 8px 24px rgba(0,0,0,0.4)`
- Title bar: `#23233a`, 8px traffic lights, label text
- Tab list: 11px, `#ccc`, separated by `1px solid #3c3c5a`
- Webpage area: white background, colored skeleton blocks per window

**Merge animation (slow spring):**
- Config: damping 30, stiffness 40, mass 1.2, delay 25 frames
- Windows translate from their offset positions → center (0,0)
- **Fade out:** opacity 1 → 0 from progress 0.5 → 0.95 (slow disappearance)
- **Scale down:** 1 → 0.3 from progress 0.5 → 0.95

### Tab Manager panel (centered)
- **Size:** 460 x 880px (light theme)
- **Window label:** "All Windows"
- **Tab count:** 9
- **Fade in:** linked to merge progress (opacity 0 at 0.4, 1 at 1.0), scale 0.9 → 1.0

**Domain groups (6 items):**

| Domain | Count | Age | Group color (Phase 2) |
|--------|-------|-----|----------------------|
| jira.com | 3 | 2h | blue |
| slack.com | 2 | 1h | blue |
| stackoverflow.com | 1 | 30m | yellow |
| developer.mozilla.org | 1 | 25m | yellow |
| youtube.com | 1 | 15m | green |
| reddit.com | 1 | 10m | green |

**Phase 2 — Group color pop:**
- At midpoint, `groupColor` values activate on domain groups
- Scale pulse: 1 → 1.03 → 1 (spring damping 15, stiffness 200)

### Text overlays
1. **Phase 1:** "All windows. One panel." — fontSize 38, position `bottom-left`
2. **Phase 2:** "Color-coded groups. One click." — fontSize 38, position `bottom-left`

---

## Scene 4: Evening

**Theme:** Dark mode (catppuccin-style), dark Tab Manager panel  
**Concept:** Code editor + dark mode Tab Manager side by side. Keyboard shortcut indicator appears in Phase 2.

### Dark mode wipe
- Circle reveal from center-right: `circle(R% at 80% 50%)`
- Spring: damping 30, stiffness 60, mass 0.8
- Background: `darkTheme.bgPrimary`

### Code editor mockup (left side)
- **Position:** left 40px, top 40px
- **Size:** 1340 x 900px
- **Background:** `#1e1e2e`, border radius 12px
- **Shadow:** `0 12px 40px rgba(0,0,0,0.6)`
- **Title bar:** `#181825`, traffic lights, "server.js — my-app" label
- **Code font:** `'JetBrains Mono', 'Fira Code', monospace`, 18px, line-height 36px
- **Entrance:** spring (delay 10, damping 20, stiffness 80, mass 0.6), translateX -40 → 0

**Code lines (catppuccin colors):**

| Line | Code | Color |
|------|------|-------|
| 1 | `const express = require('express');` | `#cba6f7` (mauve) |
| 2 | `const app = express();` | `#89b4fa` (blue) |
| 3 | *(empty)* | transparent |
| 4 | `app.use(express.json());` | `#a6e3a1` (green) |
| 5 | *(empty)* | transparent |
| 6 | `app.get('/api/tabs', (req, res) => {` | `#f9e2af` (yellow) |
| 7 | `  const tabs = db.getTabs(req.user);` | `#89b4fa` |
| 8 | `  res.json({ tabs });` | `#a6e3a1` |
| 9 | `});` | `#f9e2af` |
| 10 | *(empty)* | transparent |
| 11 | `app.listen(3000, () => {` | `#f9e2af` |
| 12 | `  console.log('Server running');` | `#fab387` (peach) |
| 13 | `});` | `#f9e2af` |

- Line numbers: `#45475a`, 28px wide, right-aligned
- Lines appear staggered: visible after frame `20 + i*3`

### Tab Manager panel (right side, dark theme)
- **Position:** right 30px, top 30px
- **Size:** 440 x 960px
- **Entrance:** spring (delay 15, damping 20, stiffness 80, mass 0.6), translateX 40 → 0

**Domain groups (10 tabs total):**

| Domain | Count | Age | Expanded | Group color | Custom name |
|--------|-------|-----|----------|-------------|-------------|
| localhost:3000 | 4 | 1m | Yes | green | — |
| localhost:8080 | 2 | 10m | No | cyan | — |
| 192.168.1.1 | 1 | 3h | No | — | Router Admin Panel |
| github.com | 3 | 5m | No | blue | — |

Expanded tabs for localhost:3000:
- "Dashboard — My App" (active)
- "API Documentation"
- "Login Page"
- "Settings — My App"

### Keyboard shortcut indicator (Phase 2)
- Appears at `midpoint + 10` frames
- Position: left 80px, bottom 120px
- Keycaps: `⌘` and `M`
  - Background: `#313244`, border `#45475a`, radius 6px
  - Shadow: `0 2px 0 #45475a`
  - Font: 20px, bold, `#cdd6f4`
- Label: "Open Tab Manager" — 16px, `#9aa0a6`

### Text overlays
1. **Phase 1:** "localhost:3000 and :8080 — each gets its own group." — fontSize 34, position `bottom-left`
2. **Phase 2:** "Built for developers. By a developer." — fontSize 38, position `bottom-left`

---

## Scene 5: Outro

**Theme:** White background  
**Concept:** Before/After split screen reveals, then fades to logo + CTA.

### Phase switch
- At 55% of scene duration

### Phase 1: Before/After split screen

**LEFT side — "BEFORE":**
- Background: `#1a1a2e`
- Label: "BEFORE" — 36px, bold, white, letter-spacing 3, uppercase
- 24 tab pill mockups: 64 x 16px, `#3c3c5a`, radius 4px, `max-width: 500`, gap 6px
- Warning triangle SVG (80×80, `#ff5f57` stroke, 0.8 opacity)

**RIGHT side — "AFTER":**
- Background: `#ffffff`
- Label: "AFTER" — 36px, bold, `lightTheme.textPrimary`, letter-spacing 3
- 3 tab group pills:
  - Work (blue), Dev (green), Research (yellow)
  - 24px font, bold, pill shape (radius 24, padding 12px 36px)
  - Each has 14px colored dot
- Checkmark circle SVG (64×64, `#188038` stroke, 0.7 opacity)

**Split animation:**
- `splitWidth` springs from 0% → 50%
- Divider line: 2px, `lightTheme.border`

**Split fade out:**
- Opacity 1 → 0 from `phaseSwitch` → `phaseSwitch + 15`

### Phase 2: Logo + CTA (centered)

| Element | Size/Style | Animation |
|---------|-----------|-----------|
| Icon | `images/icon128.png`, 128×128 | Spring scale 0 → 1 |
| Title | "Tab Manager", 64px, bold, `#202124` | Spring translateY 30 → 0 + opacity |
| Subtitle | "Your tabs. Finally organized.", 38px, `#5f6368` | Same spring as title |
| CTA button | "Free on Chrome Web Store", 30px, bold, white on `lightTheme.accent` | Pulse: `1 + sin(frame*0.15) * 0.03`, padding 18px 52px, radius 32 |
| Screenshot | `images/screenshot-light.png`, 380px wide | Fade in frame 15–35 |

### Fade to black
- Last 15 frames: black overlay opacity 0 → 1

### Text overlays
- None (voiceover only)

---

## Theme Values

### Light Theme
```
bgPrimary: #ffffff
bgSecondary: #f8f9fa
bgTertiary: #f1f3f4
textPrimary: #202124
textSecondary: #5f6368
textTertiary: #80868b
border: #dadce0
accent: #1a73e8
accentHover: #1765cc
shadow: rgba(0, 0, 0, 0.1)
```

### Dark Theme
```
bgPrimary: #292a2d
bgSecondary: #35363a
bgTertiary: #3c4043
textPrimary: #e8eaed
textSecondary: #9aa0a6
textTertiary: #80868b
border: #3c4043
accent: #8ab4f8
accentHover: #aecbfa
shadow: rgba(0, 0, 0, 0.3)
```

### Chrome Group Colors
```
blue: #4285f4
red: #ea4335
yellow: #fbbc04
green: #34a853
pink: #ff6d94
purple: #a142f4
cyan: #24c1e0
orange: #fa903e
```

---

## Tab Manager UI Component

The shared panel shell used in scenes 2, 3, and 4.

| Property | Default | Morning | Midday | Evening |
|----------|---------|---------|--------|---------|
| width | 380px | 440px | 460px | 440px |
| height | 700px | 960px | 880px | 960px |
| theme | — | light | light | dark |

Contains: SearchBar, FilterRow, StatusBar, scrollable content area, PanelFooter.

---

## Static Assets Required

| File | Used in |
|------|---------|
| `public/images/icon128.png` | Outro Phase 2 |
| `public/images/screenshot-light.png` | Outro Phase 2 |
| `public/voiceover/01-cold-open.mp3` – `10-outro-cta.mp3` | All scenes |

---

## Known Workarounds

### Remotion null-props bug
`@remotion/bundler` v4.0.443 crashes in `setup-sequence-stack-traces.js:19` when `React.createElement` receives `null` props. Patched via `scripts/patch-remotion.js` (runs as `postinstall`). Adds a null guard before accessing `props.stack`.

### Audio guards
All `<Audio>` elements are conditionally rendered inside `<Sequence>`:
```tsx
<Sequence from={midpoint}>
  {voiceoverFiles?.[1] ? <Audio src={staticFile(voiceoverFiles[1])} /> : null}
</Sequence>
```
This prevents crashes when voiceover files are not provided.

---

## Build & Render

```bash
npm install                    # also runs postinstall patch
npx remotion studio            # preview in browser
npx remotion render TabManagerVideo out/product-video.mp4 --overwrite
```

### Regenerate voiceover
Requires `ELEVEN_LABS_API_KEY` in environment (e.g. `~/.zshrc`):
```bash
npx dotenv-cli -- npx tsx generate-voiceover.ts
```
