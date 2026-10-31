"""Модель книги для каталога и подбора рекомендаций по жанру."""

from sqlalchemy import CheckConstraint, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Book(Base):
    """Книга, которую сервис может показать в каталоге и рекомендациях."""

    __tablename__ = "books"
    __table_args__ = (
        CheckConstraint("length(trim(title)) > 0", name="title_not_blank"),
        CheckConstraint("length(trim(author)) > 0", name="author_not_blank"),
        CheckConstraint("length(trim(genre)) > 0", name="genre_not_blank"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    author: Mapped[str] = mapped_column(String(160), nullable=False)
    genre: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
