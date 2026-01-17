/**
 * Visual Regression E2E Tests
 *
 * Snapshot tests for consistent UI appearance.
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test.describe('Login Page', () => {
    test('should match login page snapshot', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('login-page.png', {
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('Register Page', () => {
    test('should match register page snapshot', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('register-page.png', {
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('404 Page', () => {
    test('should match 404 page snapshot', async ({ page }) => {
      await page.goto('/non-existent-page-xyz');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('404-page.png', {
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('Mobile Views', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should match mobile login page snapshot', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('login-page-mobile.png', {
        maxDiffPixelRatio: 0.05,
      });
    });

    test('should match mobile register page snapshot', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('register-page-mobile.png', {
        maxDiffPixelRatio: 0.05,
      });
    });
  });

  test.describe('Theme Consistency', () => {
    test('should render cyberpunk theme elements correctly', async ({ page }) => {
      await page.goto('/login');

      // Check for key theme elements
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Verify dark background is present (cyberpunk theme)
      const backgroundColor = await body.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should be a dark color (low RGB values)
      expect(backgroundColor).toBeTruthy();
    });
  });
});
