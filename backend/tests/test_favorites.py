"""Избранное: авторизация, уникальность, удаление и изоляция пользователей."""

import pytest
from fastapi.testclient import TestClient

PASSWORD = "StrongPassword1"


def create_book(client: TestClient, title: str = "Дюна") -> dict[str, object]:
    """Создаёт книгу для сценариев избранного."""
    response = client.post(
        "/api/books",
        json={
            "title": title,
            "author": "Фрэнк Герберт",
            "genre": "Фантастика",
            "description": "Описание",
        },
    )
    assert response.status_code == 201
    return response.json()


def register(client: TestClient, email: str) -> None:
    """Регистрирует пользователя и оставляет его сессию в клиенте."""
    response = client.post("/api/auth/register", json={"email": email, "password": PASSWORD})
    assert response.status_code == 201


@pytest.mark.parametrize("method", ["get", "post", "delete"])
def test_favorites_require_authentication(client: TestClient, method: str) -> None:
    path = "/api/favorites" if method == "get" else "/api/favorites/1"

    response = getattr(client, method)(path)

    assert response.status_code == 401


def test_add_list_duplicate_and_remove_favorite(client: TestClient) -> None:
    book = create_book(client)
    register(client, "first@example.com")
    path = f"/api/favorites/{book['id']}"

    added = client.post(path)
    duplicate = client.post(path)

    assert added.status_code == 201
    assert client.get("/api/favorites").json() == [book]
    assert duplicate.status_code == 409

    removed = client.delete(path)

    assert removed.status_code == 204
    assert client.get("/api/favorites").json() == []
    assert client.delete(path).status_code == 404


def test_users_cannot_see_or_remove_each_others_favorites(client: TestClient) -> None:
    book = create_book(client)
    path = f"/api/favorites/{book['id']}"
    register(client, "owner@example.com")
    assert client.post(path).status_code == 201
    assert client.post("/api/auth/logout").status_code == 204

    register(client, "other@example.com")

    assert client.get("/api/favorites").json() == []
    assert client.delete(path).status_code == 404
    assert client.post("/api/auth/logout").status_code == 204

    login = client.post(
        "/api/auth/login", json={"email": "owner@example.com", "password": PASSWORD}
    )
    assert login.status_code == 200
    assert client.get("/api/favorites").json() == [book]


def test_add_favorite_rejects_unknown_book(client: TestClient) -> None:
    register(client, "reader@example.com")

    response = client.post("/api/favorites/999999")

    assert response.status_code == 404
