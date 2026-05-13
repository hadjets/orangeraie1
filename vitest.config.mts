import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react() as any, tsconfigPaths()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      exclude: [
        'node_modules/**',
        '**/*.config.*',
        '**/types/**',
        'prisma/**',
        '.next/**',
        'src/__tests__/**',
        'src/__mocks__/**',
        'src/app/api/auth/**',
      ],
    },
    include: [
      'src/__tests__/unit/**/*.test.{ts,tsx}',
      'src/__tests__/integration/**/*.test.ts',
    ],
  },
})
