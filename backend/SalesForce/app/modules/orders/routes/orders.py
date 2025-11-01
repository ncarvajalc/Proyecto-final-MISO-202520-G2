from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.orders.crud import get_order_by_id, list_orders_paginated
from app.modules.orders.schemas import Order, OrderCreate, OrdersResponse
from app.modules.orders.services import create_order_service

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


@router.get("/{order_id}", response_model=Order)
def get_order_endpoint(order_id: int, db: Session = Depends(get_db)):
    """Get order by ID."""
    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order
