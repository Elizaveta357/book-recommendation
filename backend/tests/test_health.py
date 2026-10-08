"""Эндпоинт здоровья: успех, когда база доступна, и отказ, когда нет."""

from collections.abc import Iterator

from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError


def test_health_ok_when_database_answers(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


class _BrokenSession:
    """Сессия, у которой база не отвечает: любой запрос падает как при обрыве связи."""

    def execute(self, *args: object, **kwargs: object) -> None:
        raise OperationalError("SELECT 1", {}, ConnectionRefusedError("база недоступна"))


def test_health_503_when_database_unavailable(client: TestClient) -> None:
    from app.db import get_db
    from app.main import app

    def broken_db() -> Iterator[_BrokenSession]:
        yield _BrokenSession()

    app.dependency_overrides[get_db] = broken_db

    response = client.get("/api/health")

    assert response.status_code == 503
    assert response.json() == {"status": "error", "database": "unavailable"}
