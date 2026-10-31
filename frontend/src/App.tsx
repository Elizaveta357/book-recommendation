/**
 * Главный экран: показывает каталог и подбирает книги по выбранному жанру.
 */
import { useEffect, useMemo, useState } from 'react'
import AuthPanel from './AuthPanel.tsx'
import { getCurrentUser, type User } from './api/auth.ts'
import { fetchBooks, fetchRecommendations, type Book } from './api/books.ts'
import { addFavorite, fetchFavorites, removeFavorite } from './api/favorites.ts'
import './index.css'

type LoadingState = 'loading' | 'ready' | 'error'

type BookCardsProps = {
  books: Book[]
  favoriteIds: Set<number>
  user: User | null | undefined
  pendingBookId: number | null
  onToggleFavorite: (book: Book) => void
}

function BookCards({
  books,
  favoriteIds,
  user,
  pendingBookId,
  onToggleFavorite,
}: BookCardsProps) {
  return (
    <ul className="book-grid">
      {books.map((book) => {
        const isFavorite = favoriteIds.has(book.id)
        const isPending = pendingBookId === book.id
        const action = isFavorite ? 'Убрать из избранного' : 'В избранное'
        return (
          <li className="book-card" key={book.id}>
            <span className="genre">{book.genre}</span>
            <h3>{book.title}</h3>
            <p className="author">{book.author}</p>
            {book.description && <p>{book.description}</p>}
            <button
              type="button"
              className="favorite-button"
              aria-label={`${action}: ${book.title}`}
              disabled={!user || pendingBookId !== null}
              onClick={() => onToggleFavorite(book)}
            >
              {isPending
                ? isFavorite ? 'Удаляем…' : 'Сохраняем…'
                : user ? action : 'Войдите, чтобы добавить'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default function App() {
  const [catalog, setCatalog] = useState<Book[]>([])
  const [catalogState, setCatalogState] = useState<LoadingState>('loading')
  const [genre, setGenre] = useState('')
  const [recommendations, setRecommendations] = useState<Book[] | null>(null)
  const [recommendationState, setRecommendationState] = useState<LoadingState>('ready')
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [favorites, setFavorites] = useState<Book[]>([])
  const [favoriteState, setFavoriteState] = useState<LoadingState>('loading')
  const [favoriteError, setFavoriteError] = useState('')
  const [pendingBookId, setPendingBookId] = useState<number | null>(null)

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

  useEffect(() => {
    if (!user) return

    const controller = new AbortController()
    fetchFavorites(controller.signal)
      .then((books) => {
        setFavorites(books)
        setFavoriteState('ready')
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error)
          setFavoriteState('error')
        }
      })
    return () => controller.abort()
  }, [user])

  useEffect(() => {
    const controller = new AbortController()
    getCurrentUser(controller.signal)
      .then((currentUser) => {
        setUser(currentUser)
        setFavoriteState(currentUser ? 'loading' : 'ready')
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error)
          setUser(null)
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

  const favoriteIds = useMemo(() => new Set(favorites.map((book) => book.id)), [favorites])

  function changeUser(nextUser: User | null) {
    setUser(nextUser)
    setFavorites([])
    setFavoriteError('')
    setFavoriteState(nextUser ? 'loading' : 'ready')
  }

  async function toggleFavorite(book: Book) {
    if (!user || pendingBookId !== null) return
    const isFavorite = favoriteIds.has(book.id)
    setPendingBookId(book.id)
    setFavoriteError('')
    try {
      if (isFavorite) {
        await removeFavorite(book.id)
        setFavorites((current) => current.filter((item) => item.id !== book.id))
      } else {
        const added = await addFavorite(book.id)
        setFavorites((current) => [...current.filter((item) => item.id !== added.id), added])
      }
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : 'Не удалось изменить избранное')
    } finally {
      setPendingBookId(null)
    }
  }

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Личная книжная полка</p>
        <h1>Найдите следующую книгу</h1>
        <p>Выберите жанр, а сервис соберёт подходящие книги из каталога.</p>
      </header>

      <AuthPanel user={user} onUserChange={changeUser} />

      <section className="favorites-panel" aria-labelledby="favorites-title">
        <p className="eyebrow">Личная коллекция</p>
        <h2 id="favorites-title">Моё избранное</h2>
        {user === null && <p>Войдите или зарегистрируйтесь, чтобы сохранять книги.</p>}
        {user === undefined && <p role="status">Проверяем вход…</p>}
        {user && favoriteState === 'loading' && <p role="status">Загружаем избранное…</p>}
        {user && favoriteState === 'error' && <p role="alert">Не удалось загрузить избранное.</p>}
        {user && favoriteState === 'ready' && favorites.length === 0 && (
          <p>В избранном пока нет книг.</p>
        )}
        {favoriteError && <p role="alert">{favoriteError}</p>}
        {user && favorites.length > 0 && (
          <BookCards
            books={favorites}
            favoriteIds={favoriteIds}
            user={user}
            pendingBookId={pendingBookId}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </section>

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
            <BookCards
              books={recommendations}
              favoriteIds={favoriteIds}
              user={user}
              pendingBookId={pendingBookId}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="catalog-title">
        <p className="eyebrow">Каталог</p>
        <h2 id="catalog-title">Все книги</h2>
        {catalogState === 'loading' && <p role="status">Загружаем каталог…</p>}
        {catalogState === 'error' && <p role="alert">Каталог временно недоступен.</p>}
        {catalogState === 'ready' && catalog.length === 0 && <p>Каталог пока пуст.</p>}
        {catalog.length > 0 && (
          <BookCards
            books={catalog}
            favoriteIds={favoriteIds}
            user={user}
            pendingBookId={pendingBookId}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </section>
    </main>
  )
}
