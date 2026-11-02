import logging
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def run_migrations(engine: Engine) -> None:
    """
    Lightweight, DBMS-agnostic schema updater.
    Safely adds missing columns to existing tables in both SQLite and PostgreSQL.
    """
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        if "users" in table_names:
            existing_columns = {col["name"] for col in inspector.get_columns("users")}
            with engine.begin() as conn:
                if "avatar_url" not in existing_columns:
                    logger.info("Migrating schema: Adding avatar_url column to users table")
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT"))
                if "max_budget" not in existing_columns:
                    logger.info("Migrating schema: Adding max_budget column to users table")
                    conn.execute(text("ALTER TABLE users ADD COLUMN max_budget INTEGER"))
    except Exception as e:
        logger.error(f"Migration execution error: {e}")
        raise


if __name__ == "__main__":
    from app.database import engine
    run_migrations(engine)
    print("Schema migration completed successfully.")
