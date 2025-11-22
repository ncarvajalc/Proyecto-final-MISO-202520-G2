"""Order service layer for business logic."""

import logging
import os
from datetime import date
from decimal import Decimal
from typing import Dict, List

import math
import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.institutional_clients.crud import get_institutional_client_by_id
from app.modules.orders.crud import (
    create_order_with_items,
    get_most_purchased_products,
    get_order_by_id,
    get_top_institution_buyer_products,
    get_scheduled_deliveries_by_date,
)
from app.modules.orders.schemas import (
    OrderCreate,
    MostPurchasedProduct,
    MostPurchasedProductPaginatedResponse,
    OrderStatus,
    OrderStatusProduct,
    ScheduledDelivery,
    ScheduledDeliveriesResponse,
)


# Service URLs
PURCHASES_SUPPLIERS_URL = "http://purchases_suppliers:8001"
WAREHOUSE_URL = "http://warehouse:8003"
SECURITY_AUDIT_URL = os.getenv("SECURITY_AUDIT_URL", "http://security_audit:8000")

AUTHORIZED_ORDER_STATUS_ROLES = {"admin", "operator", "operador"}

logger = logging.getLogger(__name__)

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


async def validate_inventory(product_id: int, quantity: int) -> bool:
    """Validate sufficient inventory exists for the product."""
    # First, get product SKU from products service
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            # Get product to obtain SKU
            product_response = await client.get(
                f"{PURCHASES_SUPPLIERS_URL}/productos/{product_id}"
            )
            product_response.raise_for_status()
            product_data = product_response.json()
            product_sku = product_data.get("sku")

            if not product_sku:
                return False

            # Get inventory using SKU (old system returns list of inventory items)
            inventory_response = await client.get(
                f"{WAREHOUSE_URL}/inventario/producto/{product_sku}"
            )
            if inventory_response.status_code == 404:
                # Product has no inventory
                return False
            inventory_response.raise_for_status()

            inventory_list = inventory_response.json()
            # Old system returns a list, calculate total from all warehouses
            if isinstance(inventory_list, list):
                total_stock = sum(item.get("quantity", 0) for item in inventory_list)
            else:
                # Fallback for new system format (shouldn't happen)
                total_stock = inventory_list.get("total_stock", 0)

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
        item_subtotal = Decimal(str(item["unit_price"])) * Decimal(
            str(item["quantity"])
        )
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

        # 3. Validate inventory
        has_stock = await validate_inventory(item.product_id, item.quantity)
        if not has_stock:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient inventory for product {product['nombre']} (ID: {item.product_id}). Requested: {item.quantity}",
            )

        # Build validated item
        validated_items.append(
            {
                "product_id": item.product_id,
                "product_name": product["nombre"],
                "quantity": item.quantity,
                "unit_price": Decimal(str(product.get("precio", item.unit_price))),
                "subtotal": Decimal("0"),  # Will be calculated
            }
        )

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


def summarize_order(order) -> OrderStatus:
    """Construye el resumen de estado para un pedido existente."""

    if order is None:
        raise ValueError("order is required")

    client = getattr(order, "institutional_client", None)
    client_name = (
        getattr(client, "nombre_institucion", None) if client is not None else None
    )

    items: List[OrderStatusProduct] = []
    total_units = 0
    for item in getattr(order, "items", []) or []:
        quantity = int(getattr(item, "quantity", 0) or 0)
        total_units += quantity
        items.append(
            OrderStatusProduct(
                product_id=int(getattr(item, "product_id")),
                product_name=str(getattr(item, "product_name")),
                unit="unidad",
                quantity=quantity,
                unit_price=Decimal(str(getattr(item, "unit_price"))),
                total_price=Decimal(str(getattr(item, "subtotal"))),
            )
        )

    return OrderStatus(
        id=int(getattr(order, "id")),
        order_number=str(getattr(order, "id")),
        institutional_client_id=str(getattr(order, "institutional_client_id")),
        client_name=str(client_name or getattr(order, "institutional_client_id")),
        order_date=getattr(order, "order_date"),
        status=str(getattr(order, "status")),
        subtotal=Decimal(str(getattr(order, "subtotal"))),
        tax_amount=Decimal(str(getattr(order, "tax_amount"))),
        total_amount=Decimal(str(getattr(order, "total_amount"))),
        product_count=len(items),
        total_units=total_units,
        items=items,
    )


