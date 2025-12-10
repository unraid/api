import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/tests/**/*.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    sequence: {
      concurrent: false,
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
