/**
 * Корневой компонент: показывает статус бэкенда при успехе и при отказе.
 */
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import App from './App.tsx'
import { server } from './test/mocks/server.ts'

describe('App', () => {
  it('показывает, что бэкенд и база работают', async () => {
    render(<App />)

    expect(await screen.findByText('Бэкенд и база работают')).toBeInTheDocument()
  })

  it('показывает недоступность, когда база не отвечает', async () => {
    server.use(
      http.get('/api/health', () =>
        HttpResponse.json({ status: 'error', database: 'unavailable' }, { status: 503 }),
      ),
    )

    render(<App />)

    expect(await screen.findByText('Бэкенд или база недоступны')).toBeInTheDocument()
  })

  it('показывает недоступность, когда бэкенд отвечает ошибкой', async () => {
    server.use(http.get('/api/health', () => new HttpResponse(null, { status: 500 })))
    // console.error здесь ожидаем — заглушаем, чтобы не засорять вывод прогона
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<App />)

    expect(await screen.findByText('Бэкенд или база недоступны')).toBeInTheDocument()
    consoleError.mockRestore()
  })
})
