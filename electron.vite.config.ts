import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@core': resolve('src/core'),
        '@services': resolve('src/services'),
        '@connectors': resolve('src/connectors'),
        '@game': resolve('src/game'),
        '@plugins': resolve('src/plugins'),
        '@overlay': resolve('src/overlay'),
        '@automation': resolve('src/automation')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    root: 'src/renderer',
    build: {
      rollupOptions: {
        input: resolve('src/renderer/index.html')
      }
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@renderer': resolve('src/renderer'),
        '@game': resolve('src/game'),
        '@automation': resolve('src/automation')
      }
    }
  }
})
