/**
 * Главный экран: каталог, подбор по жанру и понятная ошибка загрузки.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from './App.tsx'
import { server } from './test/mocks/server.ts'

describe('App', () => {
  it('показывает каталог и рекомендации выбранного жанра', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Дюна' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Жанр'), 'Фантастика')
    await user.click(screen.getByRole('button', { name: 'Подобрать книги' }))

    expect(await screen.findByRole('heading', { name: 'Подходящие книги' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Дюна' })).toHaveLength(2)
    expect(screen.getAllByRole('heading', { name: 'Гордость и предубеждение' })).toHaveLength(1)
  })

  it('сообщает, когда в выбранном жанре нет книг', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('/api/recommendations', () => HttpResponse.json([])),
    )
    render(<App />)

    await screen.findByRole('heading', { name: 'Дюна' })
    await user.selectOptions(screen.getByLabelText('Жанр'), 'Фантастика')
    await user.click(screen.getByRole('button', { name: 'Подобрать книги' }))

    expect(await screen.findByRole('status')).toHaveTextContent('В этом жанре пока нет книг.')
  })

  it('показывает ошибку, когда каталог недоступен', async () => {
    server.use(http.get('/api/books', () => new HttpResponse(null, { status: 500 })))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Каталог временно недоступен.')
    consoleError.mockRestore()
  })
})
