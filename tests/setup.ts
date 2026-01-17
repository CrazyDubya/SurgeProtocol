/**
 * Vitest setup file
 * Mocks Cloudflare-specific modules for testing
 */

import { vi } from 'vitest';

// Mock cloudflare:workers module
vi.mock('cloudflare:workers', () => {
  class DurableObject {
    ctx: unknown;
    env: unknown;

    constructor(ctx: unknown, env: unknown) {
      this.ctx = ctx;
      this.env = env;
    }
  }

  return {
    DurableObject,
  };
});
