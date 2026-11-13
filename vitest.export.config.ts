import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/** Runs scripts/export-models.ts (vitest is used only as a TypeScript runner here). */
export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    include: ['scripts/export-models.ts'],
    environment: 'node',
  },
})
