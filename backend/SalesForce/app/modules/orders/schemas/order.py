from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class OrderItemBase(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class OrderItemCreate(OrderItemBase):
    pass


class OrderItem(OrderItemBase):
    id: int
    order_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    institutional_client_id: str
    order_date: date
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    status: str = "pending"


class OrderCreate(BaseModel):
    institutional_client_id: str
    items: List[OrderItemCreate]


class Order(OrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    items: List[OrderItem] = []

    model_config = ConfigDict(from_attributes=True)


class OrdersResponse(BaseModel):
    data: List[Order]
    total: int
    page: int
    limit: int
    total_pages: int


class MostPurchasedProduct(BaseModel):
    """
    Esquema para un producto individual en el reporte.
    """

    product_id: int
    product_name: str
    current_unit_price: Decimal
    total_quantity_sold: int
    institutions: str
    url_imagen: str

    model_config = ConfigDict(from_attributes=True)


class MostPurchasedProductPaginatedResponse(BaseModel):
    """
    Esquema para la respuesta paginada de productos más comprados.
    """

    items: List[MostPurchasedProduct]
    total: int
    page: int
    limit: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)


class OrderStatusProduct(BaseModel):
    """Representa un producto dentro del resumen de un pedido."""

    product_id: int
    product_name: str
    unit: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class OrderStatus(BaseModel):
    """Respuesta enriquecida para la consulta del estado de un pedido."""

    id: int
    order_number: str
    institutional_client_id: str
    client_name: str
    order_date: date
    status: str
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    product_count: int
    total_units: int
    items: List[OrderStatusProduct]


class ScheduledDelivery(BaseModel):
    """Respuesta para la consulta de entregas programadas."""

    client_name: str
    country: str
    city: str
    address: str

    model_config = ConfigDict(from_attributes=True)


class ScheduledDeliveriesResponse(BaseModel):
    """Respuesta paginada para entregas programadas."""

    data: List[ScheduledDelivery]
    total: int
    page: int
    limit: int
    total_pages: int
