"""API каталога книг и рекомендаций на основе выбранного жанра."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.db import DbSession
from app.models import Book
from app.schemas import BookCreate, BookRead

router = APIRouter(prefix="/api", tags=["books"])


@router.post("/books", response_model=BookRead, status_code=status.HTTP_201_CREATED)
def create_book(payload: BookCreate, db: DbSession) -> Book:
    """Добавляет книгу в каталог."""
    book = Book(**payload.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@router.get("/books", response_model=list[BookRead])
def list_books(db: DbSession) -> list[Book]:
    """Возвращает каталог в стабильном алфавитном порядке."""
    return list(db.scalars(select(Book).order_by(Book.title, Book.id)))


@router.get("/recommendations", response_model=list[BookRead])
def recommendations(
    db: DbSession,
    genre: Annotated[str, Query(min_length=1, max_length=80)],
) -> list[Book]:
    """Подбирает книги по жанру без учёта регистра символов."""
    normalized_genre = genre.strip()
    if not normalized_genre:
        # AI: Query(min_length=1) пропускает строку из пробелов, поэтому проверка нужна отдельно.
        raise HTTPException(status_code=422, detail="Жанр не может быть пустым")

    query = (
        select(Book)
        .where(func.lower(Book.genre) == normalized_genre.lower())
        .order_by(Book.title, Book.id)
    )
    return list(db.scalars(query))
