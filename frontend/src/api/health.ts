/**
 * Запрос к эндпоинту здоровья бэкенда: жив ли бэкенд и видит ли он базу.
 *
 * Все запросы к бэкенду идут по относительному пути /api/... — в разработке
 * их пересылает dev-сервер Vite, адрес бэкенда в коде фронта не пишется.
 */

export type Health = {
  status: 'ok' | 'error'
  database: 'ok' | 'unavailable'
}

export async function fetchHealth(signal?: AbortSignal): Promise<Health> {
  const response = await fetch('/api/health', { signal })
  // AI: 503 приходит с телом { status: 'error' } — это штатный ответ «база недоступна»,
  // его отдаём наверх как данные. Остальные коды без тела — ошибка запроса.
  if (!response.ok && response.status !== 503) {
    throw new Error(`Бэкенд ответил ${response.status}`)
  }
  return (await response.json()) as Health
}
