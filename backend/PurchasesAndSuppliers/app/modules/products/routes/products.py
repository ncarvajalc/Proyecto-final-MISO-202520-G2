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



@router.get("/localizacion-bodega")
async def obtener_localizacion_en_bodega(
    sku: str = Query(..., description="Product SKU to locate"),
    bodegaId: str = Query(..., description="Warehouse ID where to search")
):
    """
    Devuelve la localización del producto (bodega y zona) basado en el SKU y el ID de la bodega.
    Consulta el servicio de inventario en warehouse:8003.
    """

    if not sku.strip() or not bodegaId.strip():
        raise HTTPException(status_code=400, detail="Los parámetros 'sku' y 'bodegaId' son requeridos y no pueden estar vacíos.")

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(INVENTORY_SERVICE_URL)

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Error al consultar el servicio de inventario.")

        data = response.json()
        items = data.get("data", [])

        # Buscar producto en la bodega indicada
        producto_en_bodega = next(
            (item for item in items if item["product_id"] == sku and item["warehouse_id"] == bodegaId),
            None
        )

        # Si la bodega no existe
        if not any(item["warehouse_id"] == bodegaId for item in items):
            raise HTTPException(status_code=404, detail="Bodega no encontrada.")

        # Si el producto no está en la bodega
        if not producto_en_bodega:
            return {
                "sku": sku,
                "bodega": bodegaId,
                "zona": "",
                "encontrado": False
            }

        # Producto encontrado
        return {
            "sku": sku,
            "bodega": bodegaId,
            "zona": producto_en_bodega.get("storage_type", ""),
            "encontrado": True
        }

    except httpx.ConnectError:
        raise HTTPException(status_code=500, detail="No se pudo conectar al servicio de inventario.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")




__all__ = ["router"]
