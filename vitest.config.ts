import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      "./api/vite.config.ts",
      "./plugin/vitest.config.ts",
      "./unraid-ui/vitest.config.ts",
      "./web/vitest.config.mjs"
    ]
  }
})