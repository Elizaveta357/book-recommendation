"""Публичные схемы API книг и авторизации отделены от моделей базы."""

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


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


class LoginCredentials(BaseModel):
    """Нормализованные учётные данные для входа."""

    email: str = Field(max_length=320)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        """Нормализует регистр email и отклоняет очевидно неверный адрес."""
        normalized = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(normalized):
            raise ValueError("Введите корректный email")
        return normalized


class RegisterCredentials(LoginCredentials):
    """Данные регистрации с требованиями к сложности нового пароля."""

    password: str = Field(min_length=12, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        """Требует буквы обоих регистров и цифру в достаточно длинном пароле."""
        if not re.search(r"[a-zа-яё]", value):
            raise ValueError("Пароль должен содержать строчную букву")
        if not re.search(r"[A-ZА-ЯЁ]", value):
            raise ValueError("Пароль должен содержать заглавную букву")
        if not re.search(r"\d", value):
            raise ValueError("Пароль должен содержать цифру")
        return value


class UserRead(BaseModel):
    """Безопасные публичные данные пользователя без хеша пароля."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
