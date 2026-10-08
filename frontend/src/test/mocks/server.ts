/**
 * Единый MSW-сервер для всех тестов. Поднимается и гасится в src/test/setup.ts.
 */
import { setupServer } from 'msw/node'
import { handlers } from './handlers.ts'

export const server = setupServer(...handlers)
