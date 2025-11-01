"""Inventory API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.inventory.schemas.inventory import ProductInventory
from app.modules.inventory.services import inventory_service

router = APIRouter(prefix="/inventario", tags=["inventory"])


@router.get("/producto/{product_id}", response_model=ProductInventory)
def get_product_inventory(
    product_id: int,
    db: Session = Depends(get_db),
) -> ProductInventory:
    """
    Get inventory information for a specific product.

    Returns stock levels across all warehouses for the given product.
    """
    try:
        return inventory_service.get_product_inventory(db, product_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
