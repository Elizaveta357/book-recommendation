"""Окружение Alembic: к какой базе применять миграции и с какими моделями сравнивать.

Зачем: миграции — единственный способ менять схему базы. Новая таблица или поле
появляются так: меняем модель → `alembic revision --autogenerate -m "что сделали"` →
читаем сгенерированный файл глазами → `alembic upgrade head`.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

import app.models  # noqa: F401 — регистрирует все модели в Base.metadata
from app.config import settings
from app.db import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", settings.database_url)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Режим без подключения: печатает SQL миграций вместо выполнения."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Обычный режим: подключиться к базе и выполнить миграции."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        # AI: compare_type — autogenerate замечает смену типа поля (VARCHAR → TEXT).
        # Без него такая правка модели не попадает в миграцию молча.
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
