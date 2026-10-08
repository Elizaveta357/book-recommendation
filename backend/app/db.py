"""Подключение к PostgreSQL: движок, сессии, базовый класс моделей.

Зачем: одно место, где создаётся соединение с базой. Модели наследуются от Base,
эндпоинты получают сессию через зависимость get_db — так тесты подменяют её своей
сессией, которая откатывает всё сделанное после каждого теста.
"""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# AI: явные имена ограничений. Без них PostgreSQL придумывает имена сам, Alembic о них
# не знает, и миграция отката не может удалить ограничение — падает на downgrade.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

# AI: pool_pre_ping проверяет соединение перед выдачей из пула. Без него первый запрос
# после перезапуска контейнера базы падает с «connection closed».
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Базовый класс всех моделей. Alembic строит миграции по Base.metadata."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def get_db() -> Iterator[Session]:
    """Сессия на один запрос: открыли, отдали эндпоинту, закрыли."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Тип параметра эндпоинта «нужна сессия базы»: `def handler(db: DbSession): ...`
DbSession = Annotated[Session, Depends(get_db)]
