from app.routers.auth import router as auth_router
from app.routers.pantry import router as pantry_router
from app.routers.recipes import router as recipes_router
from app.routers.shopping import router as shopping_router
from app.routers.catalog import router as catalog_router
from app.routers.matches import router as matches_router
from app.routers.cook import router as cook_router

__all__ = [
    "auth_router",
    "pantry_router",
    "recipes_router",
    "shopping_router",
    "catalog_router",
    "matches_router",
    "cook_router",
]
