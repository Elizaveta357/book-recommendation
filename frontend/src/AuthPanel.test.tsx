/**
 * Панель авторизации: регистрация, ошибка входа, восстановленная сессия и выход.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import AuthPanel from './AuthPanel.tsx'
import type { User } from './api/auth.ts'
import { server } from './test/mocks/server.ts'

function StatefulPanel({ initialUser = null }: { initialUser?: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser)
  return <AuthPanel user={user} onUserChange={setUser} />
}

describe('AuthPanel', () => {
  it('регистрирует пользователя и показывает состояние входа', async () => {
    const browser = userEvent.setup()
    server.use(http.post('/api/auth/register', () => HttpResponse.json(
      { id: 1, email: 'reader@example.com' }, { status: 201 },
    )))
    render(<StatefulPanel />)

    await browser.type(screen.getByLabelText('Email'), 'reader@example.com')
    await browser.type(screen.getByLabelText('Пароль'), 'StrongPassword1')
    await browser.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(await screen.findByText('reader@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument()
  })

  it('показывает понятную ошибку неверного входа', async () => {
    const browser = userEvent.setup()
    server.use(http.post('/api/auth/login', () => HttpResponse.json(
      { detail: 'Неверный email или пароль' }, { status: 401 },
    )))
    render(<StatefulPanel />)

    await browser.click(screen.getByRole('button', { name: 'Вход' }))
    await browser.type(screen.getByLabelText('Email'), 'reader@example.com')
    await browser.type(screen.getByLabelText('Пароль'), 'wrong')
    await browser.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный email или пароль')
  })

  it('выходит из восстановленной сессии', async () => {
    const browser = userEvent.setup()
    server.use(http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })))
    render(<StatefulPanel initialUser={{ id: 1, email: 'reader@example.com' }} />)

    await browser.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(await screen.findByRole('heading', { name: 'Создать аккаунт' })).toBeInTheDocument()
  })
})
