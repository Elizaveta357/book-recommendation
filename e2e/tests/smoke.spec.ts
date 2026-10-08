/**
 * Дымовой e2e: приложение открывается, и цепочка «фронт → бэкенд → база» работает.
 *
 * Если этот тест красный, остальные e2e смотреть бессмысленно — стек не поднялся.
 */
import { expect, test } from '@playwright/test'

test('главная страница показывает, что бэкенд и база работают', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Приложение запущено' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Бэкенд и база работают')
})

test('API доступно через фронт и видит базу', async ({ request }) => {
  const response = await request.get('/api/health')

  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({ status: 'ok', database: 'ok' })
})
