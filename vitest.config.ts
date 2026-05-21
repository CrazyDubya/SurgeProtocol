import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],

    // Exclude files that use node:test instead of vitest
    exclude: ['tests/unit/mission-service.test.ts', 'node_modules/**'],

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Environment
    environment: 'node',

    // Pool configuration - use forks for better isolation
    pool: 'forks',

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/types/**',
      ],
    },

    // Timeouts - add hook and teardown timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,

    // Reporter
    reporters: ['verbose'],

    // Globals
    globals: true,
  },
});
