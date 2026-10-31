# Как устроен и запускается проект

Сервис рекомендаций книг: пользователь видит каталог, выбирает жанр и получает
подходящие книги. Бэкенд работает на Python (FastAPI, PostgreSQL), фронт — на React
и TypeScript, e2e-тесты — на Playwright. Всё запускается в Docker — на компьютере
нужны только Docker, git и IDE.

**Правила работы для команды и её ИИ-агентов — [RULES.md](RULES.md).** Начинать с него.

## Запуск

```
docker compose up --build
```

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
