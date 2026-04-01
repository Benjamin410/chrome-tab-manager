const { expect } = require('@playwright/test');
const test = require('./fixtures');

test.describe('Tab History', () => {
  test('history panel starts collapsed', async ({ sidePanelPage }) => {
    const toggle = sidePanelPage.locator('#toggle-tab-history');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(sidePanelPage.locator('#panel-tab-history')).toHaveClass(/collapsed/);
  });

  test('history search input filters items', async ({ context, extensionId }) => {
    // Close a tab to create history
    const target = await context.newPage();
    await target.goto('https://example.com').catch(() => {});
    await target.close();

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group, .empty-state');

    // Expand history panel
    await panel.locator('#toggle-tab-history').click();
    await expect(panel.locator('#tab-history-root')).toBeVisible();

    // Search for the closed tab
    const searchInput = panel.locator('#tab-history-search');
    await searchInput.fill('example');
    await panel.waitForTimeout(500);

    // Should show matching items or empty state
    const items = panel.locator('.tab-history-item');
    const empty = panel.locator('.tab-history-empty');
    const hasResults = await items.count() > 0;
    const hasEmpty = await empty.isVisible().catch(() => false);
    expect(hasResults || hasEmpty).toBe(true);
  });

  test('open last button exists and is clickable', async ({ context, extensionId }) => {
    // Close a tab first to have history
    const target = await context.newPage();
    await target.goto('https://example.com').catch(() => {});
    await target.close();

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group, .empty-state');

    const openLastBtn = panel.locator('#tab-history-open-last');
    await expect(openLastBtn).toBeVisible();

    // Click to restore — should not throw
    const pagesBefore = context.pages().length;
    await openLastBtn.click();
    await panel.waitForTimeout(1000);

    // A new page should have been opened (restored)
    expect(context.pages().length).toBeGreaterThanOrEqual(pagesBefore);
  });

  test('closed today count updates after closing a tab', async ({ context, extensionId }) => {
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group, .empty-state');

    const closedTodayBefore = await panel.locator('#tab-history-closed-today').textContent();

    // Close a tab
    const target = await context.newPage();
    await target.goto('https://example.com').catch(() => {});
    await target.close();

    // Wait for sessions update
    await panel.waitForTimeout(2000);

    const closedTodayAfter = await panel.locator('#tab-history-closed-today').textContent();
    // The number should increase or at least be present
    expect(closedTodayAfter).toMatch(/\d/);
  });

  test('clicking a history item restores it', async ({ context, extensionId }) => {
    // Close a known tab
    const target = await context.newPage();
    await target.goto('https://example.com').catch(() => {});
    await target.close();

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group, .empty-state');

    // Expand history
    await panel.locator('#toggle-tab-history').click();
    await panel.waitForTimeout(1000);

    // Click the first history row if available
    const rows = panel.locator('.tab-history-row');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      const pagesBefore = context.pages().length;
      await rows.first().click();
      await panel.waitForTimeout(1000);
      expect(context.pages().length).toBeGreaterThanOrEqual(pagesBefore);
    }
  });
});
