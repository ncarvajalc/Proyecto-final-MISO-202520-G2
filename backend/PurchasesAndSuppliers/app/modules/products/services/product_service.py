"""Service layer for product operations."""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.pagination import build_pagination_metadata, get_pagination_offset

from ..crud.crud_product import (
    create_product,
    get_product,
    get_product_by_sku,
    get_products_all,
    get_products_by_ids,
)
from ..models.bulk_products import Product
from ..schemas.product import ProductCreate


def _serialize_product(product: Product) -> Dict[str, Any]:
    """Convert Product ORM instance to dict for API response."""
    # Serialize specifications
    especificaciones = [
        {"nombre": spec.name, "valor": spec.value} for spec in product.specifications
    ]

    # Serialize technical sheet
    hoja_tecnica = None
    if product.technical_sheets:
        sheet = product.technical_sheets[0]  # Take first one
        hoja_tecnica = {
            "urlManual": sheet.user_manual_url,
            "urlHojaInstalacion": sheet.installation_guide_url,
            "certificaciones": (
                sheet.certifications.split(",") if sheet.certifications else []
            ),
        }

    return {
        "id": product.id,
        "sku": product.sku,
        "nombre": product.nombre,
        "descripcion": product.descripcion,
        "precio": product.precio,
        "activo": product.activo,
        "especificaciones": especificaciones,
        "hojaTecnica": hoja_tecnica,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


def create(db: Session, product: ProductCreate) -> Dict[str, Any]:
    """Create a new product with business validations."""
    # Validate SKU uniqueness
    existing = get_product_by_sku(db, sku=product.sku)
    if existing:
        raise HTTPException(
            status_code=409, detail=f"Product with SKU '{product.sku}' already exists"
        )

    db_product = create_product(db, product=product)
    return _serialize_product(db_product)


def read(db: Session, page: int = 1, limit: int = 10) -> Dict[str, Any]:
    """List products with pagination."""
    skip = get_pagination_offset(page, limit)
    result = get_products_all(db, skip=skip, limit=limit)
    total = result["total"]
    products = result["products"]
    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    # Serialize products
    serialized_products = [_serialize_product(p) for p in products]

    return {"data": serialized_products, **metadata}


def read_by_id(db: Session, product_id: int) -> Dict[str, Any]:
    """Get a single product by ID."""
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return _serialize_product(product)


def read_by_ids(db: Session, product_ids: List[int]) -> Dict[str, Any]:
    """Get multiple products by a list of IDs."""
    if not product_ids:
        raise HTTPException(
            status_code=400, detail="At least one product ID is required"
        )
    
    products = get_products_by_ids(db, product_ids)
    if not products:
        raise HTTPException(status_code=404, detail="No products found for the given IDs")
    
    # Serialize products
    serialized_products = [_serialize_product(p) for p in products]
    return {"data": serialized_products, "total": len(serialized_products)}


__all__ = ["create", "read", "read_by_id", "read_by_ids"]
