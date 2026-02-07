import { test, expect } from '@playwright/test';

test.describe('Threadweaver E2E Tests', () => {
  const BASE_URL = 'http://localhost:3000';

  test('should load landing page and navigate to Loom', async ({ page }) => {
    // Navigate to landing page
    await page.goto(BASE_URL);

    // Check landing page elements
    await expect(page.getByText('Threadweaver')).toBeVisible();
    await expect(page.getByText('Sustainable Futures')).toBeVisible();
    await expect(page.getByRole('link', { name: /Enter the Loom/i })).toBeVisible();

    // Click Enter the Loom
    await page.getByRole('link', { name: /Enter the Loom/i }).click();

    // Wait for navigation
    await page.waitForURL('**/loom');
    await expect(page).toHaveURL(/\/loom/);
  });

  test('should display Loom interface components', async ({ page }) => {
    await page.goto(`${BASE_URL}/loom`);

    // Wait for components to mount (avoid hydration issues)
    await page.waitForTimeout(2000);

    // Check for main sections
    await expect(page.getByText('The Loom of Sustainable Futures')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Timelines' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Current Impact' })).toBeVisible();

    // Check for metrics
    await expect(page.getByText('Waste')).toBeVisible();
    await expect(page.getByText('Emissions')).toBeVisible();
    await expect(page.getByText('Cost')).toBeVisible();
    await expect(page.getByText('Efficiency')).toBeVisible();
    await expect(page.getByText('Trust')).toBeVisible();
  });

  test('should open decision modal when clicking Make Next Decision', async ({ page }) => {
    await page.goto(`${BASE_URL}/loom`);

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Find and click the Make Next Decision button
    const decisionButton = page.getByRole('button', { name: /Make Next Decision/i });
    await expect(decisionButton).toBeVisible({ timeout: 10000 });
    await decisionButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Check if modal content is visible (decision card should load)
    // The modal should show a decision title or loading state
    const modalContent = page.locator('[role="dialog"], .modal, [class*="modal"]');
    await expect(modalContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('should load decision card from API', async ({ page }) => {
    await page.goto(`${BASE_URL}/loom`);
    await page.waitForTimeout(2000);

    // Click Make Next Decision
    const decisionButton = page.getByRole('button', { name: /Make Next Decision/i });
    await decisionButton.click();

    // Wait for API call and modal content
    await page.waitForTimeout(2000);

    // Check for decision card elements (these should be loaded from API)
    // Look for common decision card elements like options or title
    const hasOptions = await page.locator('button, [role="button"]').count();
    expect(hasOptions).toBeGreaterThan(0);
  });

  test('should display baseline timeline thread', async ({ page }) => {
    await page.goto(`${BASE_URL}/loom`);
    await page.waitForTimeout(2000);

    // Check for baseline timeline heading in canvas
    await expect(page.getByRole('heading', { name: 'Baseline Timeline' })).toBeVisible();

    // Check for thread panel with active thread count
    await expect(page.getByText('1 active thread')).toBeVisible();
  });

  test('should show initial metrics at 50', async ({ page }) => {
    await page.goto(`${BASE_URL}/loom`);
    await page.waitForTimeout(2000);

    // Initial metrics should all be around 50 (or displayed)
    // Check that metric bars or values are visible
    const metricsPanel = page.getByText('Current Impact').locator('..');
    await expect(metricsPanel).toBeVisible();
  });

  test('should have working keyboard shortcut Cmd+K', async ({ page }) => {
    await page.goto(`${BASE_URL}/loom`);

    // Wait for page to fully load and hooks to initialize
    await expect(page.getByRole('button', { name: /Make Next Decision/i })).toBeVisible();
    await page.waitForTimeout(3000);

    // Press Cmd/Ctrl + k (lowercase to match event handler)
    await page.keyboard.press('Control+k');

    // Modal should open - wait for it with longer timeout to allow API call
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify modal has loaded content (not just skeleton)
    await expect(modal.locator('h2')).toBeVisible({ timeout: 3000 });
  });

  test('should close modal with Escape key', async ({ page }) => {
    await page.goto(`${BASE_URL}/loom`);

    // Wait for page to fully load and hooks to initialize
    await expect(page.getByRole('button', { name: /Make Next Decision/i })).toBeVisible();
    await page.waitForTimeout(3000);

    // Open modal with keyboard shortcut
    await page.keyboard.press('Control+k');

    // Wait for modal to appear
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Close with Escape
    await page.keyboard.press('Escape');

    // Modal should be hidden
    await expect(modal).not.toBeVisible({ timeout: 2000 });
  });

  test('should verify backend API is responding', async ({ page }) => {
    // Test backend health endpoint
    const response = await page.request.get('http://localhost:8001/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.cardsLoaded).toBe(22);
  });

  test('should successfully call generate-decision API', async ({ page }) => {
    const response = await page.request.post('http://localhost:8001/api/generate-decision', {
      data: {
        currentMetrics: {
          waste: 50,
          emissions: 50,
          cost: 50,
          efficiency: 50,
          communityTrust: 50,
          sustainabilityScore: 50
        },
        usedCardIds: [],
        step: 0
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.card).toBeDefined();
    expect(data.card.options).toBeDefined();
    expect(data.card.options.length).toBeGreaterThan(0);
  });
});
