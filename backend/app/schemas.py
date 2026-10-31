"""Схемы API отделяют публичный формат книг от устройства таблиц базы."""

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BookCreate(BaseModel):
    """Данные новой книги с защитой от пустых значений."""

    title: str = Field(max_length=200)
    author: str = Field(max_length=160)
    genre: str = Field(max_length=80)
    description: str = ""

    @field_validator("title", "author", "genre")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        """Убирает внешние пробелы и отклоняет строки только из пробелов."""
        value = value.strip()
        if not value:
            raise ValueError("поле не может быть пустым")
        return value

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        """Хранит описание без случайных пробелов по краям."""
        return value.strip()


class BookRead(BaseModel):
    """Книга в ответах API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str
    genre: str
    description: str
