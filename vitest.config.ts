import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '#app': fileURLToPath(new URL('./app/testing/nuxt-app.ts', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['app/**/*.component.vitest.ts'],
    setupFiles: ['./app/testing/setup-component-tests.ts'],
  },
})
