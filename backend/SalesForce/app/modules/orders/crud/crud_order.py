from typing import Optional, List, Dict, Any
from datetime import date

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, select

from app.modules.orders.models import Order, OrderItem
from app.modules.institutional_clients.models import InstitutionalClient


def list_orders_paginated(
    db: Session, skip: int, limit: int, institutional_client_id: Optional[str] = None
):
    """List all orders with pagination and optional filtering by client."""
    query = (
        db.query(Order)
        .options(joinedload(Order.items))
        .order_by(Order.created_at.desc())
    )

    if institutional_client_id:
        query = query.filter(Order.institutional_client_id == institutional_client_id)

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total}


def get_order_by_id(db: Session, order_id: int):
    """Get order by ID with items."""
    return (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.institutional_client),
        )
        .filter(Order.id == order_id)
        .first()
    )


def create_order_with_items(
    db: Session,
    institutional_client_id: str,
    order_date,
    subtotal,
    tax_amount,
    total_amount,
    status: str,
    items: list,
):
    """Create a new order with items (called from service layer)."""
    # Create order
    db_order = Order(
        institutional_client_id=institutional_client_id,
        order_date=order_date,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        status=status,
    )
    db.add(db_order)
    db.flush()  # Get the order ID without committing

    # Create order items
    for item in items:
        db_item = OrderItem(
            order_id=db_order.id,
            product_id=item["product_id"],
            product_name=item["product_name"],
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            subtotal=item["subtotal"],
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_order)
    return db_order


def update_order_status(db: Session, order_id: int, status: str):
    """Update order status."""
    db_order = get_order_by_id(db, order_id)
    if not db_order:
        return None

    db_order.status = status
    db.commit()
    db.refresh(db_order)
    return db_order


def get_most_purchased_products(db: Session, page: int, limit: int) -> Dict[str, Any]:
    """
    Obtiene los productos más comprados (paginado)
    """
    # para ranquear precios por fecha
    ranked_items_cte = (
        select(
            OrderItem.product_id,
            OrderItem.unit_price,
            func.row_number()
            .over(
                partition_by=OrderItem.product_id,
                order_by=Order.order_date.desc(),
            )
            .label("rn"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .cte("ranked_items")
    )

    # filtrar solo el precio más reciente
    latest_price_cte = (
        select(
            ranked_items_cte.c.product_id,
            ranked_items_cte.c.unit_price.label("current_unit_price"),
        )
        .where(ranked_items_cte.c.rn == 1)
        .cte("latest_price")
    )

    # subconsulta principal para agregación
    main_aggregation_sq = (
        select(
            OrderItem.product_id,
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("total_quantity_sold"),
            func.string_agg(
                func.distinct(InstitutionalClient.nombre_institucion), ","
            ).label("institutions"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .join(
            InstitutionalClient,
            InstitutionalClient.id == Order.institutional_client_id,
        )
        .group_by(OrderItem.product_id, OrderItem.product_name)
        .subquery("main_aggregation")
    )

    # consulta base
    base_query = select(
        main_aggregation_sq.c.product_id,
        main_aggregation_sq.c.product_name,
        latest_price_cte.c.current_unit_price,
        main_aggregation_sq.c.total_quantity_sold,
        main_aggregation_sq.c.institutions,
    ).join(
        latest_price_cte,
        main_aggregation_sq.c.product_id == latest_price_cte.c.product_id,
    )

    # obtener el CONTEO TOTAL de productos únicos
    total_query = select(func.count()).select_from(base_query.alias())
    total = db.execute(total_query).scalar() or 0

    skip = (page - 1) * limit

    # consulta final
    final_query = (
        base_query.order_by(desc(main_aggregation_sq.c.total_quantity_sold))
        .offset(skip)
        .limit(limit)
    )

    # ejecutar y devolver resultados
    items = db.execute(final_query).all()

    return {"items": items, "total": total}


def get_top_institution_buyer_products(
    db: Session, page: int, limit: int
) -> Dict[str, Any]:
    """
    Obtiene los productos comprados por las instituciones que más han comprado (paginado).
    """
    # identificar las TOP instituciones por cantidad total comprada
    top_institutions_sq = (
        select(
            Order.institutional_client_id,
            func.sum(OrderItem.quantity).label("total_by_institution"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .group_by(Order.institutional_client_id)
        .order_by(desc(func.sum(OrderItem.quantity)))
        .limit(10)
        .subquery("top_institutions")
    )

    # para ranquear precios por fecha
    ranked_items_cte = (
        select(
            OrderItem.product_id,
            OrderItem.unit_price,
            func.row_number()
            .over(
                partition_by=OrderItem.product_id,
                order_by=Order.order_date.desc(),
            )
            .label("rn"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .join(
            top_institutions_sq,
            Order.institutional_client_id
            == top_institutions_sq.c.institutional_client_id,
        )
        .cte("ranked_items")
    )

    # filtrar solo el precio más reciente
    latest_price_cte = (
        select(
            ranked_items_cte.c.product_id,
            ranked_items_cte.c.unit_price.label("current_unit_price"),
        )
        .where(ranked_items_cte.c.rn == 1)
        .cte("latest_price")
    )

    # subconsulta principal para agregación de productos de top instituciones
    main_aggregation_sq = (
        select(
            OrderItem.product_id,
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("total_quantity_sold"),
            func.string_agg(
                func.distinct(InstitutionalClient.nombre_institucion), ","
            ).label("institutions"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .join(
            InstitutionalClient,
            InstitutionalClient.id == Order.institutional_client_id,
        )
        .join(
            top_institutions_sq,
            Order.institutional_client_id
            == top_institutions_sq.c.institutional_client_id,
        )
        .group_by(OrderItem.product_id, OrderItem.product_name)
        .subquery("main_aggregation")
    )

    # consulta base
    base_query = select(
        main_aggregation_sq.c.product_id,
        main_aggregation_sq.c.product_name,
        latest_price_cte.c.current_unit_price,
        main_aggregation_sq.c.total_quantity_sold,
        main_aggregation_sq.c.institutions,
    ).join(
        latest_price_cte,
        main_aggregation_sq.c.product_id == latest_price_cte.c.product_id,
    )

    # obtener el CONTEO TOTAL de productos únicos de top instituciones
    total_query = select(func.count()).select_from(base_query.alias())
    total = db.execute(total_query).scalar() or 0

    skip = (page - 1) * limit

    # consulta final ordenada por cantidad total comprada
    final_query = (
        base_query.order_by(desc(main_aggregation_sq.c.total_quantity_sold))
        .offset(skip)
        .limit(limit)
    )

    # ejecutar y devolver resultados
    items = db.execute(final_query).all()

    return {"items": items, "total": total}


def get_scheduled_deliveries_by_date(
    db: Session, delivery_date: date, skip: int, limit: int
) -> Dict[str, Any]:
    """
    Obtiene las entregas programadas para una fecha específica con estado 'pending'.
    """
    query = (
        db.query(Order)
        .options(joinedload(Order.institutional_client))
        .filter(Order.order_date == delivery_date)
        .filter(Order.status == "pending")
        .order_by(Order.created_at.desc())
    )

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total}
