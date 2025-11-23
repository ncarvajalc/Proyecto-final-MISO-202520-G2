"""Inventory service for managing product stock."""

from typing import List
from sqlalchemy.orm import Session

from app.modules.inventory.models.inventory import Inventory
from app.modules.inventory.models.warehouse import Warehouse
from app.modules.inventory.schemas.inventory import ProductInventory, InventoryItem


def get_product_inventory(db: Session, product_id: int) -> ProductInventory:
    """
    Get inventory information for a specific product across all warehouses.

    Args:
        db: Database session
        product_id: Product ID to get inventory for

    Returns:
        ProductInventory with aggregated stock information
    """
    # Get all inventory records for this product
    inventory_records = (
        db.query(Inventory)
        .filter(Inventory.product_id == product_id)
        .all()
    )

    # Calculate total stock
    total_stock = sum(record.stock_quantity for record in inventory_records)

    # Build warehouse items list
    warehouse_items: List[InventoryItem] = []
    for record in inventory_records:
        warehouse_items.append(
            InventoryItem(
                warehouse=record.warehouse,
                stock_quantity=record.stock_quantity,
                available_quantity=record.available_quantity,
            )
        )

    return ProductInventory(
        product_id=product_id,
        total_stock=total_stock,
        warehouses=warehouse_items,
    )
