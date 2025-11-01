from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.modules.orders.models import Order, OrderItem


def list_orders_paginated(
    db: Session, skip: int, limit: int, institutional_client_id: Optional[str] = None
):
    """List all orders with pagination and optional filtering by client."""
    query = db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc())

    if institutional_client_id:
        query = query.filter(Order.institutional_client_id == institutional_client_id)

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"items": items, "total": total}


def get_order_by_id(db: Session, order_id: int):
    """Get order by ID with items."""
    return (
        db.query(Order)
        .options(joinedload(Order.items))
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
