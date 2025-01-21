/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import tailwindcss from 'tailwindcss';

export default function createConfig() {
  return defineConfig({
    plugins: [
      vue(),
      ...(process.env.npm_lifecycle_script?.includes('storybook')
        ? []
        : [
            dts({
              insertTypesEntry: true,
              include: ['src/**/*.ts', 'src/**/*.vue', 'tailwind.config.ts'],
              outDir: 'dist',
              rollupTypes: true,
              copyDtsFiles: true,
            }),
          ]),
    ],
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        external: ['vue', 'tailwindcss'],
        input: {
          index: resolve(__dirname, 'src/index.ts'),
          tailwind: resolve(__dirname, 'tailwind.config.ts'),
          preset: resolve(__dirname, 'src/theme/preset.ts'),
          importHack: resolve(__dirname, 'src/theme/import-hack.ts'),
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
