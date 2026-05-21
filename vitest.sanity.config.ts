import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/sanity.test.ts'],
        watch: false,
        poolOptions: {
            threads: {
                singleThread: true
            }
        },
        isolate: false,
        environment: 'node',
        reporters: ['verbose'],
    },
});
