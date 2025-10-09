from pydantic_settings import BaseSettings

import os

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("TESTING", "0") == "1" and "sqlite:///./test.db" or os.getenv("DATABASE_URL","postgresql://user:password@localhost:5432/user")

    class Config:
        env_file = ".env"

settings = Settings()