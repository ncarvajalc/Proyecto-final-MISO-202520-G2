from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    TESTING: bool = False
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/user"

    def __init__(self, **values: object) -> None:
        super().__init__(**values)
        if self.TESTING:
            object.__setattr__(self, "DATABASE_URL", "sqlite:///./test.db")

    class Config:
        env_file = ".env"


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
