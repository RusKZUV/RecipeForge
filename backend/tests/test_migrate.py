import pytest
from sqlalchemy import create_engine, text, inspect
from app.migrate import run_migrations


def test_run_migrations_adds_missing_columns():
    # Create an in-memory SQLite database simulating an older DB schema
    engine = create_engine("sqlite:///:memory:")
    
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE users (
                    id VARCHAR(64) PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    default_servings INTEGER NOT NULL DEFAULT 1,
                    dietary_filters_json TEXT NOT NULL DEFAULT '[]',
                    equipment_json TEXT NOT NULL DEFAULT '[]',
                    assumed_staples_json TEXT NOT NULL DEFAULT '{}',
                    created_at TIMESTAMP NOT NULL
                )
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO users (id, email, password_hash, created_at)
                VALUES ('user-old', 'old@recipeforge.local', 'hash', '2026-01-01 00:00:00')
                """
            )
        )

    # Verify columns before migration
    inspector = inspect(engine)
    cols_before = {c["name"] for c in inspector.get_columns("users")}
    assert "avatar_url" not in cols_before
    assert "max_budget" not in cols_before

    # Run migration
    run_migrations(engine)

    # Verify columns after migration
    inspector = inspect(engine)
    cols_after = {c["name"] for c in inspector.get_columns("users")}
    assert "avatar_url" in cols_after
    assert "max_budget" in cols_after

    # Verify existing data preserved and new columns are readable/updatable
    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT id, email, avatar_url, max_budget FROM users WHERE id = 'user-old'")
        ).fetchone()
        assert row is not None
        assert row[0] == "user-old"
        assert row[1] == "old@recipeforge.local"
        assert row[2] is None
        assert row[3] is None

        # Update new columns
        conn.execute(
            text("UPDATE users SET avatar_url = '🧑‍🍳', max_budget = 12000 WHERE id = 'user-old'")
        )
        updated_row = conn.execute(
            text("SELECT avatar_url, max_budget FROM users WHERE id = 'user-old'")
        ).fetchone()
        assert updated_row[0] == "🧑‍🍳"
        assert updated_row[1] == 12000

    # Run migration again to verify idempotency
    run_migrations(engine)
    inspector_repeat = inspect(engine)
    cols_repeat = {c["name"] for c in inspector_repeat.get_columns("users")}
    assert "avatar_url" in cols_repeat
    assert "max_budget" in cols_repeat
