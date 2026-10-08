/**
 * Ответы бэкенда по умолчанию для тестов фронта.
 *
 * Здесь — успешные ответы. Тест, которому нужен отказ, подменяет ответ у себя:
 * server.use(http.get(...)).
 */
import { http, HttpResponse } from 'msw'
import type { Health } from '../../api/health.ts'

export const handlers = [
  http.get('/api/health', () => HttpResponse.json<Health>({ status: 'ok', database: 'ok' })),
]
