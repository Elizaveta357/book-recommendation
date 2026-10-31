/**
 * Запросы личного избранного через текущую серверную сессию пользователя.
 */
import type { Book } from './books.ts'

type ErrorBody = { detail?: string }

async function readError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => ({})) as ErrorBody
  return new Error(body.detail ?? 'Не удалось изменить избранное')
}

async function readBook(response: Response): Promise<Book> {
  if (!response.ok) throw await readError(response)
  return await response.json() as Book
}

export async function fetchFavorites(signal?: AbortSignal): Promise<Book[]> {
  const response = await fetch('/api/favorites', { credentials: 'same-origin', signal })
  if (!response.ok) throw await readError(response)
  return await response.json() as Book[]
}

export async function addFavorite(bookId: number): Promise<Book> {
  const response = await fetch(`/api/favorites/${bookId}`, {
    method: 'POST',
    credentials: 'same-origin',
  })
  return readBook(response)
}

export async function removeFavorite(bookId: number): Promise<void> {
  const response = await fetch(`/api/favorites/${bookId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  if (!response.ok) throw await readError(response)
}
