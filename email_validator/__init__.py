"""Minimal email validation utilities compatible with pydantic."""

from __future__ import annotations

import re
from dataclasses import dataclass

__all__ = ["EmailNotValidError", "validate_email"]


class EmailNotValidError(ValueError):
    """Exception raised when an email address fails validation."""


@dataclass
class ValidatedEmail:
    email: str
    local: str
    domain: str

    @property
    def normalized(self) -> str:
        return f"{self.local}@{self.domain}"

    @property
    def local_part(self) -> str:
        return self.local

    @property
    def ascii_email(self) -> str:
        return self.normalized

    def __iter__(self):
        yield self.email
        yield self.normalized


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(email: str, *_, **__) -> ValidatedEmail:
    if not isinstance(email, str) or not _EMAIL_RE.match(email):
        raise EmailNotValidError("Invalid email address format")
    local, domain = email.split("@", 1)
    return ValidatedEmail(email=email, local=local, domain=domain)
