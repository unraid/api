import { dirname, join } from "path";
import type { StorybookConfig } from "@storybook/vue3-vite";


const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions"
  ],
  framework: {
    name: "@storybook/vue3-vite",
    options: {
      docgen: "vue-component-meta",
    },
  },
  core: {
    builder: "@storybook/builder-vite",
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    config.root = dirname(require.resolve('@storybook/builder-vite'));
    return {
      ...config,
      resolve: {
        alias: {
          '@': join(dirname(new URL(import.meta.url).pathname), '../src'),
          '@/components': join(dirname(new URL(import.meta.url).pathname), '../src/components'),
          '@/lib': join(dirname(new URL(import.meta.url).pathname), '../src/lib'),
        },
      },
      css: {
        postcss: {
          plugins: [
            (await import('tailwindcss')).default({
              config: './tailwind.config.ts',
            }),
            (await import('autoprefixer')).default,
          ],
        },
      },
    };
  },
};

export default config;