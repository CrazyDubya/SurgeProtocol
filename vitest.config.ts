import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Environment
    environment: 'node',

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

    // Timeouts
    testTimeout: 10000,

    // Reporter
    reporters: ['verbose'],

    // Globals
    globals: true,
  },
});
