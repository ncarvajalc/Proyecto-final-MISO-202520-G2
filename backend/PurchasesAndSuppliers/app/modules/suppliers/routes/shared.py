"""Shared router for suppliers endpoints."""

from fastapi import APIRouter

router = APIRouter(prefix="/proveedores", tags=["proveedores"])

__all__ = ["router"]
