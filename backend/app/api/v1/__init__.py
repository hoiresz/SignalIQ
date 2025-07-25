from fastapi import APIRouter

from app.api.v1.endpoints import leads, health, auth, conversations, users, openai

api_router = APIRouter(prefix="/v1")

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(openai.router, prefix="/openai", tags=["openai"])