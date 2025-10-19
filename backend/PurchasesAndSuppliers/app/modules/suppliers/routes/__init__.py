"""Suppliers routes package."""

from .shared import router

# Import submodules so they register their endpoints on the shared router.
from . import bulk_upload as _bulk_upload  # noqa: F401
from . import registration as _registration  # noqa: F401

__all__ = ["router"]
