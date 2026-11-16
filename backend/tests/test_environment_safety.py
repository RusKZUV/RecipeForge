import os
import pytest
from unittest.mock import patch
from app.config import config, AppConfig


def test_dev_environment_defaults():
    with patch.dict(os.environ, {"ENVIRONMENT": "development", "DATABASE_URL": "sqlite:///./dev.db"}, clear=False):
        os.environ.pop("DEBUG", None)
        os.environ.pop("PORT", None)
        os.environ.pop("CORS_ORIGINS", None)
        
        cfg = AppConfig()
        assert cfg.ENVIRONMENT == "development"
        assert cfg.DEBUG is True
        assert cfg.PORT == 8091
        assert "http://localhost:5173" in cfg.CORS_ORIGINS
        assert "http://localhost:8091" in cfg.CORS_ORIGINS


def test_prod_environment_defaults():
    with patch.dict(os.environ, {"ENVIRONMENT": "production", "DATABASE_URL": "postgresql://u:p@db:5432/recipeforge_prod_db"}, clear=False):
        os.environ.pop("DEBUG", None)
        os.environ.pop("PORT", None)
        os.environ.pop("CORS_ORIGINS", None)
        
        cfg = AppConfig()
        assert cfg.ENVIRONMENT == "production"
        assert cfg.DEBUG is False
        assert cfg.PORT == 8000
        assert "http://localhost:8000" in cfg.CORS_ORIGINS
        assert "http://localhost:5173" not in cfg.CORS_ORIGINS


def test_dev_safety_guard_blocks_production_database():
    """
    Ensure the dev configuration CANNOT accidentally connect to or mutate a production database.
    """
    # Test case 1: recipeforge_prod in URL while in development
    with patch.dict(os.environ, {
        "ENVIRONMENT": "development",
        "DATABASE_URL": "postgresql://recipeforge_dev_user:pass@db:5432/recipeforge_prod_db"
    }):
        cfg = AppConfig()
        with pytest.raises(RuntimeError, match="CRITICAL SAFETY VIOLATION"):
            cfg.validate_safety()

    # Test case 2: prod_db keyword while in dev
    with patch.dict(os.environ, {
        "ENVIRONMENT": "dev",
        "DATABASE_URL": "postgresql://user:pass@cloud-host:5432/my_prod_db"
    }):
        cfg = AppConfig()
        with pytest.raises(RuntimeError, match="CRITICAL SAFETY VIOLATION"):
            cfg.validate_safety()

    # Test case 3: Safe dev database (SQLite) passes
    with patch.dict(os.environ, {
        "ENVIRONMENT": "development",
        "DATABASE_URL": "sqlite:///./recipeforge_dev.db"
    }):
        cfg = AppConfig()
        cfg.validate_safety()  # Should not raise

    # Test case 4: Safe dev database (Postgres dev) passes
    with patch.dict(os.environ, {
        "ENVIRONMENT": "development",
        "DATABASE_URL": "postgresql://recipeforge_dev_user:password@db-dev:5432/recipeforge_dev_db"
    }):
        cfg = AppConfig()
        cfg.validate_safety()  # Should not raise


def test_production_allows_prod_database():
    """
    Production environment is allowed to connect to the production database.
    """
    with patch.dict(os.environ, {
        "ENVIRONMENT": "production",
        "DATABASE_URL": "postgresql://recipeforge_prod_user:secure@db-prod:5432/recipeforge_prod_db"
    }):
        cfg = AppConfig()
        cfg.validate_safety()  # Should not raise
