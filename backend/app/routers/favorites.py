"""Защищённое API личного списка избранных книг."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from app.db import DbSession
from app.models import Book, UserFavoriteBook
from app.routers.auth import CurrentUser
from app.schemas import BookRead

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("", response_model=list[BookRead])
def list_favorites(user: CurrentUser, db: DbSession) -> list[Book]:
    """Возвращает только избранное текущего пользователя."""
    query = (
        select(Book)
        .join(UserFavoriteBook, UserFavoriteBook.book_id == Book.id)
        .where(UserFavoriteBook.user_id == user.id)
        .order_by(Book.title, Book.id)
    )
    return list(db.scalars(query))


@router.post("/{book_id}", response_model=BookRead, status_code=status.HTTP_201_CREATED)
def add_favorite(book_id: int, user: CurrentUser, db: DbSession) -> Book:
    """Добавляет существующую книгу в избранное текущего пользователя."""
    book = db.get(Book, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    db.add(UserFavoriteBook(user_id=user.id, book_id=book.id))
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="Книга уже в избранном") from error
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(book_id: int, user: CurrentUser, db: DbSession) -> None:
    """Удаляет книгу только из избранного текущего пользователя."""
    result = db.execute(
        delete(UserFavoriteBook).where(
            UserFavoriteBook.user_id == user.id,
            UserFavoriteBook.book_id == book_id,
        )
    )
    if result.rowcount == 0:
        db.rollback()
        raise HTTPException(status_code=404, detail="Книги нет в избранном")
    db.commit()
