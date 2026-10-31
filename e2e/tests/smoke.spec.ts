/**
 * Дымовой e2e: приложение открывается, и цепочка «фронт → бэкенд → база» работает.
 *
 * Если этот тест красный, остальные e2e смотреть бессмысленно — стек не поднялся.
 */
import { expect, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'

test('пользователь получает рекомендации по выбранному жанру', async ({ page, request }) => {
  const runId = randomUUID()
  const fantasyTitle = `Дюна ${runId}`
  const fantasyGenre = `Фантастика ${runId}`
  const novelTitle = `Гордость и предубеждение ${runId}`
  const fantasy = await request.post('/api/books', {
    data: {
      title: fantasyTitle,
      author: 'Фрэнк Герберт',
      genre: fantasyGenre,
      description: 'История пустынной планеты Арракис.',
    },
  })
  expect(fantasy.status()).toBe(201)
  const novel = await request.post('/api/books', {
    data: {
      title: novelTitle,
      author: 'Джейн Остин',
      genre: `Роман ${runId}`,
      description: 'Роман о семье, характере и выборе.',
    },
  })
  expect(novel.status()).toBe(201)

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Найдите следующую книгу' })).toBeVisible()
  await page.getByLabel('Жанр').selectOption(fantasyGenre)
  await page.getByRole('button', { name: 'Подобрать книги' }).click()

  const recommendations = page.getByRole('heading', { name: 'Подходящие книги' }).locator('..')
  await expect(recommendations.getByRole('heading', { name: fantasyTitle })).toHaveCount(1)
  await expect(recommendations.getByRole('heading', { name: fantasyTitle })).toBeVisible()
  await expect(recommendations.getByRole('heading', { name: novelTitle })).toHaveCount(0)
})

test('API доступно через фронт и видит базу', async ({ request }) => {
  const response = await request.get('/api/health')

  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({ status: 'ok', database: 'ok' })
})

test('пользователь регистрируется, сохраняет вход, выходит и входит снова', async ({ page }) => {
  const email = `reader-${randomUUID()}@example.com`
  const password = 'StrongPassword1'

  await page.goto('/')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Пароль').fill(password)
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click()
  await expect(page.getByText(email)).toBeVisible()

  await page.reload()
  await expect(page.getByText(email)).toBeVisible()
  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page.getByRole('heading', { name: 'Создать аккаунт' })).toBeVisible()

  await page.getByRole('button', { name: 'Вход' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Пароль').fill(password)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(page.getByText(email)).toBeVisible()
})
