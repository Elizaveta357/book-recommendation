/**
 * Настройки Playwright — e2e-тестов в настоящем браузере.
 *
 * Тесты ходят на фронт, поднятый в тестовом стеке (docker-compose.test.yml),
 * по имени контейнера. Фронт пересылает /api бэкенду, бэкенд работает с тестовой
 * базой в памяти — проверяется вся цепочка, которую увидит пользователь.
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://frontend:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
