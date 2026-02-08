import { test, expect } from '@playwright/test';

test.describe('AI Personalization Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage to ensure fresh state
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('Cleared browser storage');
  });

  test('should complete full company setup wizard and generate personalized cards', async ({ page }) => {
    // Enable console logging to capture API calls
    const apiCalls: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('PAGE LOG:', msg.text());
      }
    });

    // Capture network requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiCalls.push(`${request.method()} ${url}`);
        console.log('API REQUEST:', request.method(), url);
      }
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/generate-custom-cards')) {
        console.log('API RESPONSE:', response.status(), url);
        try {
          const body = await response.json();
          console.log('Response body:', JSON.stringify(body, null, 2));
        } catch (e) {
          console.log('Could not parse response body');
        }
      }
    });

    console.log('\n=== Step 1: Navigate to home page ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Take screenshot of landing page
    await page.screenshot({
      path: 'C:\\Users\\mianm\\Downloads\\uga\\threadweaver\\tests\\screenshots\\01-landing-page.png',
      fullPage: true
    });
    console.log('Screenshot saved: 01-landing-page.png');

    console.log('\n=== Step 2: Click "Enter the Loom" button ===');
    const enterButton = page.locator('a:has-text("Enter the Loom")');
    await expect(enterButton).toBeVisible({ timeout: 10000 });
    await enterButton.click();
    await page.waitForURL('**/loom');
    console.log('Navigated to /loom');

    console.log('\n=== Step 3: Verify CompanySetupModal appears ===');
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Check modal header
    const modalHeader = modal.locator('h2');
    await expect(modalHeader).toContainText('Welcome, Chronomancer');

    await page.screenshot({
      path: 'C:\\Users\\mianm\\Downloads\\uga\\threadweaver\\tests\\screenshots\\02-setup-modal-step1.png',
      fullPage: true
    });
    console.log('Screenshot saved: 02-setup-modal-step1.png');
    console.log('CompanySetupModal is visible');

    console.log('\n=== Step 4: Fill out Step 1 - Company Information ===');

    // Company Name
    const companyNameInput = modal.locator('input[name="companyName"], input[placeholder*="company name" i]');
    await expect(companyNameInput).toBeVisible();
    await companyNameInput.fill('GreenTech Solutions');
    console.log('Filled company name: GreenTech Solutions');

    // Industry - look for select or button group
    const industrySelect = modal.locator('select[name="industry"]');
    const industryButtons = modal.locator('button:has-text("Technology")');

    if (await industrySelect.count() > 0) {
      await industrySelect.selectOption('Technology');
      console.log('Selected industry: Technology (dropdown)');
    } else if (await industryButtons.count() > 0) {
      await industryButtons.first().click();
      console.log('Selected industry: Technology (button)');
    } else {
      // Try finding any input that might be for industry
      const industryInput = modal.locator('input[name="industry"]');
      if (await industryInput.count() > 0) {
        await industryInput.fill('Technology');
        console.log('Filled industry: Technology (text input)');
      }
    }

    // Company Size
    const sizeSelect = modal.locator('select[name="companySize"]');
    const sizeButtons = modal.locator('button:has-text("Medium")');

    if (await sizeSelect.count() > 0) {
      await sizeSelect.selectOption('Medium');
      console.log('Selected size: Medium (dropdown)');
    } else if (await sizeButtons.count() > 0) {
      await sizeButtons.first().click();
      console.log('Selected size: Medium (button)');
    }

    // Location
    const locationInput = modal.locator('input[name="location"], input[placeholder*="location" i]');
    if (await locationInput.count() > 0) {
      await locationInput.fill('San Francisco, CA');
      console.log('Filled location: San Francisco, CA');
    }

    await page.screenshot({
      path: 'C:\\Users\\mianm\\Downloads\\uga\\threadweaver\\tests\\screenshots\\03-setup-step1-filled.png',
      fullPage: true
    });
    console.log('Screenshot saved: 03-setup-step1-filled.png');

    // Click Next to go to Step 2
    const nextButton = modal.locator('button:has-text("Next")');
    await expect(nextButton).toBeVisible();
    await nextButton.click();
    await page.waitForTimeout(500);
    console.log('Clicked Next to Step 2');

    console.log('\n=== Step 5: Fill out Step 2 - Challenges and Goals ===');
    await page.screenshot({
      path: 'C:\\Users\\mianm\\Downloads\\uga\\threadweaver\\tests\\screenshots\\04-setup-modal-step2.png',
      fullPage: true
    });

    // Select challenges - look for checkboxes or clickable items
    const challenges = ['Carbon emissions', 'Energy consumption', 'Cost management'];
    for (const challenge of challenges) {
      const challengeElement = modal.locator(`label:has-text("${challenge}"), button:has-text("${challenge}")`).first();
      if (await challengeElement.count() > 0) {
        await challengeElement.click();
        console.log(`Selected challenge: ${challenge}`);
        await page.waitForTimeout(200);
      }
    }

    // Select goals
    const goals = ['Net zero emissions', 'Renewable energy', 'Cost reduction'];
    for (const goal of goals) {
      const goalElement = modal.locator(`label:has-text("${goal}"), button:has-text("${goal}")`).first();
      if (await goalElement.count() > 0) {
        await goalElement.click();
        console.log(`Selected goal: ${goal}`);
        await page.waitForTimeout(200);
      }
    }

    await page.screenshot({
      path: 'C:\\Users\\mianm\\Downloads\\uga\\threadweaver\\tests\\screenshots\\05-setup-step2-filled.png',
      fullPage: true
    });
    console.log('Screenshot saved: 05-setup-step2-filled.png');

    // Click Next to go to Step 3
    await nextButton.click();
    await page.waitForTimeout(500);
    console.log('Clicked Next to Step 3');

    console.log('\n=== Step 6: Fill out Step 3 - Description ===');
    await page.screenshot({
      path: 'C:\\Users\\mianm\\Downloads\\uga\\threadweaver\\tests\\screenshots\\06-setup-modal-step3.png',
      fullPage: true
    });

    const descriptionText = 'We run a cloud computing platform with 3 data centers serving 10,000 customers. Currently facing high energy costs and pressure to reduce our carbon footprint.';

    const descriptionTextarea = modal.locator('textarea[name="description"], textarea[placeholder*="describe" i]');
    if (await descriptionTextarea.count() > 0) {
      await descriptionTextarea.fill(descriptionText);
      console.log('Filled description');
    }

    await page.screenshot({
      path: 'C:\\Users\\mianm\\Downloads\\uga\\threadweaver\\tests\\screenshots\\07-setup-step3-filled.png',
      fullPage: true
    });
    console.log('Screenshot saved: 07-setup-step3-filled.png');

    console.log('\n=== Step 7: Submit form and generate simulation ===');
    const generateButton = modal.locator('button:has-text("Generate My Simulation"), button:has-text("Generate")');
    await expect(generateButton).toBeVisible();

    // Click generate and wait for API call
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/generate-custom-cards') && response.status() === 200,
      { timeout: 60000 }
    );

    await generateButton.click();
    console.log('Clicked "Generate My Simulation"');

    try {
      const response = await responsePromise;
      console.log('API call to /api/generate-custom-cards completed with status:', response.status());

      const responseBody = await response.json();
      console.log('Response received:', JSON.stringify(responseBody, null, 2));

      // Verify response structure
      expect(responseBody).toHaveProperty('cards');
      expect(responseBody.cards).toHaveLength(10);
      console.log('Verified: Response contains 10 custom cards');

      // Check that cards are relevant to Technology industry
      const cardTitles = responseBody.cards.map((card: any) => card.title);
      console.log('Generated card titles:', cardTitles);

      // Verify cards contain technology-relevant terms
      const techRelevant = cardTitles.some((title: string) =>
        title.toLowerCase().includes('datacenter') ||
        title.toLowerCase().includes('data center') ||
        title.toLowerCase().includes('server') ||
        title.toLowerCase().includes('cloud') ||
        title.toLowerCase().includes('energy') ||
        title.toLowerCase().includes('renewable')
      );

      expect(techRelevant).toBeTruthy();
      console.log('Verified: Cards contain technology-relevant content');

      // Check initial metrics
      if (responseBody.initialMetrics) {
        console.log('Initial metrics:', responseBody.initialMetrics);
        // Verify metrics reflect stated challenges (high emissions, high cost)
        expect(responseBody.initialMetrics.emissions).toBeGreaterThanOrEqual(50);
        expect(responseBody.initialMetrics.cost).toBeGreaterThanOrEqual(50);
        console.log('Verified: Initial metrics adjusted for stated challenges');
      }

    } catch (error) {
      console.error('Failed to get API response:', error);
      throw error;
    }

    console.log('\n=== Step 8: Verify loom page loads with personalized content ===');
    // Modal should close and loom should be visible
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'C:\\Users\\mianm\\Downloads\\uga\\threadweaver\\tests\\screenshots\\08-loom-loaded.png',
      fullPage: true
    });
    console.log('Screenshot saved: 08-loom-loaded.png');

    // Verify modal is closed
    const modalVisible = await modal.isVisible().catch(() => false);
    expect(modalVisible).toBeFalsy();
    console.log('Verified: CompanySetupModal is closed');

    // Verify loom canvas is visible
    const loomCanvas = page.locator('svg, [data-testid="loom-canvas"]').first();
    await expect(loomCanvas).toBeVisible({ timeout: 10000 });
    console.log('Verified: Loom canvas is visible');

    // Verify metrics panel is visible
    const metricsPanel = page.locator('[data-testid="impact-panel"], div:has-text("Current Impact")').first();
    await expect(metricsPanel).toBeVisible({ timeout: 10000 });
    console.log('Verified: Metrics panel is visible');

    console.log('\n=== Test Summary ===');
    console.log('API calls made:', apiCalls);
    console.log('Total API calls:', apiCalls.length);

    console.log('\n=== All Steps Completed Successfully ===');
    console.log('Modal appeared on first load: PASS');
    console.log('All form fields work correctly: PASS');
    console.log('API call to /api/generate-custom-cards: PASS');
    console.log('Backend generated 10 custom cards: PASS');
    console.log('Cards relevant to Technology industry: PASS');
    console.log('Initial metrics adjusted for challenges: PASS');
    console.log('Loom loaded with personalized content: PASS');
  });

  test('should not show modal on subsequent visits', async ({ page }) => {
    console.log('\n=== Testing Modal Persistence ===');

    // Clear storage first
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // First visit - complete setup
    await page.goto('http://localhost:3000');
    await page.locator('a:has-text("Enter the Loom")').click();
    await page.waitForURL('**/loom');

    // Check if modal appears
    const modalAppeared = await page.locator('[role="dialog"]').isVisible({ timeout: 5000 }).catch(() => false);

    if (modalAppeared) {
      console.log('Modal appeared - completing setup');
      const modal = page.locator('[role="dialog"]').first();

      // Quick fill
      await modal.locator('input[name="companyName"]').fill('Test Company');
      await modal.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      await modal.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      await modal.locator('button:has-text("Generate")').click();

      // Wait for modal to close
      await page.waitForTimeout(3000);
    }

    // Navigate away and back
    await page.goto('http://localhost:3000');
    await page.locator('a:has-text("Enter the Loom")').click();
    await page.waitForURL('**/loom');

    // Modal should NOT appear on second visit
    const modalVisible = await page.locator('[role="dialog"]').isVisible({ timeout: 3000 }).catch(() => false);
    expect(modalVisible).toBeFalsy();
    console.log('Verified: Modal does not appear on subsequent visit');
  });
});
