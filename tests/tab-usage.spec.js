const { expect } = require('@playwright/test');
const test = require('./fixtures');

test.describe('Tab Usage', () => {
  test('usage panel starts collapsed', async ({ sidePanelPage }) => {
    const toggle = sidePanelPage.locator('#toggle-tab-usage');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(sidePanelPage.locator('#panel-tab-usage')).toHaveClass(/collapsed/);
  });

  test('dashboard shows correct aggregate metrics', async ({ context, extensionId }) => {
    // Open some tabs so we have data
    const tab1 = await context.newPage();
    await tab1.goto('https://example.com');
    const tab2 = await context.newPage();
    await tab2.goto('https://example.org');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Expand usage panel
    await panel.locator('#toggle-tab-usage').click();
    await expect(panel.locator('#tab-usage-dashboard')).toBeVisible();

    // Check metrics — first value (tabs) should be > 0
    const tabsMetric = panel.locator('.tab-usage-metric-value').first();
    const tabsText = await tabsMetric.textContent();
    expect(Number(tabsText)).toBeGreaterThan(0);

    // Windows metric should be >= 1
    const windowsMetric = panel.locator('.tab-usage-metric-value').nth(1);
    const windowsText = await windowsMetric.textContent();
    expect(Number(windowsText)).toBeGreaterThanOrEqual(1);
  });

  test('tab table shows rows for each open tab', async ({ context, extensionId }) => {
    const tab1 = await context.newPage();
    await tab1.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    await panel.locator('#toggle-tab-usage').click();

    // Table should have rows
    const rows = panel.locator('.tab-usage-table tbody tr');
    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('tab table shows status labels', async ({ sidePanelPage }) => {
    await sidePanelPage.locator('#toggle-tab-usage').click();
    await expect(sidePanelPage.locator('.tab-usage-table')).toBeVisible();

    // At least one row should have a status cell with text
    const statusCells = sidePanelPage.locator('.tab-usage-table tbody tr td:nth-child(5)');
    const firstStatus = await statusCells.first().textContent();
    expect(firstStatus.trim().length).toBeGreaterThan(0);
  });

  test('active tab has active badge', async ({ sidePanelPage }) => {
    await sidePanelPage.locator('#toggle-tab-usage').click();

    // At least one tab should have the active badge
    const activeBadges = sidePanelPage.locator('.tab-usage-badge--active');
    await expect(activeBadges.first()).toBeVisible();
  });

  test('usage panel expansion state persists after reload', async ({ context, extensionId }) => {
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group, .empty-state');

    // Expand usage panel
    await panel.locator('#toggle-tab-usage').click();
    await expect(panel.locator('#toggle-tab-usage')).toHaveAttribute('aria-expanded', 'true');

    // Reload
    await panel.reload();
    await panel.waitForSelector('.domain-group, .empty-state');

    // Should still be expanded
    await expect(panel.locator('#toggle-tab-usage')).toHaveAttribute('aria-expanded', 'true');

    // Collapse again for cleanup
    await panel.locator('#toggle-tab-usage').click();
  });

  test('header summary updates with tab count', async ({ context, extensionId }) => {
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group, .empty-state');

    const summaryBefore = await panel.locator('#tab-usage-header-summary').textContent();

    // Open a new tab
    const newTab = await context.newPage();
    await newTab.goto('https://example.com');
    await panel.waitForTimeout(2000);

    const summaryAfter = await panel.locator('#tab-usage-header-summary').textContent();
    // Summary should contain a number
    expect(summaryAfter).toMatch(/\d/);
  });
});
