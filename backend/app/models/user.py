"""Модели пользователя и серверной сессии для безопасной авторизации."""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class User(Base):
    """Учётная запись с нормализованным email и хешем пароля."""

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("email = lower(trim(email))", name="email_normalized"),
        CheckConstraint("length(email) >= 3", name="email_not_blank"),
        CheckConstraint("length(password_hash) > 0", name="password_hash_not_blank"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class UserSession(Base):
    """Серверная сессия; исходный токен существует только в HttpOnly cookie."""

    __tablename__ = "user_sessions"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
