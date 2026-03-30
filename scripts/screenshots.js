/**
 * Automated Chrome Web Store screenshot generator.
 *
 * Produces 1280x800 composite images (website left, side panel right)
 * as 24-bit PNG without alpha — Chrome Web Store compliant.
 *
 * Usage:
 *   npm run screenshots            # generate all screenshots
 *   npm run screenshots -- --headed # watch in real-time
 *
 * Output: store/screenshots/
 */

const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const extensionPath = path.resolve(__dirname, '..', 'extension');
const playwrightTest = require('../tests/fixtures');
const outputDir = path.resolve(__dirname, '..', 'store', 'screenshots');

// Chrome Web Store required size
const WIDTH = 1280;
const HEIGHT = 800;
const PANEL_WIDTH = 360;
const SITE_WIDTH = WIDTH - PANEL_WIDTH;

// Websites to open for a realistic tab list
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function launch() {
  const headed = process.argv.includes('--headed');
  const isCI = !!process.env.CI;
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--disable-default-apps',
      ...(headed ? [] : ['--window-position=0,0']),
      ...(isCI ? ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] : []),
    ],
    viewport: null,
  });

  let sw = context.serviceWorkers()[0];
  if (!sw) sw = await context.waitForEvent('serviceworker');
  const extensionId = sw.url().split('/')[2];

  return { context, extensionId };
}

async function openWebsites(context) {
  console.log('Opening websites...');
  const pages = [];
  for (const url of WEBSITES) {
    let page;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        page = await context.newPage();
        break;
      } catch (err) {
        console.warn(`  Retry ${attempt + 1}/3 opening tab for ${url}: ${err.message}`);
        await sleep(1000);
      }
    }
    if (!page) {
      console.warn(`  Skipping ${url} — could not open tab`);
      continue;
    }
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    pages.push(page);
    await sleep(800);
  }
  await sleep(2000);
  return pages;
}

