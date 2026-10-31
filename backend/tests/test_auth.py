"""Авторизация: регистрация, валидация, уникальность, вход, сессия и выход."""

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User, UserSession

EMAIL = "reader@example.com"
PASSWORD = "StrongPassword1"


def register(client: TestClient) -> object:
    """Регистрирует стандартного тестового пользователя."""
    return client.post("/api/auth/register", json={"email": EMAIL, "password": PASSWORD})


def test_register_hashes_password_and_returns_current_user(
    client: TestClient, db_session: Session
) -> None:
    response = register(client)

    assert response.status_code == 201
    assert response.json()["email"] == EMAIL
    assert "password" not in response.json()
    user = db_session.scalar(select(User).where(User.email == EMAIL))
    assert user is not None
    assert user.password_hash != PASSWORD
    assert user.password_hash.startswith("scrypt$")
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    session = db_session.scalar(select(UserSession).where(UserSession.user_id == user.id))
    assert session is not None
    assert len(session.token_hash) == 64
    assert session.token_hash not in cookie
    assert client.get("/api/auth/me").json()["email"] == EMAIL


def test_register_rejects_invalid_email_and_weak_password(client: TestClient) -> None:
    invalid_email = client.post(
        "/api/auth/register", json={"email": "not-an-email", "password": PASSWORD}
    )
    weak_password = client.post(
        "/api/auth/register", json={"email": EMAIL, "password": "onlylowercase"}
    )

    assert invalid_email.status_code == 422
    assert weak_password.status_code == 422


def test_register_rejects_duplicate_email_ignoring_case(client: TestClient) -> None:
    assert register(client).status_code == 201

    duplicate = client.post(
        "/api/auth/register", json={"email": " Reader@Example.com ", "password": PASSWORD}
    )

    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Аккаунт с таким email уже существует"


def test_login_rejects_wrong_password_and_accepts_correct_password(client: TestClient) -> None:
    assert register(client).status_code == 201
    client.post("/api/auth/logout")

    wrong = client.post("/api/auth/login", json={"email": EMAIL, "password": "WrongPassword1"})
    correct = client.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD})

    assert wrong.status_code == 401
    assert wrong.json()["detail"] == "Неверный email или пароль"
    assert correct.status_code == 200
    assert client.get("/api/auth/me").status_code == 200


def test_logout_invalidates_session(client: TestClient) -> None:
    assert register(client).status_code == 201

    logout = client.post("/api/auth/logout")

    assert logout.status_code == 204
    assert client.get("/api/auth/me").status_code == 401
