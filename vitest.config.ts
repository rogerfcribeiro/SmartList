import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/*.ts'],
      exclude: ['src/modules/**/types.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
      },
      reporter: ['text', 'lcov'],
    },
  },
});
