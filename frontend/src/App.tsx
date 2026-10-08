/**
 * Корневой компонент приложения.
 *
 * Пока показывает одно: работает ли цепочка «фронт → бэкенд → база».
 * По этой строке видно, что окружение поднялось целиком; её же проверяет e2e-тест.
 */
import { useEffect, useState } from 'react'
import { fetchHealth } from './api/health.ts'

type BackendState = 'checking' | 'ok' | 'unavailable'

const STATE_TEXT: Record<BackendState, string> = {
  checking: 'Проверяем бэкенд…',
  ok: 'Бэкенд и база работают',
  unavailable: 'Бэкенд или база недоступны',
}

export default function App() {
  const [state, setState] = useState<BackendState>('checking')

  useEffect(() => {
    // AI: AbortController отменяет запрос, если компонент успел исчезнуть со страницы.
    // Без него ответ, пришедший позже, пишет в состояние уже несуществующего компонента.
    const controller = new AbortController()
    fetchHealth(controller.signal)
      .then((health) => setState(health.status === 'ok' ? 'ok' : 'unavailable'))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error)
          setState('unavailable')
        }
      })
    return () => controller.abort()
  }, [])

  return (
    <main>
      <h1>Приложение запущено</h1>
      <p role="status">{STATE_TEXT[state]}</p>
    </main>
  )
}
