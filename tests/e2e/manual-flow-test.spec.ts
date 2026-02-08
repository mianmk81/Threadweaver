import { test, expect } from '@playwright/test';

test('Manual flow test - Verify fixes', async ({ page }) => {
  const BASE_URL = 'http://localhost:3000';

  // Clear storage and start fresh
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Skip company setup if present
  const skipButton = page.getByText('Skip Setup');
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
    await page.waitForTimeout(1000);
  }

  // Navigate to Loom
  const enterLoomLink = page.getByRole('link', { name: /enter.*loom/i });
  await expect(enterLoomLink).toBeVisible();
  await enterLoomLink.click();
  await page.waitForURL('**/loom');
  await page.waitForTimeout(2000);

  // Take screenshot of Loom page
  await page.screenshot({ path: 'test-results/manual-test-loom-page.png' });

  // Look for any button or link that might trigger a decision
  console.log('Looking for decision trigger buttons...');

  // Check for various possible selectors
  const possibleSelectors = [
    'button:has-text("Make")',
    'button:has-text("Decision")',
    'button:has-text("Weave")',
    'button:has-text("Start")',
    '[data-testid*="decision"]',
    '[aria-label*="decision"]'
  ];

  for (const selector of possibleSelectors) {
    const elements = await page.locator(selector).all();
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements matching: ${selector}`);
      for (let i = 0; i < Math.min(3, elements.length); i++) {
        const text = await elements[i].textContent().catch(() => 'N/A');
        const visible = await elements[i].isVisible().catch(() => false);
        console.log(`  [${i}] Text: "${text}", Visible: ${visible}`);
      }
    }
  }

  // Also check the page HTML structure
  console.log('\nPage title:', await page.title());
  console.log('Current URL:', page.url());

  // Check if we're actually on the Loom page
  const isOnLoom = page.url().includes('/loom');
  expect(isOnLoom).toBe(true);

  console.log('\nTest completed - check screenshots and console output');
});
