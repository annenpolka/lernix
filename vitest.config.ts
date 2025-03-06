import { defineConfig } from 'vitest';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.integration.test.ts'
    ],
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