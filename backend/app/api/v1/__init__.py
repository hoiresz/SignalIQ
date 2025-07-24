from fastapi import APIRouter

from app.api.v1.endpoints import leads, health, auth

api_router = APIRouter(prefix="/v1")

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])