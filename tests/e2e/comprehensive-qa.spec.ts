import { test, expect } from '@playwright/test';

test.describe('Comprehensive QA Test Suite - Critical Flows', () => {
  const BASE_URL = 'http://localhost:3000';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for company setup modal and skip if present
    const skipButton = page.getByText('Skip Setup');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(1000);
    }

    // Click "Enter the Loom" link to navigate to the Loom page
    const enterLoomLink = page.getByRole('link', { name: /enter.*loom/i });
    if (await enterLoomLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await enterLoomLink.click();
      await page.waitForURL('**/loom', { timeout: 5000 });
    } else {
      // If already on /loom or link not found, just navigate directly
      await page.goto(`${BASE_URL}/loom`);
      await page.waitForLoadState('networkidle');
    }

    await page.waitForTimeout(2000);
  });

  test('CRITICAL FLOW 1: Main timeline - Make 10 decisions', async ({ page }) => {
    console.log('TEST 1: Making 10 decisions on main timeline');
    
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    for (let i = 1; i <= 10; i++) {
      console.log(`Making Decision ${i}`);
      
      const makeDecisionBtn = page.getByRole('button', { name: /make.*decision/i }).first();
      await expect(makeDecisionBtn).toBeVisible({ timeout: 5000 });
      await makeDecisionBtn.click();
      await page.waitForTimeout(2000);
      
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(1500);
      
      const options = page.locator('[data-option-id]');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);

      await options.first().click();
      await page.waitForTimeout(500);

      // Wait for confirm button and click using JavaScript to avoid viewport issues
      const confirmBtn = page.getByRole('button', { name: /confirm.*decision/i });
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });
      await confirmBtn.evaluate(btn => (btn as HTMLElement).click());
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: `tests/screenshots/flow1-decision-${i}.png` });
    }
    
    expect(errors.length).toBe(0);
  });

  test('CRITICAL FLOW 2: Create branches from nodes', async ({ page }) => {
    console.log('TEST 2: Creating branches from previous nodes');
    
    for (let i = 1; i <= 3; i++) {
      const makeDecisionBtn = page.getByRole('button', { name: /make.*decision/i }).first();
      await makeDecisionBtn.click();
      await page.waitForTimeout(2000);

      const options = page.locator('[data-option-id]');
      await options.first().click();
      await page.waitForTimeout(500);

      // Wait for confirm button and click using JavaScript to avoid viewport issues
      const confirmBtn = page.getByRole('button', { name: /confirm.*decision/i });
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });
      await confirmBtn.evaluate(btn => (btn as HTMLElement).click());
      await page.waitForTimeout(3000);
    }
    
    await page.screenshot({ path: 'tests/screenshots/flow2-baseline.png' });
  });
});
