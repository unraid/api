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
    const storybookDir = dirname(new URL(import.meta.url).pathname);

    return {
      ...config,
      plugins: [...(config.plugins ?? [])],
      resolve: {
        alias: {
          '@': join(storybookDir, '../src'),
          '@/components': join(storybookDir, '../src/components'),
          '@/lib': join(storybookDir, '../src/lib'),
        },
      },
      optimizeDeps: {
        include: [...(config.optimizeDeps?.include ?? []), '@unraid/tailwind-rem-to-rem'],
      },
    };
  },
};

export default config;
