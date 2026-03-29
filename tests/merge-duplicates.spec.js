const { expect } = require('@playwright/test');
const test = require('./fixtures');

test.describe('Merge Duplicate Sites', () => {
  test('merge button exists and has tooltip', async ({ sidePanelPage }) => {
    const mergeBtn = sidePanelPage.locator('#merge-same-sites');
    await expect(mergeBtn).toBeVisible();
    await expect(mergeBtn).toHaveAttribute('title', /.+/);
  });

  test('merge with no duplicates shows info dialog', async ({ context, extensionId }) => {
    // Open only unique domains (no duplicates)
    const tab1 = await context.newPage();
    await tab1.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    await panel.locator('#merge-same-sites').click();

    // Should show "no duplicates" dialog
    const dialog = panel.locator('#confirm-dialog');
    await expect(dialog).not.toHaveClass(/hidden/);
  });

  test('merge with duplicates shows confirmation and closes extras', async ({ context, extensionId }) => {
    // Open two tabs on the same domain to create duplicates
    const tab1 = await context.newPage();
    await tab1.goto('https://example.com/page1');
    const tab2 = await context.newPage();
    await tab2.goto('https://example.com/page2');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Find the example.com group and check it has 2 tabs
    const group = panel.locator('.domain-group', { has: panel.locator('.domain-name', { hasText: 'example.com' }) });
    if (!(await group.evaluate(el => el.classList.contains('expanded')))) {
      await group.locator('.domain-header').click();
    }
    const tabCountBefore = await group.locator('.tab-entry').count();
    expect(tabCountBefore).toBe(2);

    // Click merge
    await panel.locator('#merge-same-sites').click();

    // Confirmation dialog should appear
    const dialog = panel.locator('#confirm-dialog');
    await expect(dialog).not.toHaveClass(/hidden/);

    // Confirm
    await panel.locator('#confirm-ok').click();

    // Wait for duplicate to be removed — only one tab should remain
    await expect(group.locator('.tab-entry')).toHaveCount(1, { timeout: 5000 });
  });

  test('merge cancel keeps all tabs', async ({ context, extensionId }) => {
    const tab1 = await context.newPage();
    await tab1.goto('https://example.com/page1');
    const tab2 = await context.newPage();
    await tab2.goto('https://example.com/page2');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    await panel.locator('#merge-same-sites').click();
    await expect(panel.locator('#confirm-dialog')).not.toHaveClass(/hidden/);

    // Cancel
    await panel.locator('#confirm-cancel').click();
    await expect(panel.locator('#confirm-dialog')).toHaveClass(/hidden/);

    // Both tabs should still exist
    const group = panel.locator('.domain-group', { has: panel.locator('.domain-name', { hasText: 'example.com' }) });
    if (!(await group.evaluate(el => el.classList.contains('expanded')))) {
      await group.locator('.domain-header').click();
    }
    await expect(group.locator('.tab-entry')).toHaveCount(2);
  });
});
