"""Order service layer for business logic."""
from datetime import date
from decimal import Decimal
from typing import Dict, List

import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.institutional_clients.crud import get_institutional_client_by_id
from app.modules.orders.crud import create_order_with_items
from app.modules.orders.schemas import OrderCreate

# Service URLs
PURCHASES_SUPPLIERS_URL = "http://purchases_suppliers:8001"
WAREHOUSE_URL = "http://warehouse:8003"

# Tax rate (19% IVA for Colombia)
TAX_RATE = Decimal("0.19")


async def validate_product(product_id: int) -> Dict:
    """Validate product exists and get product details from PurchasesAndSuppliers service."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            response = await client.get(
                f"{PURCHASES_SUPPLIERS_URL}/productos/{product_id}"
            )
            if response.status_code == 404:
                raise HTTPException(
                    status_code=404, detail=f"Product {product_id} not found"
                )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error communicating with product service: {str(e)}",
            )


async def validate_inventory(product_sku: str, quantity: int) -> bool:
    """Validate sufficient inventory exists for the product."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            response = await client.get(
                f"{WAREHOUSE_URL}/inventario/producto/{product_sku}/resumen"
            )
            if response.status_code == 404:
                # Product has no inventory
                return False
            response.raise_for_status()

            inventory_data = response.json()
            total_stock = inventory_data.get("total_quantity", 0)

            return total_stock >= quantity
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error communicating with inventory service: {str(e)}",
            )


def calculate_totals(items: List[Dict]) -> Dict[str, Decimal]:
    """Calculate subtotal, tax, and total amount for order."""
    subtotal = Decimal("0")

    for item in items:
        item_subtotal = Decimal(str(item["unit_price"])) * Decimal(str(item["quantity"]))
        item["subtotal"] = item_subtotal
        subtotal += item_subtotal

    tax_amount = subtotal * TAX_RATE
    total_amount = subtotal + tax_amount

    return {
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
    }


async def create_order_service(db: Session, order_create: OrderCreate):
    """
    Create a new order with validation.

    1. Validate institutional client exists
    2. Validate all products exist and get their details
    3. Validate sufficient inventory for all products
    4. Calculate totals
    5. Create order with items
    """
    # 1. Validate institutional client
    client = get_institutional_client_by_id(db, order_create.institutional_client_id)
    if not client:
        raise HTTPException(
            status_code=404,
            detail=f"Institutional client {order_create.institutional_client_id} not found",
        )

    # 2. Validate products and get details
    validated_items = []
    for item in order_create.items:
        product = await validate_product(item.product_id)

        # 3. Validate inventory using product SKU
        product_sku = product.get("sku")
        if not product_sku:
            raise HTTPException(
                status_code=400,
                detail=f"Product {product['nombre']} (ID: {item.product_id}) has no SKU",
            )

        has_stock = await validate_inventory(product_sku, item.quantity)
        if not has_stock:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient inventory for product {product['nombre']} (ID: {item.product_id}). Requested: {item.quantity}",
            )

        # Build validated item
        validated_items.append({
            "product_id": item.product_id,
            "product_name": product["nombre"],
            "quantity": item.quantity,
            "unit_price": Decimal(str(product.get("precio", item.unit_price))),
            "subtotal": Decimal("0"),  # Will be calculated
        })

    # 4. Calculate totals
    totals = calculate_totals(validated_items)

    # 5. Create order
    order = create_order_with_items(
        db=db,
        institutional_client_id=order_create.institutional_client_id,
        order_date=date.today(),
        subtotal=totals["subtotal"],
        tax_amount=totals["tax_amount"],
        total_amount=totals["total_amount"],
        status="pending",
        items=validated_items,
    )

    return order
