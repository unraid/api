import { resolve } from 'path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  root: '.',
  server: {
    port: 5173,
    open: '/test-standalone.html',
    cors: true,
    fs: {
      strict: false,
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './'),
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  optimizeDeps: {
    include: ['vue', 'pinia', '@vue/apollo-composable'],
  },
});
