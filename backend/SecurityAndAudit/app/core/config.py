from pydantic_settings import BaseSettings

import os


class Settings(BaseSettings):
    DATABASE_URL: str = (
        os.getenv("TESTING", "0") == "1"
        and "sqlite:///./test.db"
        or os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/user")
    )

    # JWT Configuration for authentication
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
