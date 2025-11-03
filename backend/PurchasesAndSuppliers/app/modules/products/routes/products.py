"""Routes for individual product operations."""

from __future__ import annotations
import os
import traceback
from fastapi import APIRouter, Depends, status, HTTPException, Query
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


INVENTORY_SERVICE_URL = os.getenv(
    "INVENTORY_SERVICE_URL", "http://warehouse:8003/inventario/"
)
WAREHOUSE_SERVICE_URL = os.getenv(
    "WAREHOUSE_SERVICE_URL", "http://warehouse:8003/bodegas/"
)


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
            detail="Parámetro 'sku' es requerido y no puede estar vacío.",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            inventory_response = await client.get(INVENTORY_SERVICE_URL)

            if inventory_response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error al consultar el servicio de inventario.",
                )

            inventory_data = inventory_response.json()
            inventarios = inventory_data.get("data", [])

            # Busca el producto por product_id
            for item in inventarios:
                if item.get("product_id") == sku:
                    warehouse_id = item.get("warehouse_id", "")

                    # Fetch warehouse name
                    warehouse_name = warehouse_id
                    if warehouse_id:
                        try:
                            warehouse_response = await client.get(
                                f"{WAREHOUSE_SERVICE_URL}{warehouse_id}"
                            )
                            if warehouse_response.status_code == 200:
                                warehouse_data = warehouse_response.json()
                                warehouse_name = warehouse_data.get(
                                    "nombre", warehouse_id
                                )
                        except Exception:
                            # If warehouse fetch fails, use ID as fallback
                            warehouse_name = warehouse_id

                    return {
                        "sku": sku,
                        "bodega": warehouse_name,
                        "zona": item.get("zona", ""),
                        "encontrado": True,
                    }

            # Si no lo encontró
            return {"sku": sku, "bodega": "", "zona": "", "encontrado": False}

    except httpx.ConnectError:
        raise HTTPException(
            status_code=500, detail="No se pudo conectar al servicio de inventario."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}, {traceback.format_exc()}",
        )


@router.get("/localizacion-bodega")
async def obtener_localizacion_en_bodega(
    sku: str = Query(..., description="Product SKU to locate"),
    bodegaId: str = Query(..., description="Warehouse ID where to search"),
):
    """
    Devuelve la localización del producto (bodega y zona) basado en el SKU y el ID de la bodega.
    Consulta el servicio de inventario en warehouse:8003.
    """

    if not sku.strip() or not bodegaId.strip():
        raise HTTPException(
            status_code=400,
            detail="Los parámetros 'sku' y 'bodegaId' son requeridos y no pueden estar vacíos.",
        )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Fetch inventory data
            inventory_response = await client.get(INVENTORY_SERVICE_URL)

            if inventory_response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail="Error al consultar el servicio de inventario.",
                )

            # Fetch warehouse name
            warehouse_response = await client.get(f"{WAREHOUSE_SERVICE_URL}{bodegaId}")

            if warehouse_response.status_code == 404:
                raise HTTPException(status_code=404, detail="Bodega no encontrada.")
            elif warehouse_response.status_code != 200:
                raise HTTPException(
                    status_code=500, detail="Error al consultar el servicio de bodegas."
                )

        inventory_data = inventory_response.json()
        items = inventory_data.get("data", [])

        warehouse_data = warehouse_response.json()
        warehouse_name = warehouse_data.get("nombre", bodegaId)

        # Buscar producto en la bodega indicada
        producto_en_bodega = next(
            (
                item
                for item in items
                if item["product_id"] == sku and item["warehouse_id"] == bodegaId
            ),
            None,
        )

        # Si el producto no está en la bodega
        if not producto_en_bodega:
            return {
                "sku": sku,
                "bodega": warehouse_name,
                "zona": "",
                "encontrado": False,
            }

        # Producto encontrado
        return {
            "sku": sku,
            "bodega": warehouse_name,
            "zona": producto_en_bodega.get("zona", ""),
            "encontrado": True,
        }

    except httpx.ConnectError:
        raise HTTPException(
            status_code=500, detail="No se pudo conectar al servicio de inventario."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error interno del servidor: {str(e)}"
        )


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID."""
    return product_service.read_by_id(db, product_id)


__all__ = ["router"]
