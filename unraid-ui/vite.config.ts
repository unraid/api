/// <reference types="vitest" />
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default function createConfig() {
  return defineConfig({
    plugins: [
      tailwindcss(),
      vue(),
      ...(process.env.npm_lifecycle_script?.includes('storybook')
        ? []
        : [
            dts({
              insertTypesEntry: true,
              include: ['src/**/*.ts', 'src/**/*.vue'],
              exclude: [
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'src/**/*.test.tsx',
                'src/**/*.spec.tsx',
                'src/**/*.test.vue',
                'src/**/*.spec.vue',
                'src/**/*.stories.*',
                'src/**/*.stories.{ts,tsx,vue}',
                'src/**/__tests__/**',
              ],
              outDir: 'dist',
              rollupTypes: true,
              copyDtsFiles: true,
            }),
          ]),
    ],
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        external: [
          'vue',
          'tailwindcss',
          'ajv',
          'ajv-errors',
          ...(process.env.npm_lifecycle_script?.includes('storybook') ? [/^storybook\//] : []),
        ],
        input: {
          index: resolve(__dirname, 'src/index.ts'),
        },
        preserveEntrySignatures: 'allow-extension',
        output: {
          exports: 'named',
          globals: {
            vue: 'Vue',
            tailwindcss: 'tailwindcss',
          },
          format: 'es',
          preserveModules: true,
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') {
              return 'style.css';
            }
            return '[name][extname]';
          },
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'tailwind') {
              return '[name].config.js';
            } else {
              return '[name].js';
            }
          },
        },
      },
      target: 'esnext',
      sourcemap: true,
      minify: false,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@/components': resolve(__dirname, './src/components'),
        '@/composables': resolve(__dirname, './src/composables'),
        '@/lib': resolve(__dirname, './src/lib'),
        '@/styles': resolve(__dirname, './src/styles'),
        '@/types': resolve(__dirname, './src/types'),
        '@/theme': resolve(__dirname, './src/theme'),
      },
    },
    test: {
      environment: 'happy-dom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
  });
}
