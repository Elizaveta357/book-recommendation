"""Общие фикстуры тестов бэкенда.

Тесты ходят в отдельную тестовую базу из docker-compose.test.yml, её данные живут
в памяти и пропадают после прогона. Схема строится миграциями Alembic — теми же,
что на рабочей базе, поэтому тест проверяет заодно и миграции. Каждый тест работает
внутри транзакции, которая откатывается в конце: тесты не видят данных друг друга.
"""

import os
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]


def pytest_configure(config: pytest.Config) -> None:
    """Не даём запустить тесты на рабочей базе."""
    # AI: фикстура migrated_db в конце откатывает ВСЕ миграции. На рабочей базе это
    # удаление всех таблиц с данными. Тестовый стек ставит TESTING=1 — без него стоп.
    if os.environ.get("TESTING") != "1":
        pytest.exit(
            "Тесты запускаются только в тестовом стеке: "
            "docker compose -f docker-compose.test.yml run --rm --build backend-tests",
            returncode=2,
        )


@pytest.fixture(scope="session")
def alembic_config() -> Config:
    """Конфиг Alembic с путями от папки backend, откуда бы ни запускали pytest."""
    return Config(str(BACKEND_DIR / "alembic.ini"))


@pytest.fixture(scope="session", autouse=True)
def migrated_db(alembic_config: Config) -> Iterator[None]:
    """Тестовая база со схемой по всем миграциям; после прогона — откат до пустой."""
    command.upgrade(alembic_config, "head")
    yield
    command.downgrade(alembic_config, "base")


@pytest.fixture()
def db_session() -> Iterator[Session]:
    """Сессия внутри транзакции, которая откатывается после теста."""
    from app.db import engine

    connection = engine.connect()
    transaction = connection.begin()
    # AI: create_savepoint — commit() внутри кода приложения фиксирует только точку
    # сохранения, внешняя транзакция теста всё равно откатывается целиком.
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session) -> Iterator[TestClient]:
    """HTTP-клиент к приложению, который работает с тестовой сессией."""
    from app.db import get_db
    from app.main import app

    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
