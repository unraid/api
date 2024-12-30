/// <reference types="vitest" />
import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      include: ["src/**/*.ts", "src/**/*.vue"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Unraid UI",
      formats: ["es", "umd"],
      fileName: "index",
    },
    cssCodeSplit: true,
    minify: true,
    sourcemap: true,
    rollupOptions: {
      external: ["vue"],
      output: {
        assetFileNames: (assetInfo) => {
          if (
            typeof assetInfo.source === "string" &&
            assetInfo.source.includes("style.css")
          )
            return "css/style.[hash].css";
          return "assets/[name].[hash][extname]";
        },
        globals: {
          vue: "Vue",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/components": resolve(__dirname, "./src/components"),
      "@/composables": resolve(__dirname, "./src/composables"),
      "@/lib": resolve(__dirname, "./src/lib"),
      "@/styles": resolve(__dirname, "./src/styles"),
      "@/types": resolve(__dirname, "./src/types"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
});
