/**
 * Ответы бэкенда по умолчанию для тестов фронта.
 *
 * Здесь — успешные ответы. Тест, которому нужен отказ, подменяет ответ у себя:
 * server.use(http.get(...)).
 */
import { http, HttpResponse } from 'msw'
import type { Book } from '../../api/books.ts'

const books: Book[] = [
  {
    id: 1,
    title: 'Дюна',
    author: 'Фрэнк Герберт',
    genre: 'Фантастика',
    description: 'История пустынной планеты Арракис.',
  },
  {
    id: 2,
    title: 'Гордость и предубеждение',
    author: 'Джейн Остин',
    genre: 'Роман',
    description: 'Роман о семье, характере и выборе.',
  },
]

export const handlers = [
  http.get('/api/books', () => HttpResponse.json(books)),
  http.get('/api/recommendations', ({ request }) => {
    const genre = new URL(request.url).searchParams.get('genre')
    return HttpResponse.json(books.filter((book) => book.genre === genre))
  }),
]
