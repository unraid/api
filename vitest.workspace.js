import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./plugin/vitest.config.ts",
  "./web/vitest.config.mjs",
  "./api/vite.config.ts",
  "./unraid-ui/vitest.config.ts"
])
