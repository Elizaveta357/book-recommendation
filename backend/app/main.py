"""Точка входа бэкенда: приложение FastAPI и эндпоинт здоровья.

Зачем /api/health: одна проверка всей цепочки «бэкенд жив и видит базу».
Её вызывают фронт (показывает статус), e2e-тест и healthcheck в docker compose.
Все эндпоинты приложения живут под /api — фронт проксирует туда запросы.
"""

from typing import Literal

from fastapi import FastAPI, Response, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db import DbSession
from app.routers.auth import router as auth_router
from app.routers.books import router as books_router
from app.routers.favorites import router as favorites_router

app = FastAPI(title="API приложения", docs_url="/api/docs", openapi_url="/api/openapi.json")
app.include_router(auth_router)
app.include_router(books_router)
app.include_router(favorites_router)


class Health(BaseModel):
    """Ответ эндпоинта здоровья."""

    status: Literal["ok", "error"]
    database: Literal["ok", "unavailable"]


@app.get("/api/health", response_model=Health)
def health(response: Response, db: DbSession) -> Health:
    """Бэкенд отвечает и база выполняет запрос."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        # AI: 503 Service Unavailable — сервис жив, но работать не может. По этому коду
        # healthcheck и фронт отличают недоступную базу от ошибки в коде (500).
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return Health(status="error", database="unavailable")
    return Health(status="ok", database="ok")
