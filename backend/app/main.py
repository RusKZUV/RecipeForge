import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, SessionLocal
from app.seed import seed_database
from app.routers import (
    auth_router,
    pantry_router,
    recipes_router,
    shopping_router,
    catalog_router,
    matches_router,
    cook_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed initial catalog and recipes
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="RecipeForge API",
    version="0.1.0",
    description="Web app that helps budget-conscious students cook affordable meals from ingredients they already have.",
    lifespan=lifespan,
)

# CORS configuration
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all route modules
app.include_router(auth_router)
app.include_router(pantry_router)
app.include_router(recipes_router)
app.include_router(shopping_router)
app.include_router(catalog_router)
app.include_router(matches_router)
app.include_router(cook_router)


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok", "app": "RecipeForge", "version": "0.1.0"}


@app.get("/", tags=["system"])
def root():
    return {
        "message": "Welcome to RecipeForge API",
        "docs_url": "/docs",
        "health_url": "/health",
    }
