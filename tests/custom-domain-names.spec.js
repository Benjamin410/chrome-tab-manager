const { expect } = require('@playwright/test');
const test = require('./fixtures');

test.describe('Custom Domain Names', () => {
  test('rename button appears on domain header hover', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    await tab.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    const header = panel.locator('.domain-header', { hasText: 'example.com' });
    const renameBtn = header.locator('.domain-rename-btn');

    // Button exists but hidden
    await expect(renameBtn).toBeAttached();
    await expect(renameBtn).toHaveCSS('opacity', '0');

    // Add .hover class programmatically — real :hover is unreliable because
    // background tabs-changed events rebuild the DOM mid-transition.
    // The CSS supports .domain-header.hover as an equivalent selector.
    await header.evaluate(el => el.classList.add('hover'));
    await expect(renameBtn).toHaveCSS('opacity', '1');
  });

  test('rename button enters inline edit mode', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    await tab.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    const header = panel.locator('.domain-header', { hasText: 'example.com' });
    await header.evaluate(el => el.classList.add('hover'));
    await header.locator('.domain-rename-btn').click();

    const input = panel.locator('.domain-rename-input');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('renaming persists and displays custom name', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    await tab.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    const header = panel.locator('.domain-header', { hasText: 'example.com' });
    await header.evaluate(el => el.classList.add('hover'));
    await header.locator('.domain-rename-btn').click();

    const input = panel.locator('.domain-rename-input');
    await input.fill('My Example');
    await input.press('Enter');

    // Wait for re-render
    await panel.waitForSelector('.domain-name.has-custom-name');
    const nameSpan = panel.locator('.domain-name.has-custom-name[title="example.com"]');
    await expect(nameSpan).toHaveText('My Example');

    // Persists after reload
    await panel.reload();
    await panel.waitForSelector('.domain-group');
    const reloadedName = panel.locator('.domain-name.has-custom-name[title="example.com"]');
    await expect(reloadedName).toHaveText('My Example');
  });

  test('custom domain name is searchable', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    await tab.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Rename domain
    const header = panel.locator('.domain-header', { hasText: 'example.com' });
    await header.evaluate(el => el.classList.add('hover'));
    await header.locator('.domain-rename-btn').click();
    const input = panel.locator('.domain-rename-input');
    await input.fill('MyCustomSite');
    await input.press('Enter');
    await panel.waitForSelector('.domain-name.has-custom-name');

    // Search for custom name
    await panel.fill('#search', 'MyCustomSite');
    await panel.waitForTimeout(300);

    const visibleGroups = panel.locator('.domain-group.has-match');
    await expect(visibleGroups).toHaveCount(1);
  });

  test('clearing custom name resets to original', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    await tab.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Rename domain
    const header = panel.locator('.domain-header', { hasText: 'example.com' });
    await header.evaluate(el => el.classList.add('hover'));
    await header.locator('.domain-rename-btn').click();
    const input = panel.locator('.domain-rename-input');
    await input.fill('Custom');
    await input.press('Enter');
    await panel.waitForSelector('.domain-name.has-custom-name');

    // Clear the name
    const header2 = panel.locator('.domain-header', { hasText: 'Custom' });
    await header2.evaluate(el => el.classList.add('hover'));
    await header2.locator('.domain-rename-btn').click();
    const input2 = panel.locator('.domain-rename-input');
    await input2.fill('');
    await input2.press('Enter');

    await panel.waitForTimeout(500);
    const nameSpan = panel.locator('.domain-name', { hasText: 'example.com' });
    await expect(nameSpan).not.toHaveClass(/has-custom-name/);
  });

  test('custom name used in Chrome tab group title', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    await tab.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Rename domain first
    const header = panel.locator('.domain-header', { hasText: 'example.com' });
    await header.evaluate(el => el.classList.add('hover'));
    await header.locator('.domain-rename-btn').click();
    const input = panel.locator('.domain-rename-input');
    await input.fill('MyGroup');
    await input.press('Enter');
    await panel.waitForSelector('.domain-name.has-custom-name');

    // Now group tabs
    const renamedHeader = panel.locator('.domain-header', { hasText: 'MyGroup' });
    await renamedHeader.evaluate(el => el.classList.add('hover'));
    const groupBtn = renamedHeader.locator('.domain-group-btn');
    await groupBtn.click();
    await panel.waitForTimeout(1000);

    // Verify tab group was created with custom name
    const groups = await panel.evaluate(async () => {
      const gs = await chrome.tabGroups.query({});
      return gs.map(g => g.title);
    });
    expect(groups).toContain('MyGroup');
  });

  test('escape key cancels rename', async ({ context, extensionId }) => {
    const tab = await context.newPage();
    await tab.goto('https://example.com');

    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${test.SIDE_PANEL_HTML}`);
    await panel.waitForSelector('.domain-group');

    // Start rename
    const header = panel.locator('.domain-header', { hasText: 'example.com' });
    await header.evaluate(el => el.classList.add('hover'));
    await header.locator('.domain-rename-btn').click();
    const input = panel.locator('.domain-rename-input');
    await input.fill('ShouldNotSave');
    await input.press('Escape');

    // Should revert to original domain name
    await panel.waitForTimeout(500);
    const nameSpan = panel.locator('.domain-name', { hasText: 'example.com' });
    await expect(nameSpan).toBeVisible();
    await expect(nameSpan).not.toHaveClass(/has-custom-name/);
  });
});
