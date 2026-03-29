const { expect } = require('@playwright/test');
const test = require('./fixtures');

test.describe('Tab Sorting', () => {
  test('sort dropdown exists with default timeDesc', async ({ sidePanelPage }) => {
    const sortSelect = sidePanelPage.locator('#tab-sort-select');
    await expect(sortSelect).toBeVisible();
    await expect(sortSelect).toHaveValue('timeDesc');
  });

  test('changing sort to titleAsc reorders domains alphabetically', async ({ context, extensionId }) => {
    // Open tabs on two different domains
    const tab1 = await context.newPage();
    await tab1.goto('https://example.com');
    const tab2 = await context.newPage();
    await tab2.goto('https://example.org');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Switch to titleAsc
    await panel.selectOption('#tab-sort-select', 'titleAsc');
    await panel.waitForTimeout(500);

    // Collect domain names in order
    const domainNames = await panel.locator('.domain-name').allTextContents();
    const sorted = [...domainNames].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    expect(domainNames).toEqual(sorted);
  });

  test('sort setting persists after reload', async ({ context, extensionId }) => {
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group, .empty-state');

    // Change sort to titleAsc
    await panel.selectOption('#tab-sort-select', 'titleAsc');
    await panel.waitForTimeout(300);

    // Reload
    await panel.reload();
    await panel.waitForSelector('.domain-group, .empty-state');

    // Should still be titleAsc
    await expect(panel.locator('#tab-sort-select')).toHaveValue('titleAsc');

    // Reset to default
    await panel.selectOption('#tab-sort-select', 'timeDesc');
  });

  test('all four sort modes are available', async ({ sidePanelPage }) => {
    const options = await sidePanelPage.locator('#tab-sort-select option').evaluateAll(
      els => els.map(el => el.value)
    );
    expect(options).toContain('titleAsc');
    expect(options).toContain('titleDesc');
    expect(options).toContain('timeAsc');
    expect(options).toContain('timeDesc');
  });
});
