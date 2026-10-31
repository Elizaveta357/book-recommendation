"""добавить книги

Ревизия: 88baa3996f7a
Предыдущая:
Создана: 2026-10-30 20:24:01.735338
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "88baa3996f7a"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Применить изменение схемы."""
    op.create_table(
        "books",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("author", sa.String(length=160), nullable=False),
        sa.Column("genre", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.CheckConstraint("length(trim(author)) > 0", name=op.f("ck_books_author_not_blank")),
        sa.CheckConstraint("length(trim(genre)) > 0", name=op.f("ck_books_genre_not_blank")),
        sa.CheckConstraint("length(trim(title)) > 0", name=op.f("ck_books_title_not_blank")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_books")),
    )
    op.create_index(op.f("ix_books_genre"), "books", ["genre"], unique=False)


def downgrade() -> None:
    """Откатить изменение схемы — обратное upgrade, шаг в шаг."""
    op.drop_index(op.f("ix_books_genre"), table_name="books")
    op.drop_table("books")