async function openSidePanel(context, extensionId) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${playwrightTest.SIDE_PANEL_HTML}`);
  await page.waitForSelector('.domain-group');
  await sleep(1500);
  return page;
}

async function setTheme(panel, theme) {
  await panel.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
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
  const arrows = await panel.$$('.domain-header .domain-arrow');
  for (let i = 0; i < Math.min(count, arrows.length); i++) {
    await arrows[i].click();
    await sleep(200);
  }
}

async function collapseAllDomains(panel) {
  let expanded = await panel.$$('.domain-group.expanded .domain-arrow');
  for (const arrow of expanded) {
    try { await arrow.click(); } catch { /* element detached, re-query */ break; }
    await sleep(100);
  }
  // Re-query in case DOM was refreshed mid-loop
  expanded = await panel.$$('.domain-group.expanded .domain-arrow');
  for (const arrow of expanded) {
    try { await arrow.click(); } catch { break; }
    await sleep(100);
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

/**
 * Creates a 1280x800 composite: website on the left, side panel on the right.
 * Uses an HTML page to composite and flatten to 24-bit PNG (no alpha).
 */
async function screenshotComposite(context, panel, sitePage, name) {
  const filePath = path.join(outputDir, `${name}.png`);

  // Capture site screenshot
  await sitePage.setViewportSize({ width: SITE_WIDTH, height: HEIGHT });
  await sleep(300);
  const siteBuffer = await sitePage.screenshot({ fullPage: false });
  const siteBase64 = siteBuffer.toString('base64');

  // Capture panel screenshot
  await panel.setViewportSize({ width: PANEL_WIDTH, height: HEIGHT });
  await sleep(300);
  const panelBuffer = await panel.screenshot({ fullPage: false });
  const panelBase64 = panelBuffer.toString('base64');

  // Use a page with canvas to composite both images into one 1280x800 PNG
  const compositorPage = await context.newPage();
  await compositorPage.setViewportSize({ width: WIDTH, height: HEIGHT });

  const resultBase64 = await compositorPage.evaluate(async ({ siteB64, panelB64, w, h, sw, pw }) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // White background (ensures no alpha)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    async function loadImg(b64) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = `data:image/png;base64,${b64}`;
      });
    }

    const siteImg = await loadImg(siteB64);
    const panelImg = await loadImg(panelB64);

    // Draw site on the left
    ctx.drawImage(siteImg, 0, 0, sw, h);

    // Draw 1px separator line
    ctx.fillStyle = '#dadce0';
    ctx.fillRect(sw, 0, 1, h);

    // Draw panel on the right
    ctx.drawImage(panelImg, sw + 1, 0, pw - 1, h);

    // Export as PNG blob, read as base64
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }, { siteB64: siteBase64, panelB64: panelBase64, w: WIDTH, h: HEIGHT, sw: SITE_WIDTH, pw: PANEL_WIDTH });

  // Write the composite PNG
  fs.writeFileSync(filePath, Buffer.from(resultBase64, 'base64'));
  await compositorPage.close();

  console.log(`  Saved: ${filePath}`);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('Launching Chrome with extension...');
  const { context, extensionId } = await launch();

  // Remember blank tabs to close later (closing them now would kill the browser)
  const blankPages = context.pages().filter(
    p => p.url() === 'about:blank' || p.url() === 'chrome://newtab/'
  );

  const webPages = await openWebsites(context);

  // Now that we have other tabs open, close the initial blank tabs
  for (const p of blankPages) {
    await p.close().catch(() => {});
  }
  console.log('Opening side panel...');
  const panel = await openSidePanel(context, extensionId);
  await expandFirstDomains(panel, 4);

  // Pick background pages for composites
  const githubPage = webPages.find(p => p.url().includes('github.com/trending'));
  const mdnPage = webPages.find(p => p.url().includes('developer.mozilla.org'));
  const bgPage = githubPage || webPages[0];
  const bgPage2 = mdnPage || webPages[1];

  // --- Screenshot 1: Light theme overview ---
  console.log('\n1. Light theme — tab overview...');
  await setTheme(panel, 'light');
  await setLanguage(panel, 'en');
  await screenshotComposite(context, panel, bgPage, '01-light-overview');

  // --- Screenshot 2: Dark theme overview ---
  console.log('2. Dark theme — tab overview...');
  await setTheme(panel, 'dark');
  await screenshotComposite(context, panel, bgPage, '02-dark-overview');

  // --- Screenshot 3: Search in action ---
  console.log('3. Search functionality...');
  await setTheme(panel, 'light');
  await typeSearch(panel, 'github');
  await screenshotComposite(context, panel, bgPage, '03-search');
  await clearSearch(panel);

  // --- Screenshot 4: German language ---
  console.log('4. Multi-language (German)...');
  await setLanguage(panel, 'de');
  await screenshotComposite(context, panel, bgPage2, '04-german');
  await setLanguage(panel, 'en');

  // --- Screenshot 5: Dark theme with different site ---
  console.log('5. Dark theme — alternative view...');
  await setTheme(panel, 'dark');
  await collapseAllDomains(panel);
  await expandFirstDomains(panel, 3);
  await screenshotComposite(context, panel, bgPage2, '05-dark-alt');

  // Strip alpha channel from all PNGs (Chrome Web Store requires 24-bit PNG, no alpha)
  console.log('\nStripping alpha channel...');
  const pngFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
  for (const file of pngFiles) {
    const filePath = path.join(outputDir, file);
    try {
      // Use Python PIL to convert RGBA → RGB (works on macOS and Linux)
      execSync(`python3 -c "from PIL import Image; Image.open('${filePath}').convert('RGB').save('${filePath}')"`, { stdio: 'ignore' });
    } catch {
      console.warn(`  Warning: could not strip alpha from ${file} (install Pillow: pip3 install Pillow)`);
    }
  }

  console.log('Done! Screenshots saved to store/screenshots/');
  console.log('All images are 1280x800 24-bit PNG (Chrome Web Store compliant).');

  await context.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
