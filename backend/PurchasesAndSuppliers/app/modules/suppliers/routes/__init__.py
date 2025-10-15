"""Suppliers routes package."""

from .bulk_upload import router as bulk_upload_router
from .registration import router as registration_router

__all__ = ["bulk_upload_router", "registration_router"]
