from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with support for test overrides."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    testing: bool = Field(False, alias="TESTING")
    database_url: str = Field(
        "postgresql://user:password@localhost:5432/user", alias="DATABASE_URL"
    )
    test_database_url: str = Field(
        "sqlite:///./test.db", alias="TEST_DATABASE_URL"
    )
    field_encryption_key: str = Field(
        "AAgM6AyfPJuvK2pFJu8KLd43NcSixmzKBf2eMS8kynk=",
        alias="FIELD_ENCRYPTION_KEY",
    )

    @property
    def DATABASE_URL(self) -> str:  # noqa: N802 - preserve public attribute name
        """Return the appropriate database URL for the current environment."""

        return self.test_database_url if self.testing else self.database_url


settings = Settings()
