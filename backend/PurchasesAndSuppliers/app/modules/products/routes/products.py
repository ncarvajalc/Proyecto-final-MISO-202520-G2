"""Routes for individual product operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status,HTTPException, Query
import httpx
from sqlalchemy.orm import Session

from app.core.database import get_db

from ..schemas.product import ProductCreate
from ..services import product_service

router = APIRouter(prefix="/productos", tags=["products"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new individual product."""
    return product_service.create(db, product)


@router.get("/")
def list_products(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    """List products with pagination."""
    return product_service.read(db, page=page, limit=limit)


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID."""
    return product_service.read_by_id(db, product_id)


__all__ = ["router"]
