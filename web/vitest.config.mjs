import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: [/.*\.mjs$/],
        interopDefault: true,
        registerNodeLoader: true,
      },
    },
    setupFiles: ['./test/setup.ts'],
    globals: true,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    include: [
      'test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
      'helpers/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
    ],
    testTimeout: 5000,
    hookTimeout: 5000,
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
