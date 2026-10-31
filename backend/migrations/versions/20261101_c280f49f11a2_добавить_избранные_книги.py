"""добавить избранные книги

Ревизия: c280f49f11a2
Предыдущая: b714f48c02d1
Создана: 2026-11-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c280f49f11a2"
down_revision: str | None = "b714f48c02d1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Создать таблицу личных избранных книг."""
    op.create_table(
        "user_favorite_books",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("book_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["book_id"],
            ["books.id"],
            name=op.f("fk_user_favorite_books_book_id_books"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_user_favorite_books_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", "book_id", name=op.f("pk_user_favorite_books")),
    )


def downgrade() -> None:
    """Удалить только таблицу связи избранного."""
    op.drop_table("user_favorite_books")
