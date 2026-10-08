"""Миграции: одна линия истории, откат работает, модели совпадают со схемой.

Зачем: схема базы — самый дорогой артефакт. Эти тесты ловят три типовые поломки:
две миграции от одного родителя (две «головы»), миграцию без рабочего downgrade
и модель, поменянную без миграции.
"""

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory


def test_single_head(alembic_config: Config) -> None:
    heads = ScriptDirectory.from_config(alembic_config).get_heads()

    assert len(heads) <= 1, f"У миграций несколько голов: {heads}. Нужна одна линия истории"


def test_downgrade_and_upgrade_again(alembic_config: Config) -> None:
    # AI: прогоняем полный цикл на тестовой базе. Миграция, у которой downgrade
    # не обратен upgrade, падает здесь, а не на сервере в момент отката релиза.
    command.downgrade(alembic_config, "base")
    command.upgrade(alembic_config, "head")


def test_models_match_migrations() -> None:
    import app.models  # noqa: F401 — регистрирует модели в Base.metadata
    from app.db import Base, engine

    with engine.connect() as connection:
        context = MigrationContext.configure(connection, opts={"compare_type": True})
        diff = compare_metadata(context, Base.metadata)

    assert diff == [], (
        "Модели расходятся со схемой, которую дают миграции. Создайте миграцию: "
        f"alembic revision --autogenerate -m '...'. Расхождения: {diff}"
    )
