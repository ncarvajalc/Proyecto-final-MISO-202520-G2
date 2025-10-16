from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    TESTING: bool = False
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/user"
    TEST_DATABASE_URL: str = "sqlite:///./test.db"

    def __init__(self, **values: object) -> None:
        super().__init__(**values)
        if self.TESTING:
            object.__setattr__(self, "DATABASE_URL", self.TEST_DATABASE_URL)


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
