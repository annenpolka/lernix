import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    deps: {
      optimizer: {
        ssr: {
          include: ['ink-testing-library']
        }
      }
    },
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html']
    }
  }
})