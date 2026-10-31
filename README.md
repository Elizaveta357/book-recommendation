# Как устроен и запускается проект

Сервис рекомендаций книг: пользователь регистрируется или входит, видит каталог,
выбирает жанр и получает подходящие книги. Вход сохраняется в безопасной серверной
сессии с HttpOnly cookie. Бэкенд работает на Python (FastAPI, PostgreSQL), фронт —
на React и TypeScript, e2e-тесты — на Playwright. Всё запускается в Docker — на
компьютере нужны только Docker, git и IDE.

**Правила работы для команды и её ИИ-агентов — [RULES.md](RULES.md).** Начинать с него.

## Запуск

```
docker compose up --build
```

При первом запуске Alembic автоматически создаст таблицы книг, пользователей и сессий.
После изменения миграций или зависимостей пересоберите стек с анонимными томами:
`docker compose up --build -V`.

- Приложение: http://127.0.0.1:5173
- Документация API: http://127.0.0.1:8000/api/docs
- База для DBeaver: `127.0.0.1:5432`, база, логин и пароль — `app`

Порт занят другим проектом — задайте свой: `DB_PORT=5442 FRONTEND_PORT=5183 docker compose up`.

## Тесты

Полный прогон — три команды, все должны быть зелёными:

```
docker compose -f docker-compose.test.yml run --rm --build backend-tests
docker compose -f docker-compose.test.yml run --rm --build frontend-tests
docker compose -f docker-compose.test.yml run --rm --build e2e
docker compose -f docker-compose.test.yml down -v
```

Что проверяется — [TESTS.md](TESTS.md).

## Структура

| Папка | Что |
|---|---|
| `backend/app/` | код бэкенда: настройки, подключение к базе, модели, эндпоинты |
| `backend/migrations/` | миграции схемы базы (Alembic) |
| `backend/tests/` | тесты бэкенда |
| `frontend/src/` | код фронта и его тесты (`*.test.tsx`) |
| `e2e/tests/` | e2e-тесты в браузере |

## Авторизация

- Регистрация: email и пароль от 12 символов со строчной, заглавной буквой и цифрой.
- Email хранится в нижнем регистре и уникален.
- Пароль хранится только как хеш `scrypt` с индивидуальной случайной солью.
- Сессия действует 7 дней. В браузере находится только непрозрачная HttpOnly cookie,
  а в базе — её SHA-256 отпечаток.
- Для развёртывания за HTTPS задайте `SESSION_COOKIE_SECURE=true` в окружении backend.
