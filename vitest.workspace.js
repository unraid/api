import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./plugin/vitest.config.ts",
  "./api/vite.config.ts",
  "./web/vitest.config.mjs",
  "./unraid-ui/vitest.config.ts"
])
