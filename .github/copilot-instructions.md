# Copilot Code Review Guidelines

These rules apply when reviewing pull requests for the Chrome Tab Manager extension.

## Architecture & Structure

- This is a **Chrome Extension (Manifest V3)** using vanilla JavaScript — no frameworks, no build step
- Extension code lives in `extension/` with subdirectories:
  - `core/` — shared code (i18n, background service worker, type definitions)
  - `features/tab-browser/` — main side panel UI, search, grouping, banner, page labels
  - `features/tab-history/` — recently closed tabs/windows
  - `features/tab-usage/` — tab usage dashboard and stats
- Tests are Playwright E2E tests in `tests/` that load the real extension in Chrome

## Code Quality Rules

### No framework patterns in vanilla JS
- Do not introduce React, Vue, or other framework patterns
- Keep DOM manipulation direct and simple
- CSS custom properties for theming, no CSS-in-JS

### Chrome Extension API usage
- All Chrome API calls (`chrome.tabs`, `chrome.storage`, `chrome.sessions`, etc.) must handle errors gracefully
- Use `chrome.storage.local` for persistence, never `localStorage`
- Service worker (`core/background/main.js`) must clean up storage when tabs are closed (prevent stale entries)
- Content scripts must not assume DOM structure of host pages

### i18n completeness
- All user-visible strings must be defined in `core/i18n.js`
- Every string must exist in all 4 languages: `en`, `de`, `fr`, `es`
- If a PR adds UI text, verify all 4 language blocks have the new keys
- Language keys should be descriptive (e.g., `confirmCloseOld` not `msg1`)

### Permissions
- Flag any new permissions added to `manifest.json` — they must be justified
- The extension currently uses: `tabs`, `tabGroups`, `sidePanel`, `storage`, `sessions`
- Adding `activeTab`, `scripting`, `webRequest`, or host permissions requires explicit justification

## Testing Rules

### E2E test expectations
- Every new user-facing feature must have at least one E2E test
- Tests use the fixture from `tests/fixtures.js` which provides `context`, `extensionId`, and `sidePanelPage`
- Tests must work in non-headless Chrome (extensions require it)
- Use `xvfb-run` pattern for CI — tests run under virtual framebuffer on Linux
- Avoid `waitForTimeout` where a proper selector wait is possible

### Test file naming
- One spec file per feature area: `tests/<feature>.spec.js`
- New spec files must be added to the README test coverage table

## README Sync Rules

When reviewing PRs, check if the README needs updating:

### Features list (`## Features`)
- Every user-facing feature must be listed
- New features need a one-line description with the `**name** — description` format
- Removed features must be deleted from the list

### Usage table (`## Usage`)
- Every user action/interaction must have a row
- Format: `| Action description | How to do it |`

### Project structure (`## Project Structure`)
- File tree must reflect actual paths
- New files in `extension/`, `tests/`, `scripts/`, or `.github/workflows/` must be added
- Removed files must be deleted from the tree

### Test coverage table (`### Test Coverage`)
- Total test count in heading must match actual count
- Each spec file needs a row with correct test count
- Sort by test count descending

### When to flag
- If a PR adds a feature but doesn't update README Features → flag it
- If a PR adds a test file but doesn't update the coverage table → flag it
- If a PR moves/renames files but doesn't update Project Structure → flag it
- If a PR adds UI text without i18n strings in all 4 languages → flag it

## PR Quality

### Scope
- PRs should be focused on one concern — flag unrelated changes
- Config changes, refactors, and features should be separate PRs

### Commit messages
- Should explain WHY, not just WHAT
- Use imperative mood ("Add feature" not "Added feature")

### No secrets or credentials
- Flag any hardcoded API keys, tokens, or secrets
- Extension IDs, OAuth credentials must come from GitHub Secrets
