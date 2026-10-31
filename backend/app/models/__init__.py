"""Модели данных — таблицы базы.

Каждую новую модель импортировать здесь. Alembic и тест на совпадение моделей
с миграциями видят только то, что импортировано в этот пакет.
"""

from app.db import Base
from app.models.book import Book
from app.models.user import User, UserSession

__all__ = ["Base", "Book", "User", "UserSession"]
