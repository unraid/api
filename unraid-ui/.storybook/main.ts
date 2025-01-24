import type { StorybookConfig } from "@storybook/vue3-vite";
import { dirname, join } from "path";

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
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    return {
      ...config,
      resolve: {
        alias: {
          "@": join(dirname(new URL(import.meta.url).pathname), "../src"),
          "@/components": join(dirname(new URL(import.meta.url).pathname), "../src/components"),
          "@/lib": join(dirname(new URL(import.meta.url).pathname), "../src/lib"),
        },
      },
    };
  },
};

export default config;
