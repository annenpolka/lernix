import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
    exclude: ['node_modules'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/'],
      provider: 'v8',
      // Vitest 3.0からのオプション
      reportsDirectory: './coverage'
    },
  },
});