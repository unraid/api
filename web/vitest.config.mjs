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
    setupFiles: ['./__test__/setup.ts'],
    globals: true,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    include: ['__test__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    testTimeout: 5000,
    hookTimeout: 5000,
    coverage: {
      all: true,
      include: ['components/**/*', 'composables/**/*', 'utils/**/*', 'stores/**/*'],
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
