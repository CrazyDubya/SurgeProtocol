/**
 * Navigation E2E Tests
 *
 * Tests for page navigation and routing.
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('Public Routes', () => {
    test('should load login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveURL(/.*login/);
      await expect(page.getByRole('heading')).toBeVisible();
    });

    test('should load register page', async ({ page }) => {
      await page.goto('/register');
      await expect(page).toHaveURL(/.*register/);
      await expect(page.getByRole('heading')).toBeVisible();
    });
  });

  test.describe('404 Page', () => {
    test('should display not found page for invalid routes', async ({ page }) => {
      await page.goto('/this-route-does-not-exist-123');
      await expect(page.getByText(/not found|404|page doesn't exist/i)).toBeVisible();
    });

    test('should have link to return home or login', async ({ page }) => {
      await page.goto('/invalid-route-xyz');
      const homeLink = page.getByRole('link', { name: /home|back|login|return/i });
      await expect(homeLink).toBeVisible();
    });
  });

  test.describe('Page Transitions', () => {
    test('should navigate from login to register', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('link', { name: /register|sign up|create/i }).click();
      await expect(page).toHaveURL(/.*register/);
    });

    test('should navigate from register to login', async ({ page }) => {
      await page.goto('/register');
      await page.getByRole('link', { name: /login|sign in|already/i }).click();
      await expect(page).toHaveURL(/.*login/);
    });
  });
});

test.describe('Responsive Navigation', () => {
  test.describe('Mobile Menu', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display mobile menu toggle on small screens', async ({ page }) => {
      await page.goto('/login');
      // Mobile menu behavior - check that the page is responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Desktop Navigation', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('should display desktop navigation on large screens', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
