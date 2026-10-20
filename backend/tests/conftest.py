import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use a test SQLite database
os.environ["DATABASE_URL"] = "sqlite:///./test_recipeforge.db"

from app.database import Base, get_db
from app.main import app
from app.seed import seed_database

test_engine = create_engine(
    "sqlite:///./test_recipeforge.db",
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as db:
        seed_database(db)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_recipeforge.db"):
        try:
            os.remove("./test_recipeforge.db")
        except Exception:
            pass


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_headers(client):
    resp = client.post("/auth/demo-login")
    assert resp.status_code == 200
    token = resp.json()["token"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
