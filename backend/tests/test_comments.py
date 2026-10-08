"""Комментарии в коде: у каждого модуля есть docstring «зачем этот файл».

Зачем: агент забывает всё между сессиями, и модульный docstring — первое, что
следующая сессия читает в файле. Тег AI: на граблях машина не проверит — это
правило RULES.md, а наличие docstring проверяется здесь.
"""

import ast
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
CHECKED = ["app", "migrations", "tests"]


def test_every_module_has_docstring() -> None:
    missing = []
    for folder in CHECKED:
        for path in sorted((BACKEND_DIR / folder).rglob("*.py")):
            tree = ast.parse(path.read_text(encoding="utf-8"))
            if not (ast.get_docstring(tree) or "").strip():
                missing.append(str(path.relative_to(BACKEND_DIR)))

    assert missing == [], f"Нет docstring у модулей: {missing}"
