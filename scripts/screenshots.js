/**
 * Automated Chrome Web Store screenshot generator.
 *
 * Usage:
 *   node scripts/screenshots.js          # generate all screenshots
 *   node scripts/screenshots.js --headed # watch in real-time
 *
 * Output: store/screenshots/
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const extensionPath = path.resolve(__dirname, '..', 'extension');
const outputDir = path.resolve(__dirname, '..', 'store', 'screenshots');

// Chrome Web Store screenshot size: 1280x800
const VIEWPORT = { width: 1280, height: 800 };

// Side panel width in Chrome
const SIDE_PANEL_WIDTH = 360;

// Websites to open for a realistic tab list with diverse domains
const WEBSITES = [
  'https://github.com/trending',
  'https://github.com/features/actions',
  'https://developer.mozilla.org/en-US/docs/Web',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  'https://stackoverflow.com/questions',
  'https://news.ycombinator.com',
  'https://www.typescriptlang.org',
  'https://playwright.dev/docs/intro',
  'https://code.visualstudio.com',
  'https://www.youtube.com',
  'https://docs.google.com',
  'https://calendar.google.com',
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function launch() {
  const headed = process.argv.includes('--headed');

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--disable-default-apps',
      ...(headed ? [] : ['--window-position=0,0']),
    ],
    viewport: null,
  });

  // Get extension ID from service worker
  let sw = context.serviceWorkers()[0];
  if (!sw) sw = await context.waitForEvent('serviceworker');
  const extensionId = sw.url().split('/')[2];

  return { context, extensionId };
}

async function openWebsites(context) {
  console.log('Opening websites...');
  const pages = [];
  for (const url of WEBSITES) {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    pages.push(page);
    // Small delay to avoid rate limiting
    await sleep(500);
  }
  // Let favicons load
  await sleep(2000);
  return pages;
}

async function openSidePanel(context, extensionId) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await page.waitForSelector('.domain-group');
  // Wait for favicons to load
  await sleep(1500);
  return page;
}

async function setTheme(panel, theme) {
  if (theme === 'dark') {
    await panel.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
  } else {
    await panel.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
  }
  await sleep(300);
}

async function setLanguage(panel, lang) {
  await panel.evaluate((l) => {
    const select = document.getElementById('lang-select');
    select.value = l;
    select.dispatchEvent(new Event('change'));
  }, lang);
  await sleep(500);
}

async function expandFirstDomains(panel, count) {
  // Click the first N domain headers to expand them
  const headers = await panel.$$('.domain-header');
  for (let i = 0; i < Math.min(count, headers.length); i++) {
    await headers[i].click();
    await sleep(200);
  }
}

async function typeSearch(panel, query) {
  const search = await panel.$('#search');
  await search.fill(query);
  await sleep(500);
}

async function clearSearch(panel) {
  const search = await panel.$('#search');
  await search.fill('');
  await sleep(300);
}

async function screenshotPanel(panel, name) {
  const filePath = path.join(outputDir, `${name}.png`);

  // Screenshot the side panel content at store-friendly dimensions
  await panel.setViewportSize({ width: SIDE_PANEL_WIDTH, height: VIEWPORT.height });
  await sleep(300);
  await panel.screenshot({ path: filePath, fullPage: false });

  console.log(`  Saved: ${filePath}`);
}

async function screenshotComposite(panel, backgroundPage, name) {
  // Take a composite screenshot showing the side panel alongside a website
  const filePath = path.join(outputDir, `${name}.png`);

  // Screenshot background page
  await backgroundPage.setViewportSize({
    width: VIEWPORT.width - SIDE_PANEL_WIDTH,
    height: VIEWPORT.height,
  });
  await sleep(300);
  const bgBuffer = await backgroundPage.screenshot({ fullPage: false });

  // Screenshot side panel
  await panel.setViewportSize({ width: SIDE_PANEL_WIDTH, height: VIEWPORT.height });
  await sleep(300);
  const panelBuffer = await panel.screenshot({ fullPage: false });

  // Composite: panel on the right side, website on the left
  // Using canvas-free approach: save both and let the user composite
  // Or use a simple Node approach with raw pixel manipulation
  const bgPath = path.join(outputDir, `_bg_${name}.png`);
  const panelPath = path.join(outputDir, `_panel_${name}.png`);
  fs.writeFileSync(bgPath, bgBuffer);
  fs.writeFileSync(panelPath, panelBuffer);

  console.log(`  Saved composite parts: ${bgPath}, ${panelPath}`);
  console.log(`  Combine with: magick ${bgPath} ${panelPath} +append ${filePath}`);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('Launching Chrome with extension...');
  const { context, extensionId } = await launch();

  // Close default blank tab
  const defaultPages = context.pages();
  for (const p of defaultPages) {
    if (p.url() === 'about:blank' || p.url() === 'chrome://newtab/') {
      await p.close().catch(() => {});
    }
  }

  // Open diverse websites
  const webPages = await openWebsites(context);

  // Open side panel
  console.log('Opening side panel...');
  const panel = await openSidePanel(context, extensionId);

  // Expand first few domain groups so tabs are visible
  await expandFirstDomains(panel, 4);

  // --- Screenshot 1: Light theme overview ---
  console.log('\n1. Light theme overview...');
  await setTheme(panel, 'light');
  await setLanguage(panel, 'en');
  await screenshotPanel(panel, '01-light-overview');

  // --- Screenshot 2: Dark theme overview ---
  console.log('2. Dark theme overview...');
  await setTheme(panel, 'dark');
  await screenshotPanel(panel, '02-dark-overview');

  // --- Screenshot 3: Search in action ---
  console.log('3. Search functionality...');
  await setTheme(panel, 'light');
  await typeSearch(panel, 'github');
  await screenshotPanel(panel, '03-search');
  await clearSearch(panel);

  // --- Screenshot 4: German language ---
  console.log('4. German language...');
  await setLanguage(panel, 'de');
  await screenshotPanel(panel, '04-german');
  await setLanguage(panel, 'en');

  // --- Screenshot 5: Composite with website (light) ---
  console.log('5. Composite with website (light)...');
  await setTheme(panel, 'light');
  const githubPage = webPages.find(p => p.url().includes('github.com'));
  if (githubPage) {
    await screenshotComposite(panel, githubPage, '05-composite-light');
  }

  // --- Screenshot 6: Composite with website (dark) ---
  console.log('6. Composite with website (dark)...');
  await setTheme(panel, 'dark');
  if (githubPage) {
    await screenshotComposite(panel, githubPage, '06-composite-dark');
  }

  console.log('\nDone! Screenshots saved to store/screenshots/');
  console.log('\nFor composite images, combine the parts:');
  console.log('  magick _bg_*.png _panel_*.png +append <output>.png');
  console.log('  or use any image editor to place them side by side.');

  await context.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
