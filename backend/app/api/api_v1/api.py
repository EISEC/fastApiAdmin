from fastapi import APIRouter
from app.api.api_v1.endpoints import admin

api_router = APIRouter()
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

# Здесь можно добавить другие роутеры, например:
# from app.api.endpoints import items, users
# api_router.include_router(items.router, prefix="/items", tags=["items"])
# api_router.include_router(users.router, prefix="/users", tags=["users"]) 