from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.orders.crud import list_orders_paginated
from app.modules.orders.schemas import (
    Order,
    OrderCreate,
    OrderStatus,
    OrdersResponse,
    MostPurchasedProductPaginatedResponse,
    ScheduledDeliveriesResponse,
)
from app.modules.orders.services import (
    AUTHORIZED_ORDER_STATUS_ROLES,
    create_order_service,
    get_order_status,
    report_unauthorized_order_status_attempt,
    get_top_purchased_products,
    get_top_institution_buyers,
    get_scheduled_deliveries_service,
)

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


@router.post("/", response_model=Order, status_code=201)
async def create_order_endpoint(payload: OrderCreate, db: Session = Depends(get_db)):
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
    summary="Obtener productos más comprados (Paginado)",
)
async def read_most_purchased_products(
    page: int = 1, limit: int = 20, db: Session = Depends(get_db)
):
    return await get_top_purchased_products(db=db, page=page, limit=limit)


@router.get(
    "/clientes/mas-compradores",
    response_model=MostPurchasedProductPaginatedResponse,
    summary="Obtener clientes (instituciones) que más han comprado (Paginado)",
)
async def read_top_institution_buyers(
    page: int = 1, limit: int = 20, db: Session = Depends(get_db)
):
    return await get_top_institution_buyers(db=db, page=page, limit=limit)


@router.get(
    "/entregas-programadas",
    response_model=ScheduledDeliveriesResponse,
    summary="Consulta de entregas programadas",
)
def get_scheduled_deliveries_endpoint(
    fecha: str = Query(..., description="Fecha en formato DD/MM/YYYY"),
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """
    Obtiene las entregas programadas (pedidos en estado 'pending')
    para una fecha específica.

    - **fecha**: Fecha en formato DD/MM/YYYY (ej: 15/11/2024)
    - **page**: Número de página (default: 1)
    - **limit**: Límite de resultados por página (default: 20)
    """
    try:
        # Parsear fecha en formato DD/MM/YYYY
        delivery_date = datetime.strptime(fecha, "%d/%m/%Y").date()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Formato de fecha inválido. Use DD/MM/YYYY (ej: 15/11/2024)",
        )

    return get_scheduled_deliveries_service(db, delivery_date, page, limit)


@router.get("/{order_id}", response_model=OrderStatus)
def get_order_endpoint(
    order_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str | None = Header(default=None, alias="X-User-Id"),
    user_role: str | None = Header(default=None, alias="X-User-Role"),
):
    """Get enriched order detail by ID with authorization and auditing."""

    normalized_role = user_role.lower() if user_role else None
    if normalized_role == "":
        normalized_role = None

    if normalized_role not in AUTHORIZED_ORDER_STATUS_ROLES:
        source_ip = request.client.host if request.client else None
        reason = (
            "Rol de usuario no proporcionado"
            if normalized_role is None
            else "Rol sin permiso"
        )
        report_unauthorized_order_status_attempt(
            order_id=order_id,
            user_id=user_id,
            user_role=user_role,
            source_ip=source_ip,
            reason=reason,
        )
        raise HTTPException(
            status_code=403,
            detail="No tiene permisos para consultar el estado del pedido.",
        )

    return get_order_status(db, order_id)
