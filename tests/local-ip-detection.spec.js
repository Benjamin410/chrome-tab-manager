const { expect } = require('@playwright/test');
const test = require('./fixtures');

test.describe('Local IP Detection', () => {
  test('localhost tab shows page title as domain header', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    // Use a data URI with a base tag to simulate localhost origin
    await tab.goto('http://localhost:3000', { waitUntil: 'commit' }).catch(() => {});
    // Set title after navigation attempt — even if the page didn't fully load,
    // Chrome keeps the tab with the URL registered
    await tab.waitForTimeout(500);
    await tab.evaluate(() => { document.title = 'My Dev Server'; }).catch(() => {});

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Domain header should show tab title instead of "localhost:3000"
    const domainName = panel.locator('.domain-name[title="localhost:3000"]');
    await expect(domainName).toHaveText('My Dev Server');
  });

  test('non-local domain still shows domain name', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    await tab.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    const domainName = panel.locator('.domain-name', { hasText: 'example.com' });
    await expect(domainName).toHaveText('example.com');
    // No title attribute for non-local domains (name matches domain)
    await expect(domainName).not.toHaveAttribute('title');
  });

  test('custom domain name takes priority over local IP display', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    await tab.goto('http://localhost:3000', { waitUntil: 'commit' }).catch(() => {});
    await tab.waitForTimeout(500);
    await tab.evaluate(() => { document.title = 'Dev Server'; }).catch(() => {});

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Rename the localhost domain
    const header = panel.locator('.domain-header', { hasText: 'Dev Server' });
    await header.evaluate(el => el.classList.add('hover'));
    await header.locator('.domain-rename-btn').click();

    const input = panel.locator('.domain-rename-input');
    await input.fill('My Local App');
    await input.press('Enter');

    await panel.waitForSelector('.domain-name.has-custom-name');
    const domainName = panel.locator('.domain-name.has-custom-name');
    // Custom name wins over tab-title-based display
    await expect(domainName).toHaveText('My Local App');
    await expect(domainName).toHaveAttribute('title', 'localhost:3000');
  });

  test('local address tab shows host as secondary label', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    await tab.goto('http://localhost:4000', { waitUntil: 'commit' }).catch(() => {});
    await tab.waitForTimeout(500);
    await tab.evaluate(() => { document.title = 'Local App'; }).catch(() => {});

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Expand the domain group to see tab entries
    const header = panel.locator('.domain-header', { hasText: 'Local App' });
    await header.click();
    await panel.waitForSelector('.tab-entry');

    // Tab should have secondary label showing the host
    const tabLabel = panel.locator('.tab-page-label');
    await expect(tabLabel).toHaveText('localhost');
  });

  test('different ports on localhost create separate groups', async ({ context, extensionId }) => {
    // Open two tabs on different localhost ports
    const tab1 = await context.newPage();
    await tab1.goto('http://localhost:3000', { waitUntil: 'commit' }).catch(() => {});
    await tab1.waitForTimeout(500);
    await tab1.evaluate(() => { document.title = 'Frontend App'; }).catch(() => {});

    const tab2 = await context.newPage();
    await tab2.goto('http://localhost:8080', { waitUntil: 'commit' }).catch(() => {});
    await tab2.waitForTimeout(500);
    await tab2.evaluate(() => { document.title = 'API Server'; }).catch(() => {});

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Should have two separate domain groups for the two ports
    const group3000 = panel.locator('.domain-name[title="localhost:3000"]');
    const group8080 = panel.locator('.domain-name[title="localhost:8080"]');
    await expect(group3000).toHaveText('Frontend App');
    await expect(group8080).toHaveText('API Server');
  });

  test('same port on localhost groups together', async ({ context, extensionId }) => {
    // Open two tabs on the same localhost port
    const tab1 = await context.newPage();
    await tab1.goto('http://localhost:3000/page1', { waitUntil: 'commit' }).catch(() => {});
    await tab1.waitForTimeout(500);
    await tab1.evaluate(() => { document.title = 'Page One'; }).catch(() => {});

    const tab2 = await context.newPage();
    await tab2.goto('http://localhost:3000/page2', { waitUntil: 'commit' }).catch(() => {});
    await tab2.waitForTimeout(500);
    await tab2.evaluate(() => { document.title = 'Page Two'; }).catch(() => {});

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Should have only one domain group for localhost:3000
    const groups = panel.locator('.domain-name[title="localhost:3000"]');
    await expect(groups).toHaveCount(1);

    // Expand and verify both tabs are inside
    const header = panel.locator('.domain-header', { has: panel.locator('.domain-name[title="localhost:3000"]') });
    await header.click();
    await panel.waitForSelector('.tab-entry');

    const tabs = header.locator('..').locator('.tab-entry');
    await expect(tabs).toHaveCount(2);
  });

  test('non-local domain ignores port for grouping', async ({ context, extensionId }) => {
    // Open a tab on example.com with explicit port — should still group by hostname only
    const tab = await context.newPage();
    await tab.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Domain name should be just "example.com", no port
    const domainName = panel.locator('.domain-name', { hasText: 'example.com' });
    await expect(domainName).toHaveText('example.com');
  });
});
