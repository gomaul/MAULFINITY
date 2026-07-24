import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['src/renderer/**', 'src/preload/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/core/**/*.ts', 'src/services/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'tests/**/*.test.ts', 'src/renderer/**', 'src/preload/**']
    }
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@connectors': path.resolve(__dirname, 'src/connectors'),
      '@game': path.resolve(__dirname, 'src/game'),
      '@plugins': path.resolve(__dirname, 'src/plugins'),
      '@overlay': path.resolve(__dirname, 'src/overlay'),
      '@automation': path.resolve(__dirname, 'src/automation')
    }
  }
})
