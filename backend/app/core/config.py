from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # OpenAI Configuration
    openai_api_key: str
    
    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: str
    
    # FastAPI Configuration
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 5000
    
    # CORS
    allowed_origins: list[str] = ["http://localhost:5173", "https://localhost:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()