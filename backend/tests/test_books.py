"""API книг: добавление, каталог, рекомендации и проверка ошибочного ввода."""

from fastapi.testclient import TestClient


def add_book(client: TestClient, title: str, genre: str) -> dict[str, object]:
    """Создаёт книгу через тот же публичный API, который проверяет тест."""
    response = client.post(
        "/api/books",
        json={
            "title": title,
            "author": "Тестовый автор",
            "genre": genre,
            "description": "Описание",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_create_and_list_books(client: TestClient) -> None:
    created = add_book(client, "Дюна", "Фантастика")

    response = client.get("/api/books")

    assert response.status_code == 200
    assert response.json() == [created]


def test_create_book_rejects_blank_title(client: TestClient) -> None:
    response = client.post(
        "/api/books",
        json={"title": "   ", "author": "Автор", "genre": "Роман", "description": ""},
    )

    assert response.status_code == 422


def test_recommendations_return_only_selected_genre(client: TestClient) -> None:
    fantasy = add_book(client, "Дюна", "Фантастика")
    add_book(client, "Гордость и предубеждение", "Роман")

    response = client.get("/api/recommendations", params={"genre": "фантастика"})

    assert response.status_code == 200
    assert response.json() == [fantasy]


def test_recommendations_reject_blank_genre(client: TestClient) -> None:
    response = client.get("/api/recommendations", params={"genre": "   "})

    assert response.status_code == 422


def test_recommendations_return_empty_list_when_nothing_matches(client: TestClient) -> None:
    response = client.get("/api/recommendations", params={"genre": "Детектив"})

    assert response.status_code == 200
    assert response.json() == []
