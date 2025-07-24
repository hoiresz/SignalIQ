from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.v1 import api_router
from app.core.config import settings
from app.db.session import init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up SignalIQ FastAPI backend...")
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    yield
    # Shutdown
    logger.info("Shutting down SignalIQ FastAPI backend...")


app = FastAPI(
    title="SignalIQ API",
    description="B2B Lead Generation API with OpenAI integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "SignalIQ API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SignalIQ API"}