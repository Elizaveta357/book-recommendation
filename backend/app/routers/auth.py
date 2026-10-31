"""API регистрации, входа, выхода и получения текущего пользователя."""

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Cookie, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.db import DbSession
from app.models import User, UserSession
from app.schemas import LoginCredentials, RegisterCredentials, UserRead
from app.security import hash_password, hash_session_token, new_session_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
SESSION_COOKIE = "book_session"
SessionCookie = Annotated[str | None, Cookie(alias=SESSION_COOKIE)]


def set_session_cookie(response: Response, token: str) -> None:
    """Записывает токен так, чтобы JavaScript не мог его прочитать."""
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=settings.session_lifetime_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )


def create_session(user: User, response: Response, db: DbSession) -> None:
    """Создаёт серверную сессию и возвращает браузеру исходный токен."""
    token = new_session_token()
    expires_at = datetime.now(UTC) + timedelta(days=settings.session_lifetime_days)
    db.add(
        UserSession(token_hash=hash_session_token(token), user_id=user.id, expires_at=expires_at)
    )
    db.commit()
    set_session_cookie(response, token)


def find_current_user(token: str | None, db: DbSession) -> User | None:
    """Находит пользователя активной сессии и удаляет истёкшую сессию."""
    if token is None:
        return None
    session = db.get(UserSession, hash_session_token(token))
    if session is None:
        return None
    if session.expires_at <= datetime.now(UTC):
        db.delete(session)
        db.commit()
        return None
    return db.get(User, session.user_id)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterCredentials, response: Response, db: DbSession) -> User:
    """Создаёт уникального пользователя и сразу выполняет вход."""
    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Аккаунт с таким email уже существует"
        ) from error
    db.refresh(user)
    create_session(user, response, db)
    return user


@router.post("/login", response_model=UserRead)
def login(payload: LoginCredentials, response: Response, db: DbSession) -> User:
    """Проверяет учётные данные и создаёт новую сессию."""
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    create_session(user, response, db)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, db: DbSession, token: SessionCookie = None) -> None:
    """Удаляет текущую серверную сессию и cookie браузера."""
    if token is not None:
        db.execute(delete(UserSession).where(UserSession.token_hash == hash_session_token(token)))
        db.commit()
    response.delete_cookie(SESSION_COOKIE, path="/")


@router.get("/me", response_model=UserRead)
def current_user(db: DbSession, token: SessionCookie = None) -> User:
    """Возвращает владельца действующей cookie или ответ 401."""
    user = find_current_user(token, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Требуется вход")
    return user
