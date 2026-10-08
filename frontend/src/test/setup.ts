/**
 * Подготовка окружения для всех тестов фронта.
 *
 * Матчеры jest-dom (toBeInTheDocument и др.) и MSW — подмена сети. Тест, который
 * обращается к незамоканному адресу, падает: в сеть тесты не ходят.
 */
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server.ts'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Сбрасываем подмены, сделанные в отдельном тесте, и очищаем страницу.
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

afterAll(() => server.close())
