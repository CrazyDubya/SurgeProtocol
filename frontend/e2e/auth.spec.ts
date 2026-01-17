/**
 * Authentication E2E Tests
 *
 * Tests for login, registration, and session management.
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await expect(page.getByText(/required|email|password/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalid@test.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|login/i }).click();

      await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
    });

    test('should have link to registration', async ({ page }) => {
      const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe('Registration Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register');
    });

    test('should display registration form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /register|sign up|create account/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalidemail');
      await page.getByLabel(/password/i).first().fill('validpassword123');
      await page.getByRole('button', { name: /register|sign up|create/i }).click();

      await expect(page.getByText(/invalid|email|format/i)).toBeVisible();
    });

    test('should have link to login', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /login|sign in|already have/i });
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*login/);
    });

    test('should persist session across page reloads', async ({ page }) => {
      // This test would require a valid test user - skip for now
      test.skip();
    });
  });
});
