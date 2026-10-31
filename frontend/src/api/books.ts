/**
 * Запросы каталога и рекомендаций книг через относительные маршруты backend.
 */

export type Book = {
  id: number
  title: string
  author: string
  genre: string
  description: string
}

async function readBooks(response: Response): Promise<Book[]> {
  if (!response.ok) {
    throw new Error(`Бэкенд ответил ${response.status}`)
  }
  return (await response.json()) as Book[]
}

export async function fetchBooks(signal?: AbortSignal): Promise<Book[]> {
  return readBooks(await fetch('/api/books', { signal }))
}

export async function fetchRecommendations(genre: string): Promise<Book[]> {
  const query = new URLSearchParams({ genre })
  return readBooks(await fetch(`/api/recommendations?${query}`))
}
