import { test, expect, Page } from '@playwright/test';

/**
 * Helper function to login to Grafana
 */
export async function loginToGrafana(page: Page, username = 'admin', password = 'admin') {
  await page.goto('/login');
  await page.fill('input[name="user"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect and skip password change prompt if shown
  await page.waitForLoadState('networkidle');
  const skipButton = page.locator('button:has-text("Skip")');
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
  }
}

/**
 * Helper function to add Drasi SignalR data source
 */
export async function addDrasiDataSource(page: Page, signalrUrl = 'http://localhost:8002/hub') {
  await page.goto('/datasources/new');
  await page.fill('input[placeholder="Search data source plugins"]', 'Drasi SignalR');
  
  const dataSourceCard = page.locator('div[aria-label*="Drasi SignalR"]').first();
  await expect(dataSourceCard).toBeVisible({ timeout: 10000 });
  await dataSourceCard.click();
  
  await page.waitForURL('**/edit');
  
  const signalrUrlInput = page.locator('input[placeholder*="http"]').first();
  await signalrUrlInput.fill(signalrUrl);
  
  const saveButton = page.locator('button:has-text("Save & test")');
  await saveButton.click();
  
  // Wait for save to complete
  await page.waitForTimeout(2000);
}

/**
 * Simple smoke test
 */
test('Grafana loads successfully', async ({ page }) => {
  await loginToGrafana(page);
  await expect(page).toHaveURL(/.*\/$/);
  await expect(page.locator('text=/Home/i').first()).toBeVisible({ timeout: 10000 });
});
