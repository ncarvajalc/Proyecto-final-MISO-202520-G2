"""
Módulo de Inventario de Productos (Product Inventory)
"""

from .routes.product_inventory import router as inventory_router

__all__ = ["inventory_router"]
