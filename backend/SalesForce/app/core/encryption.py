"""Utilities for encrypting sensitive data persisted in the database."""

from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
from dataclasses import dataclass
from functools import lru_cache
from typing import Final, Optional

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from sqlalchemy import literal
from sqlalchemy.types import String, TypeDecorator

from app.core.config import settings


DIGEST_SEPARATOR: Final[str] = ":"
HKDF_INFO: Final[bytes] = b"app-field-encryption"
HKDF_SALT: Final[bytes] = b"field-digest-v1"
DERIVED_KEY_LENGTH: Final[int] = 64


def _decode_master_key(encoded_key: str) -> bytes:
    """Decode the configured Fernet key into raw bytes."""

    try:
        return base64.urlsafe_b64decode(encoded_key.encode("utf-8"))
    except (binascii.Error, ValueError) as exc:  # pragma: no cover - configuration error
        raise ValueError(
            "FIELD_ENCRYPTION_KEY must be a urlsafe base64-encoded 32-byte key"
        ) from exc


@dataclass(frozen=True)
class FieldCipher:
    """Encapsulates encryption and deterministic digest helpers."""

    fernet: Fernet
    digest_key: bytes

    @classmethod
    def from_key(cls, encoded_key: str) -> "FieldCipher":
        """Build a cipher from the configured Fernet key."""

        raw_key = _decode_master_key(encoded_key)
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=DERIVED_KEY_LENGTH,
            salt=HKDF_SALT,
            info=HKDF_INFO,
        )
        derived_key = hkdf.derive(raw_key)
        encryption_key = base64.urlsafe_b64encode(derived_key[:32])
        digest_key = derived_key[32:]
        return cls(Fernet(encryption_key), digest_key)

    def encrypt(self, value: str) -> str:
        token = self.fernet.encrypt(value.encode("utf-8")).decode("utf-8")
        digest = self.digest(value)
        return f"{digest}{DIGEST_SEPARATOR}{token}"

    def decrypt(self, value: str) -> str:
        try:
            stored_digest, token = value.split(DIGEST_SEPARATOR, 1)
        except ValueError as exc:
            raise ValueError("Stored value does not contain a digest separator") from exc

        try:
            plaintext = self.fernet.decrypt(token.encode("utf-8")).decode("utf-8")
        except InvalidToken as exc:
            raise ValueError(
                "Unable to decrypt the stored value with the configured key"
            ) from exc

        if not hmac.compare_digest(stored_digest, self.digest(plaintext)):
            raise ValueError("Stored value digest does not match decrypted plaintext")

        return plaintext

    def digest(self, value: str) -> str:
        mac = hmac.new(self.digest_key, value.encode("utf-8"), hashlib.sha256)
        return base64.urlsafe_b64encode(mac.digest()).decode("utf-8")

    def lookup_pattern(self, value: str) -> str:
        return f"{self.digest(value)}{DIGEST_SEPARATOR}%"


@lru_cache
def _get_field_cipher() -> FieldCipher:
    """Return a cached :class:`FieldCipher` instance from the settings."""

    return FieldCipher.from_key(settings.field_encryption_key)


def encrypt_sensitive_value(value: Optional[str]) -> Optional[str]:
    """Return the encrypted representation of ``value`` when present."""

    if value is None:
        return None
    return _get_field_cipher().encrypt(value)


def decrypt_sensitive_value(value: Optional[str]) -> Optional[str]:
    """Return the decrypted representation of ``value`` when present."""

    if value is None:
        return None
    return _get_field_cipher().decrypt(value)


class EncryptedString(TypeDecorator):
    """SQLAlchemy type that transparently encrypts/decrypts string values."""

    impl = String
    cache_ok = True

    def __init__(self, length: Optional[int] = None) -> None:
        super().__init__(length)

    def process_bind_param(self, value: Optional[str], dialect):  # type: ignore[override]
        return encrypt_sensitive_value(value)

    def process_result_value(self, value: Optional[str], dialect):  # type: ignore[override]
        return decrypt_sensitive_value(value)

    class comparator_factory(TypeDecorator.Comparator):
        """Allow equality comparisons on encrypted fields."""

        def __eq__(self, other):  # type: ignore[override]
            if other is None:
                return self.expr.is_(None)
            return self.expr.like(literal(_get_field_cipher().lookup_pattern(other)))

