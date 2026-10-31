"""Первоначальный каталог: полнота, идемпотентность и сохранение существующих данных."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Book
from app.seed import DEMO_BOOKS, seed_catalog


def test_seed_populates_catalog_and_is_idempotent(db_session: Session) -> None:
    first_added = seed_catalog(db_session)
    second_added = seed_catalog(db_session)
    books_count = db_session.scalar(select(func.count()).select_from(Book))

    assert len(DEMO_BOOKS) >= 20
    assert first_added == len(DEMO_BOOKS)
    assert second_added == 0
    assert books_count == len(DEMO_BOOKS)


def test_seed_does_not_overwrite_existing_book(db_session: Session) -> None:
    demo = DEMO_BOOKS[0]
    existing = Book(
        title=demo["title"],
        author="Пользовательский автор",
        genre="Пользовательский жанр",
        description="Пользовательское описание",
    )
    db_session.add(existing)
    db_session.commit()

    added = seed_catalog(db_session)
    preserved = db_session.scalar(select(Book).where(Book.id == existing.id))

    assert added == len(DEMO_BOOKS) - 1
    assert preserved is not None
    assert preserved.author == "Пользовательский автор"
    assert preserved.genre == "Пользовательский жанр"
    assert preserved.description == "Пользовательское описание"
