const { expect } = require('@playwright/test');
const test = require('./fixtures');

test.describe('Window Management', () => {
  test('window filter dropdown is hidden with only one window', async ({ sidePanelPage }) => {
    // With a single browser window, only the window selector is hidden (toggles stay visible).
    const windowFilter = sidePanelPage.locator('#window-filter');
    await expect(windowFilter).toBeHidden();
  });

  test('window grouping toggle exists and has correct initial state', async ({ sidePanelPage }) => {
    const toggle = sidePanelPage.locator('#window-toggle');
    await expect(toggle).toBeAttached();

    // Initially not active
    const isActive = await toggle.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(false);
  });

  test('window grouping toggle can be clicked programmatically', async ({ sidePanelPage }) => {
    const toggle = sidePanelPage.locator('#window-toggle');

    // Click to enable
    await toggle.click();
    await expect(toggle).toHaveClass(/active/);

    // Click to disable
    await toggle.click();
    await expect(toggle).not.toHaveClass(/active/);
  });

  test('window grouping setting persists after reload', async ({ context, extensionId }) => {
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group, .empty-state');

    await panel.locator('#window-toggle').click();
    await expect(panel.locator('#window-toggle')).toHaveClass(/active/);

    // Reload
    await panel.reload();
    await panel.waitForSelector('.domain-group, .empty-state');

    // Should still be active (even though hidden again)
    const isActive = await panel.locator('#window-toggle').evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);

    await panel.locator('#window-toggle').click();
  });

  test('without window grouping, no window headers are shown', async ({ sidePanelPage }) => {
    // Ensure grouping is off
    const isActive = await sidePanelPage.locator('#window-toggle').evaluate(el => el.classList.contains('active'));
    if (isActive) {
      await sidePanelPage.locator('#window-toggle').click();
    }

    // Domain groups should exist, but no window headers
    const domainGroups = sidePanelPage.locator('.domain-group');
    await expect(domainGroups.first()).toBeVisible();

    const windowHeaders = sidePanelPage.locator('.window-header');
    await expect(windowHeaders).toHaveCount(0);
  });
});
