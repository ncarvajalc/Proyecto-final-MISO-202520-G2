from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.orders.crud import list_orders_paginated
from app.modules.orders.schemas import (
    Order,
    OrderCreate,
    OrderStatus,
    OrdersResponse,
    MostPurchasedProductPaginatedResponse,
)
from app.modules.orders.services import (
    create_order_service,
    get_order_status,
    get_top_purchased_products,
    get_top_institution_buyers,
)

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


@router.post("/", response_model=Order, status_code=201)
async def create_order_endpoint(
    payload: OrderCreate, db: Session = Depends(get_db)
):
    """Create a new order with validation."""
    return await create_order_service(db, payload)


@router.get("/", response_model=OrdersResponse)
def list_orders_endpoint(
    page: int = 1,
    limit: int = 20,
    institutional_client_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all orders with pagination and optional filtering by client."""
    skip = (page - 1) * limit
    result = list_orders_paginated(
        db, skip=skip, limit=limit, institutional_client_id=institutional_client_id
    )

    total_pages = (result["total"] + limit - 1) // limit

    return OrdersResponse(
        data=result["items"],
        total=result["total"],
        page=page,
        limit=limit,
        total_pages=total_pages,
    )

@router.get(
    "/productos/mas-comprados", 
    response_model=MostPurchasedProductPaginatedResponse,
    summary="Obtener productos más comprados (Paginado)"
)
async def read_most_purchased_products(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    return await get_top_purchased_products(db=db, page=page, limit=limit)

@router.get(
    "/clientes/mas-compradores",
    response_model=MostPurchasedProductPaginatedResponse,
    summary="Obtener clientes (instituciones) que más han comprado (Paginado)"
)
async def read_top_institution_buyers(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    return await get_top_institution_buyers(db=db, page=page, limit=limit)

@router.get("/{order_id}", response_model=OrderStatus)
def get_order_endpoint(order_id: int, db: Session = Depends(get_db)):
    """Get enriched order detail by ID."""
    return get_order_status(db, order_id)
