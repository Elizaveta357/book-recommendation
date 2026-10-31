/**
 * Главный экран: каталог, подбор по жанру и понятная ошибка загрузки.
 */
import { render, screen, waitFor, within } from '@testing-library/react'
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

  it('восстанавливает пользователя из серверной сессии после загрузки', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({
      id: 7,
      email: 'reader@example.com',
    })))

    render(<App />)

    expect(await screen.findByText('reader@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument()
  })

  it('добавляет книгу в избранное и удаляет её из личного раздела', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({
        id: 7,
        email: 'reader@example.com',
      })),
      http.post('/api/favorites/1', () => HttpResponse.json({
        id: 1,
        title: 'Дюна',
        author: 'Фрэнк Герберт',
        genre: 'Фантастика',
        description: 'История пустынной планеты Арракис.',
      }, { status: 201 })),
      http.delete('/api/favorites/1', () => new HttpResponse(null, { status: 204 })),
    )
    render(<App />)

    await screen.findByText('reader@example.com')
    await user.click(screen.getByRole('button', { name: 'В избранное: Дюна' }))

    const favorites = screen.getByRole('region', { name: 'Моё избранное' })
    expect(await within(favorites).findByRole('heading', { name: 'Дюна' })).toBeInTheDocument()
    await user.click(within(favorites).getByRole('button', {
      name: 'Убрать из избранного: Дюна',
    }))
    await waitFor(() => {
      expect(within(favorites).queryByRole('heading', { name: 'Дюна' })).not.toBeInTheDocument()
    })
    expect(within(favorites).getByText('В избранном пока нет книг.')).toBeInTheDocument()
  })

  it('показывает ошибку добавления в избранное', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({
        id: 7,
        email: 'reader@example.com',
      })),
      http.post('/api/favorites/1', () => HttpResponse.json(
        { detail: 'Не удалось сохранить книгу' }, { status: 500 },
      )),
    )
    render(<App />)

    await screen.findByText('reader@example.com')
    await user.click(screen.getByRole('button', { name: 'В избранное: Дюна' }))

    const favorites = screen.getByRole('region', { name: 'Моё избранное' })
    expect(await within(favorites).findByRole('alert')).toHaveTextContent(
      'Не удалось сохранить книгу',
    )
  })

  it('предлагает гостю войти для использования избранного', async () => {
    render(<App />)

    const favorites = screen.getByRole('region', { name: 'Моё избранное' })
    expect(await within(favorites).findByText(
      'Войдите или зарегистрируйтесь, чтобы сохранять книги.',
    )).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'В избранное: Дюна' })).toBeDisabled()
  })
})
