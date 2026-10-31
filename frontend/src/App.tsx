/**
 * Главный экран: показывает каталог и подбирает книги по выбранному жанру.
 */
import { useEffect, useMemo, useState } from 'react'
import { fetchBooks, fetchRecommendations, type Book } from './api/books.ts'
import './index.css'

type LoadingState = 'loading' | 'ready' | 'error'

function BookCards({ books }: { books: Book[] }) {
  return (
    <ul className="book-grid">
      {books.map((book) => (
        <li className="book-card" key={book.id}>
          <span className="genre">{book.genre}</span>
          <h3>{book.title}</h3>
          <p className="author">{book.author}</p>
          {book.description && <p>{book.description}</p>}
        </li>
      ))}
    </ul>
  )
}

export default function App() {
  const [catalog, setCatalog] = useState<Book[]>([])
  const [catalogState, setCatalogState] = useState<LoadingState>('loading')
  const [genre, setGenre] = useState('')
  const [recommendations, setRecommendations] = useState<Book[] | null>(null)
  const [recommendationState, setRecommendationState] = useState<LoadingState>('ready')

  useEffect(() => {
    const controller = new AbortController()
    fetchBooks(controller.signal)
      .then((books) => {
        setCatalog(books)
        setCatalogState('ready')
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error)
          setCatalogState('error')
        }
      })
    return () => controller.abort()
  }, [])

  const genres = useMemo(
    () => [...new Set(catalog.map((book) => book.genre))].sort((a, b) => a.localeCompare(b, 'ru')),
    [catalog],
  )

  async function recommend() {
    if (!genre) return
    setRecommendationState('loading')
    try {
      setRecommendations(await fetchRecommendations(genre))
      setRecommendationState('ready')
    } catch (error) {
      console.error(error)
      setRecommendationState('error')
    }
  }

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Личная книжная полка</p>
        <h1>Найдите следующую книгу</h1>
        <p>Выберите жанр, а сервис соберёт подходящие книги из каталога.</p>
      </header>

      <section className="recommendation-panel" aria-labelledby="recommendation-title">
        <div>
          <p className="eyebrow">Рекомендации</p>
          <h2 id="recommendation-title">Что хочется прочитать?</h2>
        </div>
        <div className="controls">
          <label htmlFor="genre">Жанр</label>
          <select id="genre" value={genre} onChange={(event) => setGenre(event.target.value)}>
            <option value="">Выберите жанр</option>
            {genres.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button type="button" disabled={!genre || recommendationState === 'loading'} onClick={recommend}>
            {recommendationState === 'loading' ? 'Подбираем…' : 'Подобрать книги'}
          </button>
        </div>

        {recommendationState === 'error' && <p role="alert">Не удалось получить рекомендации.</p>}
        {recommendations?.length === 0 && <p role="status">В этом жанре пока нет книг.</p>}
        {recommendations && recommendations.length > 0 && (
          <div aria-live="polite">
            <h3>Подходящие книги</h3>
            <BookCards books={recommendations} />
          </div>
        )}
      </section>

      <section aria-labelledby="catalog-title">
        <p className="eyebrow">Каталог</p>
        <h2 id="catalog-title">Все книги</h2>
        {catalogState === 'loading' && <p role="status">Загружаем каталог…</p>}
        {catalogState === 'error' && <p role="alert">Каталог временно недоступен.</p>}
        {catalogState === 'ready' && catalog.length === 0 && <p>Каталог пока пуст.</p>}
        {catalog.length > 0 && <BookCards books={catalog} />}
      </section>
    </main>
  )
}
