import os
from unittest.mock import patch
import pytest
from app.database import Base


def test_database_url_handling():
    with patch.dict(os.environ, {"DATABASE_URL": "sqlite:///./test_custom.db"}):
        from importlib import reload
        import app.database as db_mod
        reload(db_mod)
        assert db_mod.DATABASE_URL == "sqlite:///./test_custom.db"
        assert db_mod.connect_args.get("check_same_thread") is False

    with patch.dict(os.environ, {"DATABASE_URL": "postgres://user:pass@localhost:5432/testdb"}):
        from importlib import reload
        import app.database as db_mod
        reload(db_mod)
        assert "psycopg2" in db_mod.DATABASE_URL
        assert db_mod.engine_kwargs.get("pool_pre_ping") is True

    # Restore default SQLite environment
    with patch.dict(os.environ, {"DATABASE_URL": "sqlite:///./recipeforge.db"}):
        from importlib import reload
        import app.database as db_mod
        reload(db_mod)
