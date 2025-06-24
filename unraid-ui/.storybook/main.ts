import { dirname, join } from 'path';
import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],

  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: 'vue-component-meta',
    },
  },

  core: {
    builder: '@storybook/builder-vite',
  },

  staticDirs: ['./static'],

  async viteFinal(config) {
    return {
      ...config,
      root: dirname(require.resolve('@storybook/builder-vite')),
      resolve: {
        alias: {
          '@': join(dirname(new URL(import.meta.url).pathname), '../src'),
          '@/components': join(dirname(new URL(import.meta.url).pathname), '../src/components'),
          '@/lib': join(dirname(new URL(import.meta.url).pathname), '../src/lib'),
        },
      },
      optimizeDeps: {
        include: [...(config.optimizeDeps?.include ?? []), '@unraid/tailwind-rem-to-rem'],
      },
      css: {
        postcss: './postcss.config.js',
      },
    };
  },
};

export default config;
