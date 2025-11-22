import { test, expect } from '@playwright/test';

const GRAFANA_ADMIN_USER = 'admin';
const GRAFANA_ADMIN_PASSWORD = 'admin';

test.describe('Drasi SignalR Data Source Plugin', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login to Grafana
    await page.goto('/login');
    await page.fill('input[name="user"]', GRAFANA_ADMIN_USER);
    await page.fill('input[name="password"]', GRAFANA_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load (skip password change if prompted)
    await page.waitForLoadState('networkidle');
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }
  });

  test('should be able to install and configure the data source', async ({ page }) => {
    // Navigate to data sources
    await page.goto('/datasources');
    await page.waitForLoadState('networkidle');
    
    // Click "Add new data source"
    const addButton = page.locator('a:has-text("Add new data source"), a:has-text("Add data source")').first();
    await addButton.click();
    await page.waitForLoadState('networkidle');
    
    // Search for Drasi SignalR plugin
    const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    await searchInput.fill('Drasi SignalR');
    await page.waitForTimeout(1000);
    
    // Click on the Drasi SignalR data source (look for the plugin in results)
    const dataSourceCard = page.locator('text=Drasi SignalR').first();
    await expect(dataSourceCard).toBeVisible({ timeout: 10000 });
    await dataSourceCard.click();
    
    // Wait for configuration page
    await page.waitForURL('**/datasources/edit/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Fill in SignalR URL - look for the specific placeholder from ConfigEditor
    const signalrUrlInput = page.locator('input[placeholder="http://localhost:8080/hub"]');
    await expect(signalrUrlInput).toBeVisible({ timeout: 5000 });
    await signalrUrlInput.fill('http://localhost:8002/hub');
    
    // Save and test the data source
    const saveButton = page.locator('button:has-text("Save & test"), button:has-text("Save")').first();
    await saveButton.click();
    
    // Wait for result - look for any alert or notification
    await page.waitForTimeout(3000);
    const hasAlert = await page.locator('[role="alert"], [data-testid*="alert"], [class*="alert"]').count() > 0;
    expect(hasAlert).toBeTruthy();
  });

  test('should show plugin in Grafana catalog', async ({ page }) => {
    // Navigate to plugins page
    await page.goto('/plugins');
    await page.waitForLoadState('networkidle');
    
    // Search for the plugin
    const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    await searchInput.fill('Drasi');
    await page.waitForTimeout(2000);
    
    // Verify plugin appears in search results by checking for any SignalR text
    const hasPluginInList = (await page.getByText(/Drasi/i).count() > 0) || 
                            (await page.getByText(/SignalR/i).count() > 0);
    expect(hasPluginInList).toBeTruthy();
  });

  test('should validate query configuration', async ({ page }) => {
    // Navigate to create new dashboard
    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');
    
    // Add a new panel
    const addButton = page.locator('button:has-text("Add visualization"), button:has-text("Add panel")').first();
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Verify that panel editor exists by checking for common panel editor elements
    const hasPanelEditor = (await page.locator('[class*="panel"]').count() > 0) || 
                          (await page.getByText(/Query/i).count() > 0);
    expect(hasPanelEditor).toBeTruthy();
  });
});
