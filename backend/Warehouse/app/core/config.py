from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Warehouse service configuration."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    testing: bool = Field(False, alias="TESTING")
    database_url: str = Field(
        "postgresql://user:password@localhost:5432/user", alias="DATABASE_URL"
    )
    test_database_url: str = Field(
        "sqlite:///./test.db", alias="TEST_DATABASE_URL"
    )

    @property
    def DATABASE_URL(self) -> str:  # noqa: N802 - maintain uppercase attribute access
        return self.test_database_url if self.testing else self.database_url


settings = Settings()