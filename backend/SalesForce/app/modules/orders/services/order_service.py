"""Order service layer for business logic."""
from datetime import date
from decimal import Decimal
from typing import Dict, List

import httpx
import math
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.institutional_clients.crud import get_institutional_client_by_id
from app.modules.orders.crud import create_order_with_items, get_most_purchased_products, get_top_institution_buyer_products
from app.modules.orders.schemas import OrderCreate, MostPurchasedProduct, MostPurchasedProductPaginatedResponse

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

        # 3. Validate inventory
        has_stock = await validate_inventory(item.product_id, item.quantity)
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


async def get_top_purchased_products(db: Session, page: int, limit: int) -> List[MostPurchasedProduct]:
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
            product_ids = [row['id'] for row in items_rows]
            if product_ids:
                product_response = await client.post(
                    f"{PURCHASES_SUPPLIERS_URL}/productos/by-ids",
                    json={"product_ids": product_ids}
                )
                product_response.raise_for_status()
                product_data = product_response.json()
                product_data_list = product_data.get("data", [])
                
                # Construir mapa de precios: {id: precio}
                for product in product_data_list:
                    price_map[product['id']] = Decimal(str(product.get('precio', 0)))
                    image_map[product['id']] = str(product.get('imagen', None))

        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error communicating with product service: {str(e)}",
            )
    
    # Mapear items_rows a MostPurchasedProduct con precios y URLs de imagen
    items_schemas = []
    for row in items_rows:
        product_id = row['id']
        product_name = row.get('product_name', '')
        
        # Obtener precio desde product_data (comparando IDs)
        current_price = price_map.get(product_id, Decimal("0"))
        
        # Construir URL de imagen con nombre del producto (espacios → +)
        url_imagen_text = product_name.replace(" ", "+")
        url_imagen = f"https://placehold.co/600x400/eeeeee/999999?text={url_imagen_text}" if price_map.get(product_id) is None else price_map.get(product_id)
        
        # Crear objeto MostPurchasedProduct
        item = MostPurchasedProduct(
            product_id=product_id,
            product_name=product_name,
            current_unit_price=current_price,
            total_quantity_sold=row.get('total_quantity_sold', 0),
            institutions=row.get('institutions', ''),
            url_imagen=url_imagen
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
        total_pages=total_pages
    )


async def get_top_institution_buyers(db: Session, page: int, limit: int) -> MostPurchasedProductPaginatedResponse:
    """
    Obtener el reporte de clientes (instituciones) que más han comprado.
    Devuelve la misma estructura que get_top_purchased_products.
    """
    crud_result = get_top_institution_buyer_products(db, page=page, limit=limit)
    
    items_rows = crud_result["items"]
    total_count = crud_result["total"]

    # No necesitamos obtener datos de precios externos para instituciones
    # Simplemente mapeamos los resultados a MostPurchasedProduct
    items_schemas = []
    for row in items_rows:
        institution_id = row['product_id']  # En este contexto es el ID de la institución
        institution_name = row.get('product_name', '')
        
        # Construir URL de imagen con nombre de la institución (espacios → +)
        url_imagen_text = institution_name.replace(" ", "+")
        url_imagen = f"https://placehold.co/600x400/eeeeee/999999?text={url_imagen_text}"
        
        # Crear objeto MostPurchasedProduct (reutilizamos el esquema)
        item = MostPurchasedProduct(
            product_id=institution_id,
            product_name=institution_name,
            current_unit_price=row.get('current_unit_price', Decimal("0")),
            total_quantity_sold=row.get('total_quantity_sold', 0),
            institutions=row.get('institutions', ''),  # En este caso, lista de productos comprados
            url_imagen=url_imagen
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
        total_pages=total_pages
    )