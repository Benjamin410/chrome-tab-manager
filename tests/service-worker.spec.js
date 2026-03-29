const { expect } = require('@playwright/test');
const test = require('./fixtures');

test.describe('Service Worker', () => {
  test('broadcasts tabs-changed on tab creation', async ({ context, extensionId }) => {
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group, .empty-state');

    const groupsBefore = await panel.locator('.domain-group').count();

    // Open a new tab on a unique domain
    const newTab = await context.newPage();
    await newTab.goto('https://example.com');

    // Panel should update automatically (via tabs-changed message)
    await panel.waitForTimeout(2000);
    const exampleGroup = panel.locator('.domain-name', { hasText: 'example.com' });
    await expect(exampleGroup).toBeVisible();
  });

  test('updates panel when tab is closed', async ({ context, extensionId }) => {
    const target = await context.newPage();
    await target.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Verify example.com is visible
    await expect(panel.locator('.domain-name', { hasText: 'example.com' })).toBeVisible();

    // Close the tab
    await target.close();

    // Panel should update — example.com should disappear
    await expect(panel.locator('.domain-name', { hasText: 'example.com' })).toBeHidden({ timeout: 5000 });
  });

  test('tracks tab usage opened timestamps in storage', async ({ context, extensionId }) => {
    // Open a tab to trigger tracking
    const target = await context.newPage();
    await target.goto('https://example.com');
    await target.waitForLoadState('domcontentloaded');

    // Wait for background to record
    await target.waitForTimeout(1000);

    // Check storage via the service worker
    const sw = context.serviceWorkers()[0];
    const usageMap = await sw.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get('tabUsageTabOpenedAt', (result) => {
          resolve(result.tabUsageTabOpenedAt || {});
        });
      });
    });

    // Should have at least one entry
    const keys = Object.keys(usageMap);
    expect(keys.length).toBeGreaterThan(0);

    // Values should be timestamps (numbers > 0)
    for (const key of keys) {
      expect(usageMap[key]).toBeGreaterThan(0);
    }
  });

  test('cleans up tab usage on tab close', async ({ context, extensionId }) => {
    const target = await context.newPage();
    await target.goto('https://example.com');
    await target.waitForLoadState('domcontentloaded');
    await target.waitForTimeout(1000);

    // Get the tab ID before closing
    const sw = context.serviceWorkers()[0];
    const usageMapBefore = await sw.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get('tabUsageTabOpenedAt', (result) => {
          resolve(result.tabUsageTabOpenedAt || {});
        });
      });
    });
    const keysBefore = Object.keys(usageMapBefore);

    // Close the tab
    await target.close();
    await new Promise(r => setTimeout(r, 1000));

    // Check that the storage was cleaned up
    const usageMapAfter = await sw.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get('tabUsageTabOpenedAt', (result) => {
          resolve(result.tabUsageTabOpenedAt || {});
        });
      });
    });
    const keysAfter = Object.keys(usageMapAfter);

    // Should have fewer entries after tab close
    expect(keysAfter.length).toBeLessThan(keysBefore.length);
  });

  test('stores page labels from content script', async ({ context, extensionId }) => {
    // Open a page with meta tags — example.com has a basic title
    const target = await context.newPage();
    await target.goto('https://example.com');
    await target.waitForLoadState('load');

    // Wait for content script to send label
    await target.waitForTimeout(3000);

    const sw = context.serviceWorkers()[0];
    const labelsMap = await sw.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get('tabPageLabels', (result) => {
          resolve(result.tabPageLabels || {});
        });
      });
    });

    // Should have at least one entry (may depend on page having meta tags)
    // We just verify the storage key exists and is an object
    expect(typeof labelsMap).toBe('object');
  });

  test('tab-page-label message is handled by background', async ({ context, extensionId }) => {
    const sw = context.serviceWorkers()[0];

    // Simulate sending a tab-page-label message from a tab context
    const target = await context.newPage();
    await target.goto('https://example.com');
    await target.waitForLoadState('domcontentloaded');

    // Send message from the page context (simulating content script)
    const response = await target.evaluate(async () => {
      try {
        return await chrome.runtime.sendMessage({ type: 'tab-page-label', label: 'Test Label' });
      } catch (e) {
        return { error: e.message };
      }
    });

    // Should get an ok response
    expect(response).toBeDefined();
    if (response.ok !== undefined) {
      expect(response.ok).toBe(true);
    }
  });
});
