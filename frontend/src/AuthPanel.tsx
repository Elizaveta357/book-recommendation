/**
 * Панель регистрации, входа и выхода с понятными ошибками для пользователя.
 */
import { useState, type FormEvent } from 'react'
import { login, logout, register, type User } from './api/auth.ts'

type Props = {
  user: User | null | undefined
  onUserChange: (user: User | null) => void
}

type Mode = 'login' | 'register'

export default function AuthPanel({ user, onUserChange }: Props) {
  const [mode, setMode] = useState<Mode>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (user === undefined) {
    return <section className="auth-panel" aria-label="Учётная запись"><p role="status">Проверяем вход…</p></section>
  }

  if (user) {
    async function handleLogout() {
      setPending(true)
      setError('')
      try {
        await logout()
        onUserChange(null)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Не удалось выйти')
      } finally {
        setPending(false)
      }
    }

    return (
      <section className="auth-panel signed-in" aria-label="Учётная запись">
        <div><span>Вы вошли как</span><strong>{user.email}</strong></div>
        <button type="button" disabled={pending} onClick={handleLogout}>Выйти</button>
        {error && <p role="alert">{error}</p>}
      </section>
    )
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const nextUser = mode === 'register'
        ? await register({ email, password })
        : await login({ email, password })
      setPassword('')
      onUserChange(nextUser)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось выполнить вход')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-tabs" role="group" aria-label="Выбор действия">
        <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Регистрация</button>
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Вход</button>
      </div>
      <form onSubmit={handleSubmit}>
        <h2 id="auth-title">{mode === 'register' ? 'Создать аккаунт' : 'Войти в аккаунт'}</h2>
        <label htmlFor="auth-email">Email</label>
        <input id="auth-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="auth-password">Пароль</label>
        <input id="auth-password" name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 12 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
        {mode === 'register' && <p className="field-help">Не менее 12 символов: строчная и заглавная буквы, цифра.</p>}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={pending}>{pending ? 'Подождите…' : mode === 'register' ? 'Зарегистрироваться' : 'Войти'}</button>
      </form>
    </section>
  )
}
