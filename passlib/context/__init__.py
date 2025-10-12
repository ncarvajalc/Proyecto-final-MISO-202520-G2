"""Context module providing a lightweight CryptContext implementation."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from typing import Iterable, List

__all__ = ["CryptContext"]


@dataclass
class CryptContext:
    schemes: List[str]
    deprecated: str = "auto"

    def __init__(self, schemes: Iterable[str] | None = None, deprecated: str = "auto") -> None:
        self.schemes = list(schemes or ["bcrypt"])
        self.deprecated = deprecated

    def hash(self, password: str) -> str:
        salt = secrets.token_hex(8)
        digest = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
        return f"fakebcrypt${salt}${digest}"

    def verify(self, password: str, hashed: str) -> bool:
        try:
            _prefix, salt, digest = hashed.split("$", 2)
        except ValueError:
            return False
        expected = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
        return hmac.compare_digest(expected, digest)