def report_unauthorized_order_status_attempt(
    order_id: int,
    user_id: str | None,
    user_role: str | None,
    source_ip: str | None,
    reason: str,
):
    payload = {
        "order_id": str(order_id),
        "user_id": user_id,
        "user_role": user_role,
        "source_ip": source_ip,
        "reason": reason,
    }

    audit_url = f"{SECURITY_AUDIT_URL.rstrip('/')}/audit/alerts/unauthorized-order-status"

    try:
        httpx.post(audit_url, json=payload, timeout=1.5)
    except Exception as exc:  # noqa: BLE001 - we need to swallow all issues to avoid blocking
        logger.warning(
            "Failed to report unauthorized order status attempt: %s", exc,
        )


def get_order_status(db: Session, order_id: int) -> OrderStatus:
    """Recupera un pedido y retorna su resumen de estado."""

    order = get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    return summarize_order(order)


async def get_top_purchased_products(
    db: Session, page: int, limit: int
) -> List[MostPurchasedProduct]:
    """
    obtener el reporte de productos más comprados.
    """
    crud_result = get_most_purchased_products(db, page=page, limit=limit)

    items_rows = crud_result["items"]
    total_count = crud_result["total"]

    # Obtener datos de precios desde el servicio de productos
    product_data_list = []
    price_map = {}
    image_map = {}

    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            product_ids = [row.product_id for row in items_rows]
            if product_ids:
                product_response = await client.post(
                    f"{PURCHASES_SUPPLIERS_URL}/productos/by-ids",
                    json={"product_ids": product_ids},
                )
                product_response.raise_for_status()
                product_data = product_response.json()
                product_data_list = product_data.get("data", [])

                # Construir mapa de precios: {id: precio}
                for product in product_data_list:
                    price_map[product["id"]] = Decimal(str(product.get("precio", 0)))
                    image_map[product["id"]] = str(product.get("imagen", None))

        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error communicating with product service: {str(e)}",
            )

    # Mapear items_rows a MostPurchasedProduct con precios y URLs de imagen
    items_schemas = []
    for row in items_rows:
        product_id = row.product_id
        product_name = row.product_name

        # Obtener precio desde product_data (comparando IDs)
        current_price = price_map.get(product_id, Decimal("0"))

        # Construir URL de imagen con nombre del producto (espacios → +)
        url_imagen_text = product_name.replace(" ", "+")
        url_imagen = (
            f"https://placehold.co/600x400/eeeeee/999999?text={url_imagen_text}"
        )

        # Crear objeto MostPurchasedProduct
        item = MostPurchasedProduct(
            product_id=product_id,
            product_name=product_name,
            current_unit_price=current_price,
            total_quantity_sold=row.total_quantity_sold or 0,
            institutions=row.institutions or "",
            url_imagen=url_imagen,
        )
        items_schemas.append(item)

    # calcular total_pages
    total_pages = 0
    if total_count > 0 and limit > 0:
        total_pages = math.ceil(total_count / limit)
    elif total_count == 0:
        total_pages = 0
    else:
        total_pages = 1

    # construir la respuesta paginada final
    return MostPurchasedProductPaginatedResponse(
        items=items_schemas,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


async def get_top_institution_buyers(
    db: Session, page: int, limit: int
) -> MostPurchasedProductPaginatedResponse:
    """
    Obtener productos comprados por las instituciones que más han comprado.
    """
    crud_result = get_top_institution_buyer_products(db, page=page, limit=limit)

    items_rows = crud_result["items"]
    total_count = crud_result["total"]

    # Obtener datos de precios desde el servicio de productos
    product_data_list = []
    price_map = {}
    image_map = {}

    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            product_ids = [row.product_id for row in items_rows]
            if product_ids:
                product_response = await client.post(
                    f"{PURCHASES_SUPPLIERS_URL}/productos/by-ids",
                    json={"product_ids": product_ids},
                )
                product_response.raise_for_status()
                product_data = product_response.json()
                product_data_list = product_data.get("data", [])

                # Construir mapa de precios: {id: precio}
                for product in product_data_list:
                    price_map[product["id"]] = Decimal(str(product.get("precio", 0)))
                    image_map[product["id"]] = str(product.get("imagen", None))

        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error communicating with product service: {str(e)}",
            )

    # Mapear items_rows a MostPurchasedProduct con precios y URLs de imagen
    items_schemas = []
    for row in items_rows:
        product_id = row.product_id
        product_name = row.product_name

        # Obtener precio desde product_data (comparando IDs)
        current_price = price_map.get(product_id, Decimal("0"))

        # Construir URL de imagen con nombre del producto (espacios → +)
        url_imagen_text = product_name.replace(" ", "+")
        url_imagen = (
            f"https://placehold.co/600x400/eeeeee/999999?text={url_imagen_text}"
        )

        # Crear objeto MostPurchasedProduct
        item = MostPurchasedProduct(
            product_id=product_id,
            product_name=product_name,
            current_unit_price=current_price,
            total_quantity_sold=row.total_quantity_sold or 0,
            institutions=row.institutions or "",
            url_imagen=url_imagen,
        )
        items_schemas.append(item)

    # calcular total_pages
    total_pages = 0
    if total_count > 0 and limit > 0:
        total_pages = math.ceil(total_count / limit)
    elif total_count == 0:
        total_pages = 0
    else:
        total_pages = 1

    # construir la respuesta paginada final
    return MostPurchasedProductPaginatedResponse(
        items=items_schemas,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


def get_territory_hierarchy(db: Session, territory_id: str) -> Dict[str, str]:
    """
    Obtiene la jerarquía de territorios (país y ciudad) a partir de un territory_id.
    Retorna un diccionario con 'country' y 'city'.
    """
    from uuid import UUID

    result = {"country": "N/A", "city": "N/A"}

    if not territory_id:
        return result

    try:
        # Convertir territory_id a UUID
        territory_uuid = UUID(territory_id)
        current_territory = get_territorio(db, territory_uuid)

        if not current_territory:
            return result

        # Identificar el tipo del territorio actual
        if current_territory.type == TerritoryType.CITY:
            result["city"] = current_territory.name
            # Buscar el país (padre o abuelo)
            if current_territory.id_parent:
                parent = get_territorio(db, current_territory.id_parent)
                if parent:
                    if parent.type == TerritoryType.COUNTRY:
                        result["country"] = parent.name
                    elif parent.type == TerritoryType.STATE and parent.id_parent:
                        # Buscar el abuelo (país)
                        grandparent = get_territorio(db, parent.id_parent)
                        if grandparent and grandparent.type == TerritoryType.COUNTRY:
                            result["country"] = grandparent.name

        elif current_territory.type == TerritoryType.STATE:
            # Si es un estado, buscar el país (padre)
            if current_territory.id_parent:
                parent = get_territorio(db, current_territory.id_parent)
                if parent and parent.type == TerritoryType.COUNTRY:
                    result["country"] = parent.name

        elif current_territory.type == TerritoryType.COUNTRY:
            result["country"] = current_territory.name

    except Exception:
        # En caso de error, retornar valores por defecto
        pass

    return result


def get_scheduled_deliveries_service(
    db: Session, delivery_date: date, page: int, limit: int
) -> ScheduledDeliveriesResponse:
    """
    Obtiene las entregas programadas para una fecha específica con estado 'pending'.
    Enriquece la información con datos del cliente y territorio (país y ciudad).
    """
    skip = (page - 1) * limit
    crud_result = get_scheduled_deliveries_by_date(db, delivery_date, skip, limit)

    orders = crud_result["items"]
    total = crud_result["total"]

    # Enriquecer cada orden con información del cliente y territorio
    deliveries = []
    for order in orders:
        client = order.institutional_client
        if not client:
            continue

        # Obtener jerarquía de territorio (país y ciudad)
        territory_info = get_territory_hierarchy(db, client.territory_id)

        delivery = ScheduledDelivery(
            order_id=order.id,
            client_name=client.nombre_institucion,
            country=territory_info["country"],
            city=territory_info["city"],
            address=client.direccion,
        )
        deliveries.append(delivery)

    # Calcular total de páginas
    total_pages = 0
    if total > 0 and limit > 0:
        total_pages = math.ceil(total / limit)
    elif total == 0:
        total_pages = 0
    else:
        total_pages = 1

    return ScheduledDeliveriesResponse(
        data=deliveries,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )
