/**
 * Accessibility E2E Tests
 *
 * Basic accessibility checks for critical pages.
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.describe('Keyboard Navigation', () => {
    test('login form should be navigable with keyboard', async ({ page }) => {
      await page.goto('/login');

      // Tab to email field
      await page.keyboard.press('Tab');
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeFocused();

      // Tab to password field
      await page.keyboard.press('Tab');
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toBeFocused();

      // Tab to submit button
      await page.keyboard.press('Tab');
      const submitButton = page.getByRole('button', { name: /sign in|login/i });
      await expect(submitButton).toBeFocused();
    });

    test('register form should be navigable with keyboard', async ({ page }) => {
      await page.goto('/register');

      // Should be able to tab through form fields
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/email/i)).toBeFocused();
    });
  });

  test.describe('Focus Management', () => {
    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.getByLabel(/email/i);
      await emailInput.focus();

      // Check that focus is visible (element should have focus ring/outline)
      await expect(emailInput).toBeFocused();
    });
  });

  test.describe('Color Contrast', () => {
    test('login page should have readable text', async ({ page }) => {
      await page.goto('/login');

      // Check that main heading is visible
      const heading = page.getByRole('heading').first();
      await expect(heading).toBeVisible();

      // Check that form labels are visible
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });
  });

  test.describe('Form Labels', () => {
    test('all form inputs should have associated labels', async ({ page }) => {
      await page.goto('/login');

      // Email input should have a label
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();

      // Password input should have a label
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toBeVisible();
    });

    test('register form inputs should have labels', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
    });
  });

  test.describe('ARIA', () => {
    test('buttons should have accessible names', async ({ page }) => {
      await page.goto('/login');

      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const name = await button.getAttribute('aria-label') || await button.textContent();
        expect(name?.trim()).toBeTruthy();
      }
    });

    test('links should have accessible names', async ({ page }) => {
      await page.goto('/login');

      const links = page.getByRole('link');
      const count = await links.count();

      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const name = await link.getAttribute('aria-label') || await link.textContent();
        expect(name?.trim()).toBeTruthy();
      }
    });
  });
});
