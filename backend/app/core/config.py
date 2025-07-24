from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # OpenAI Configuration
    openai_api_key: str
    
    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    
    # Database Configuration
    database_url: str = ""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Construct async database URL from Supabase URL if not provided
        if not self.database_url and self.supabase_url:
            # Convert Supabase URL to direct PostgreSQL connection
            # Format: postgresql+asyncpg://postgres:[password]@[host]:[port]/postgres
            # You'll need to get the direct DB connection details from Supabase
            self.database_url = os.getenv("DATABASE_URL", "")
    
    # FastAPI Configuration
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 5000
    
    # JWT Configuration
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    allowed_origins: list[str] = ["http://localhost:5173", "https://localhost:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()