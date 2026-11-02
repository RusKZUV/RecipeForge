import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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


# Static files and React SPA fallback configuration
static_dir = os.getenv(
    "STATIC_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static"),
)

if os.path.isdir(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", tags=["system"])
def root(request: Request):
    if os.path.isdir(static_dir):
        accept = request.headers.get("accept", "")
        if "text/html" in accept:
            index_file = os.path.join(static_dir, "index.html")
            if os.path.isfile(index_file):
                return FileResponse(index_file)
    return {
        "message": "Welcome to RecipeForge API",
        "docs_url": "/docs",
        "health_url": "/health",
    }


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa_or_static(full_path: str):
    import app.main as current_module
    cur_static = getattr(current_module, "static_dir", static_dir)
    if os.path.isdir(cur_static):
        file_path = os.path.join(cur_static, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(cur_static, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
    return {"detail": "Not Found"}


