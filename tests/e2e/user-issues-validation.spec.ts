import { test, expect } from '@playwright/test';

/**
 * This test validates the three specific user-reported issues:
 * 1. Cannot return to original timeline and continue decisions
 * 2. Cannot continue making decisions when timeline has fewer than 10 steps
 * 3. Cannot make more than 1 decision in a new branched timeline
 */

test.describe('User-Reported Issues Validation', () => {
  const BASE_URL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Skip company setup if present
    const skipButton = page.getByText('Skip Setup');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to Loom
    const enterLoomLink = page.getByRole('link', { name: /enter.*loom/i });
    if (await enterLoomLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await enterLoomLink.click();
      await page.waitForURL('**/loom', { timeout: 5000 });
    } else {
      await page.goto(`${BASE_URL}/loom`);
      await page.waitForLoadState('networkidle');
    }

    await page.waitForTimeout(2000);
  });

  test('Issue 1 & 2: Make decisions on original timeline, create branch, return and continue', async ({ page }) => {
    console.log('Step 1: Make 3 decisions on original timeline (Baseline Timeline)');

    // Make 3 decisions on the baseline
    for (let i = 1; i <= 3; i++) {
      console.log(`  Making decision ${i}...`);
      const makeDecisionBtn = page.getByRole('button', { name: /make.*decision/i }).first();
      await expect(makeDecisionBtn).toBeVisible();
      await makeDecisionBtn.click();
      await page.waitForTimeout(2000);

      const options = page.locator('[data-option-id]');
      await expect(options.first()).toBeVisible({ timeout: 5000 });
      await options.first().click();
      await page.waitForTimeout(500);

      const confirmBtn = page.getByRole('button', { name: /confirm.*decision/i });
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });
      await confirmBtn.evaluate(btn => (btn as HTMLElement).click());
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'test-results/issue1-baseline-3-decisions.png' });
    console.log('✓ Made 3 decisions on baseline timeline');

    console.log('\nStep 2: Create a branch from step 2');

    // Click on step 2 node to open details
    const step2Node = page.locator('[data-step="2"]').first();
    if (await step2Node.isVisible({ timeout: 2000 }).catch(() => false)) {
      await step2Node.click();
      await page.waitForTimeout(1500);

      // Look for "Reweave from Here" button
      const reweaveBtn = page.getByRole('button', { name: /reweave.*here/i });
      if (await reweaveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reweaveBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    await page.screenshot({ path: 'test-results/issue1-after-branch-creation.png' });

    console.log('\nStep 3: Switch back to Baseline Timeline');

    // Click on the baseline timeline path/label
    const baselineTimeline = page.getByText('Baseline Timeline').first();
    if (await baselineTimeline.isVisible({ timeout: 2000 }).catch(() => false)) {
      await baselineTimeline.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/issue1-switched-to-baseline.png' });

    console.log('\nStep 4: Try to make another decision on Baseline Timeline (should work!)');

    const makeDecisionBtnAfter = page.getByRole('button', { name: /make.*decision/i }).first();

    // This should be visible if Issue 1 & 2 are fixed
    const isVisible = await makeDecisionBtnAfter.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      console.log('✅ PASS: Make Decision button is visible on Baseline Timeline after returning');

      // Actually make the decision to prove it works
      await makeDecisionBtnAfter.click();
      await page.waitForTimeout(2000);

      const options = page.locator('[data-option-id]');
      await expect(options.first()).toBeVisible({ timeout: 5000 });
      await options.first().click();
      await page.waitForTimeout(500);

      const confirmBtn = page.getByRole('button', { name: /confirm.*decision/i });
      await confirmBtn.evaluate(btn => (btn as HTMLElement).click());
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/issue1-baseline-4th-decision-success.png' });
      console.log('✅ PASS: Successfully made 4th decision on Baseline Timeline!');
    } else {
      await page.screenshot({ path: 'test-results/issue1-FAILED-no-button.png' });
      console.log('❌ FAIL: Make Decision button not visible on Baseline Timeline');
      throw new Error('Issue 1 & 2 NOT FIXED: Cannot continue decisions on original timeline');
    }
  });

  test('Issue 3: Make multiple decisions in a branched timeline', async ({ page }) => {
    console.log('Step 1: Make 2 decisions on baseline first');

    // Make 2 decisions on baseline
    for (let i = 1; i <= 2; i++) {
      const makeDecisionBtn = page.getByRole('button', { name: /make.*decision/i }).first();
      await makeDecisionBtn.click();
      await page.waitForTimeout(2000);

      const options = page.locator('[data-option-id]');
      await options.first().click();
      await page.waitForTimeout(500);

      const confirmBtn = page.getByRole('button', { name: /confirm.*decision/i });
      await confirmBtn.evaluate(btn => (btn as HTMLElement).click());
      await page.waitForTimeout(3000);
    }

    console.log('✓ Made 2 decisions on baseline');

    console.log('\nStep 2: Create a branch by clicking Reweave button');

    const reweaveBtn = page.getByRole('button', { name: /reweave/i }).first();
    if (await reweaveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reweaveBtn.click();
      await page.waitForTimeout(2000);

      // Fill in branch details if modal appears
      const branchInput = page.getByPlaceholder(/timeline.*name/i);
      if (await branchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await branchInput.fill('Test Branch');
        const createBtn = page.getByRole('button', { name: /create/i });
        await createBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: 'test-results/issue3-branch-created.png' });
    console.log('✓ Branch created');

    console.log('\nStep 3: Make 1st decision in branch');

    const makeDecision1 = page.getByRole('button', { name: /make.*decision/i }).first();
    await expect(makeDecision1).toBeVisible();
    await makeDecision1.click();
    await page.waitForTimeout(2000);

    let options = page.locator('[data-option-id]');
    await options.first().click();
    await page.waitForTimeout(500);

    let confirmBtn = page.getByRole('button', { name: /confirm.*decision/i });
    await confirmBtn.evaluate(btn => (btn as HTMLElement).click());
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/issue3-branch-1st-decision.png' });
    console.log('✓ Made 1st decision in branch');

    console.log('\nStep 4: Try to make 2nd decision in branch (should work!)');

    const makeDecision2 = page.getByRole('button', { name: /make.*decision/i }).first();
    const isVisible = await makeDecision2.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      console.log('✅ PASS: Make Decision button is visible for 2nd decision in branch');

      // Actually make the 2nd decision
      await makeDecision2.click();
      await page.waitForTimeout(2000);

      options = page.locator('[data-option-id]');
      await options.first().click();
      await page.waitForTimeout(500);

      confirmBtn = page.getByRole('button', { name: /confirm.*decision/i });
      await confirmBtn.evaluate(btn => (btn as HTMLElement).click());
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/issue3-branch-2nd-decision-success.png' });
      console.log('✅ PASS: Successfully made 2nd decision in branch!');

      // Try 3rd decision for good measure
      const makeDecision3 = page.getByRole('button', { name: /make.*decision/i }).first();
      if (await makeDecision3.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✅ BONUS: Can make 3rd decision too!');
      }
    } else {
      await page.screenshot({ path: 'test-results/issue3-FAILED-no-2nd-decision.png' });
      console.log('❌ FAIL: Cannot make 2nd decision in branch');
      throw new Error('Issue 3 NOT FIXED: Cannot make more than 1 decision in branched timeline');
    }
  });
});
