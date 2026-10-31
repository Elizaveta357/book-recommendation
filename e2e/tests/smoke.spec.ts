/**
 * Дымовой e2e: приложение открывается, и цепочка «фронт → бэкенд → база» работает.
 *
 * Если этот тест красный, остальные e2e смотреть бессмысленно — стек не поднялся.
 */
import { expect, test } from '@playwright/test'

test('пользователь получает рекомендации по выбранному жанру', async ({ page, request }) => {
  const fantasy = await request.post('/api/books', {
    data: {
      title: 'Дюна',
      author: 'Фрэнк Герберт',
      genre: 'Фантастика',
      description: 'История пустынной планеты Арракис.',
    },
  })
  expect(fantasy.status()).toBe(201)
  const novel = await request.post('/api/books', {
    data: {
      title: 'Гордость и предубеждение',
      author: 'Джейн Остин',
      genre: 'Роман',
      description: 'Роман о семье, характере и выборе.',
    },
  })
  expect(novel.status()).toBe(201)

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Найдите следующую книгу' })).toBeVisible()
  await page.getByLabel('Жанр').selectOption('Фантастика')
  await page.getByRole('button', { name: 'Подобрать книги' }).click()

  const recommendations = page.getByRole('heading', { name: 'Подходящие книги' }).locator('..')
  await expect(recommendations.getByRole('heading', { name: 'Дюна' })).toBeVisible()
  await expect(recommendations.getByRole('heading', { name: 'Гордость и предубеждение' })).toHaveCount(0)
})

test('API доступно через фронт и видит базу', async ({ request }) => {
  const response = await request.get('/api/health')

  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({ status: 'ok', database: 'ok' })
})
