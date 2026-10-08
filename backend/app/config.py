"""Настройки приложения из переменных окружения.

Зачем: адрес базы и прочие параметры разные на компьютере разработчика, в тестах
и на сервере, поэтому в коде их нет. Значения приходят из окружения: их задаёт
docker compose, а при запуске без него — файл .env рядом с проектом.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Все настройки приложения в одном месте."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # AI: значения по умолчанию нет намеренно. Забыли задать DATABASE_URL —
    # приложение падает при старте с понятной ошибкой, а не подключается к чужой базе.
    database_url: str


settings = Settings()
