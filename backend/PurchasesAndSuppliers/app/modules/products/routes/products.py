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






import os

INVENTORY_SERVICE_URL = "http://warehouse:8003/inventario/"







@router.get("/localizacion")
async def obtener_localizacion_producto(
    sku: str = Query(..., description="Product SKU to locate")
):
    """
    Devuelve la localización del producto (bodega y zona) basado en el SKU.
    Consulta el servicio de inventario en localhost:8003.
    """

    if not sku.strip():
        raise HTTPException(
            status_code=400,
            detail="Parámetro 'sku' es requerido y no puede estar vacío."
        )

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(INVENTORY_SERVICE_URL)

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Error al consultar el servicio de inventario.")

        data = response.json()
        inventarios = data.get("data", [])

        # Busca el producto por product_id
        for item in inventarios:
            if item.get("product_id") == sku:
                return {
                    "sku": sku,
                    "bodega": item.get("warehouse_id", ""),
                    "zona": item.get("storage_type", ""),  # puedes ajustar si tienes otro campo para zona
                    "encontrado": True
                }

        # Si no lo encontró
        return {
            "sku": sku,
            "bodega": "",
            "zona": "",
            "encontrado": False
        }

    except httpx.ConnectError:
        raise HTTPException(status_code=500, detail="No se pudo conectar al servicio de inventario.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

__all__ = ["router"]
