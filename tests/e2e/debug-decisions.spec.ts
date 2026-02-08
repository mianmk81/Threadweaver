import { test, expect } from '@playwright/test';

test('Debug decision making in branches', async ({ page }) => {
  const consoleLogs: string[] = [];
  const errors: string[] = [];

  // Capture console logs
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    console.log(text);
  });

  // Capture errors
  page.on('pageerror', error => {
    const errorText = `PAGE ERROR: ${error.message}`;
    errors.push(errorText);
    console.error(errorText);
  });

  // Navigate to the app
  console.log('\n=== Navigating to app ===');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'tests/screenshots/01-landing.png', fullPage: true });

  // Click "Enter the Loom" or skip company setup
  console.log('\n=== Entering the Loom ===');
  const skipButton = page.getByText('Skip Setup');
  if (await skipButton.isVisible()) {
    await skipButton.click();
    await page.waitForTimeout(1000);
  } else {
    const enterButton = page.getByText('Enter the Loom');
    if (await enterButton.isVisible()) {
      await enterButton.click();
      await page.waitForTimeout(1000);
    }
  }

  await page.screenshot({ path: 'tests/screenshots/02-loom-page.png', fullPage: true });

  // Wait for the timeline to load
  await page.waitForTimeout(2000);

  // Try to make a decision
  console.log('\n=== Making first decision ===');
  const makeDecisionButton = page.getByRole('button', { name: /make decision|next decision/i }).first();
  if (await makeDecisionButton.isVisible()) {
    await makeDecisionButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/03-first-decision-modal.png', fullPage: true });

    // Select first option and confirm
    const firstOption = page.locator('[data-option]').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await page.waitForTimeout(500);
    }

    const confirmButton = page.getByRole('button', { name: /confirm|choose/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/04-after-first-decision.png', fullPage: true });
    }
  }

  // Try to make a second decision
  console.log('\n=== Making second decision ===');
  if (await makeDecisionButton.isVisible()) {
    await makeDecisionButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/05-second-decision-modal.png', fullPage: true });

    // Check if there's an error in the modal
    const errorText = await page.locator('text=/error|failed|no.*card/i').first().textContent().catch(() => null);
    if (errorText) {
      console.log('\n!!! ERROR IN MODAL:', errorText);
    }

    const firstOption = page.locator('[data-option]').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await page.waitForTimeout(500);
    }

    const confirmButton = page.getByRole('button', { name: /confirm|choose/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/06-after-second-decision.png', fullPage: true });
    }
  }

  // Try to create a branch
  console.log('\n=== Creating a branch ===');
  const reweaveButton = page.getByRole('button', { name: /reweave/i });
  if (await reweaveButton.isVisible()) {
    // Click on a previous node first
    const nodes = page.locator('circle[r="12"], circle[r="16"]');
    const nodeCount = await nodes.count();
    if (nodeCount > 1) {
      await nodes.nth(1).click(); // Click second node
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/screenshots/07-node-details.png', fullPage: true });

      // Click reweave from here
      const reweaveFromHere = page.getByText(/reweave from here/i);
      if (await reweaveFromHere.isVisible()) {
        await reweaveFromHere.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'tests/screenshots/08-branch-decision-modal.png', fullPage: true });

        // Select different option and confirm
        const options = page.locator('[data-option]');
        const optionCount = await options.count();
        if (optionCount > 1) {
          await options.nth(1).click(); // Select second option
          await page.waitForTimeout(500);
        }

        const confirmButton = page.getByRole('button', { name: /confirm|choose/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'tests/screenshots/09-after-branch-decision.png', fullPage: true });
        }
      }
    }
  }

  // Try autopilot on branch
  console.log('\n=== Testing autopilot on branch ===');
  const autopilotButton = page.getByRole('button', { name: /autopilot/i });
  if (await autopilotButton.isVisible() && !await autopilotButton.isDisabled()) {
    await autopilotButton.click();
    await page.waitForTimeout(5000); // Wait for autopilot to complete
    await page.screenshot({ path: 'tests/screenshots/10-after-autopilot.png', fullPage: true });
  }

  // Print summary
  console.log('\n=== CONSOLE LOGS SUMMARY ===');
  console.log('Total logs:', consoleLogs.length);

  const decisionLogs = consoleLogs.filter(log => log.includes('DecisionModal'));
  console.log('\nDecisionModal logs:', decisionLogs.length);
  decisionLogs.forEach(log => console.log(log));

  const errorLogs = consoleLogs.filter(log => log.includes('ERROR') || log.includes('error'));
  console.log('\nError logs:', errorLogs.length);
  errorLogs.forEach(log => console.log(log));

  console.log('\n=== PAGE ERRORS ===');
  console.log('Total page errors:', errors.length);
  errors.forEach(err => console.log(err));

  console.log('\n=== Screenshots saved in tests/screenshots/ ===');
});
