/**
 * Запросы авторизации через серверную HttpOnly cookie без хранения токена в JavaScript.
 */

export type User = {
  id: number
  email: string
}

export type Credentials = {
  email: string
  password: string
}

type ErrorBody = { detail?: string | Array<{ msg?: string }> }

async function readResponse(response: Response): Promise<User> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ErrorBody
    if (typeof body.detail === 'string') throw new Error(body.detail)
    const validationMessage = Array.isArray(body.detail) ? body.detail[0]?.msg : undefined
    throw new Error(validationMessage?.replace(/^Value error, /, '') ?? 'Не удалось выполнить запрос')
  }
  return await response.json() as User
}

async function sendCredentials(path: string, credentials: Credentials): Promise<User> {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  return readResponse(response)
}

export function register(credentials: Credentials): Promise<User> {
  return sendCredentials('/api/auth/register', credentials)
}

export function login(credentials: Credentials): Promise<User> {
  return sendCredentials('/api/auth/login', credentials)
}

export async function getCurrentUser(signal?: AbortSignal): Promise<User | null> {
  const response = await fetch('/api/auth/me', { credentials: 'same-origin', signal })
  if (response.status === 401) return null
  return readResponse(response)
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error('Не удалось выйти. Попробуйте ещё раз.')
}
