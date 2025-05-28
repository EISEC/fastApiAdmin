from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, roles, sites, pages, posts, dynamic_models

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(sites.router, prefix="/sites", tags=["sites"])
api_router.include_router(pages.router, prefix="/pages", tags=["pages"])
api_router.include_router(posts.router, prefix="/posts", tags=["posts"])
api_router.include_router(dynamic_models.router, prefix="/dynamic-models", tags=["dynamic-models"]) 