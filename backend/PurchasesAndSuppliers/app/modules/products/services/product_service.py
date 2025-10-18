"""Service layer for product operations."""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.pagination import build_pagination_metadata, get_pagination_offset

from ..crud.crud_product import (
    create_product,
    get_product_by_sku,
    get_products_all,
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


__all__ = ["create", "read"]
