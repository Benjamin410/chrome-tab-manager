const { test: base, chromium } = require('@playwright/test');
const path = require('path');

const extensionPath = path.resolve(__dirname, '..', 'extension');

/** Relative path from the extension root to the side panel HTML (manifest default_path). */
const SIDE_PANEL_HTML = 'features/tab-browser/sidepanel.html';

/**
 * Custom fixture that launches Chrome with the extension loaded.
 * Provides `context`, `extensionId`, and a helper to open the side panel page.
 */
const test = base.extend({
  // Override context to launch with the extension
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
        '--disable-default-apps',
      ],
    });
    // Intercept external test URLs so tests don't require network access.
    // Page-level routes (e.g. in search.spec.js) take precedence over these.
    await context.route('https://example.com/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<!DOCTYPE html><html><head><title>Example Domain</title></head><body><h1>Example Domain</h1></body></html>',
      });
    });
    await context.route('https://example.org/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<!DOCTYPE html><html><head><title>Example Org</title></head><body><h1>Example Org</h1></body></html>',
      });
    });
    await use(context);
    await context.close();
  },

  // Derive extensionId from the service worker
  extensionId: async ({ context }, use) => {
    let serviceWorker;

    // Check if a service worker is already registered
    const existing = context.serviceWorkers();
    if (existing.length > 0) {
      serviceWorker = existing[0];
    } else {
      serviceWorker = await context.waitForEvent('serviceworker');
    }

    const url = serviceWorker.url();
    // chrome-extension://<id>/background.js
    const id = url.split('/')[2];
    await use(id);
  },

  // Helper: opens the side panel HTML directly in a new tab (for UI testing)
  sidePanelPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/${SIDE_PANEL_HTML}`);
    // Wait for the panel to initialize (tabs loaded and rendered)
    await page.waitForSelector('.domain-group, .empty-state');
    await use(page);
  },
});

test.SIDE_PANEL_HTML = SIDE_PANEL_HTML;
module.exports = test;
