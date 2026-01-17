/**
 * E2E Test Fixtures and Helpers
 *
 * Common test utilities and data for E2E tests.
 */

import { test as base } from '@playwright/test';

// Test user credentials (for authenticated tests)
export const TEST_USER = {
  email: 'test@surgeprotocol.io',
  password: 'testpassword123',
};

// Extended test with common fixtures
export const test = base.extend<{
  // Add custom fixtures here as needed
}>({
  // Example: authenticated page fixture would go here
});

export { expect } from '@playwright/test';

// Helper to wait for page to be fully loaded
export async function waitForPageLoad(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

// Helper to clear local storage
export async function clearStorage(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

// Helper to mock WebSocket connection
export async function mockWebSocket(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    // Mock WebSocket for tests that don't need real-time connections
    class MockWebSocket {
      readyState = 1; // OPEN
      onopen: (() => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onclose: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor() {
        setTimeout(() => this.onopen?.(), 100);
      }

      send() {}
      close() {
        this.onclose?.();
      }
    }

    (window as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket;
  });
}

// Common selectors
export const selectors = {
  // Authentication
  emailInput: '[data-testid="email-input"], input[type="email"], input[name="email"]',
  passwordInput: '[data-testid="password-input"], input[type="password"], input[name="password"]',
  submitButton: '[data-testid="submit-button"], button[type="submit"]',

  // Navigation
  navMenu: '[data-testid="nav-menu"], nav',
  mobileMenuToggle: '[data-testid="mobile-menu-toggle"]',

  // Loading states
  loadingSpinner: '[data-testid="loading"], .loading',
  skeleton: '.skeleton',
};
