/**
 * Настройки Vitest — юнит- и компонентных тестов фронта.
 *
 * Отдельный файл, чтобы тестам не мешал прокси из vite.config.ts. Окружение jsdom
 * изображает браузер, сеть подменяет MSW (src/test/setup.ts).
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
