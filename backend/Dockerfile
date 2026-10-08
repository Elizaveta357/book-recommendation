# Образ бэкенда: Python 3.13 + зависимости из uv.lock.
FROM python:3.13-slim

# AI: uv берём из официального образа — одна версия у всей команды, pip не используем.
COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /uvx /bin/

# AI: окружение живёт в /opt/venv, а не в /app/.venv. В docker-compose.yml папка backend
# монтируется в /app для горячей перезагрузки — окружение внутри /app она бы перекрыла.
ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Сначала только описание зависимостей: слой кэшируется и не пересобирается,
# пока не поменялись pyproject.toml или uv.lock.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .

EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
