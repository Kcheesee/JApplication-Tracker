from pydantic_settings import BaseSettings
from pydantic import field_validator, ValidationError
from functools import lru_cache
import sys
import logging

logger = logging.getLogger(__name__)

# Insecure default values that MUST be changed in production
INSECURE_DEFAULTS = [
    "your-secret-key-change-in-production",
    "change-this-in-production",
    "your-encryption-key-here-generate-new-one",
    "your-secret-key-here-change-this-in-production"
]


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/jobtracker"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT Authentication
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Encryption for API Keys
    ENCRYPTION_KEY: str = ""

    # Environment
    ENVIRONMENT: str = "development"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Email (optional)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # LLM Provider Configuration
    DEFAULT_LLM_PROVIDER: str = "anthropic"
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        """Ensure SECRET_KEY is set and secure in production"""
        if not v or len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")

        # Check if we're in production
        environment = info.data.get('ENVIRONMENT', 'development')
        if environment == 'production' and v in INSECURE_DEFAULTS:
            raise ValueError(
                "SECRET_KEY must be changed from default value in production! "
                "Generate a secure key with: openssl rand -hex 32"
            )

        return v

    @field_validator('ENCRYPTION_KEY')
    @classmethod
    def validate_encryption_key(cls, v: str, info) -> str:
        """Ensure ENCRYPTION_KEY is set properly"""
        if not v:
            logger.warning(
                "ENCRYPTION_KEY not set. API key encryption will fail. "
                "Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
            )
            return v

        environment = info.data.get('ENVIRONMENT', 'development')
        if environment == 'production' and v in INSECURE_DEFAULTS:
            raise ValueError(
                "ENCRYPTION_KEY must be changed from default value in production! "
                "Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
            )

        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance with validation"""
    try:
        settings = Settings()
        logger.info(f"Settings loaded successfully. Environment: {settings.ENVIRONMENT}")
        return settings
    except ValidationError as e:
        logger.error(f"Configuration validation failed: {e}")
        print(f"\n{'='*60}")
        print("CONFIGURATION ERROR - Application cannot start")
        print(f"{'='*60}")
        print(f"\n{e}\n")
        print("Please check your environment variables and try again.")
        print(f"{'='*60}\n")
        sys.exit(1)
