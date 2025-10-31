"""
Database seeding script
Populates the database with initial warehouses and product inventory
"""

from app.core.database import SessionLocal
from app.modules.inventory.models.warehouse import Warehouse
from app.modules.inventory.models.inventory import Inventory


def seed_warehouses():
    """Create initial warehouses in different Colombian cities"""
    db = SessionLocal()
    try:
        warehouses_data = [
            {
                "name": "Bodega Principal Bogotá",
                "location": "Calle 100 #15-20, Bogotá",
                "active": True,
            },
            {
                "name": "Bodega Medellín",
                "location": "Carrera 43A #1-50, Medellín",
                "active": True,
            },
            {
                "name": "Bodega Cali",
                "location": "Avenida 6 Norte #23-50, Cali",
                "active": True,
            },
        ]

        created_warehouses = []
        for warehouse_data in warehouses_data:
            # Check if warehouse already exists
            existing = (
                db.query(Warehouse)
                .filter(Warehouse.name == warehouse_data["name"])
                .first()
            )

            if not existing:
                warehouse = Warehouse(**warehouse_data)
                db.add(warehouse)
                created_warehouses.append(warehouse)
            else:
                created_warehouses.append(existing)

        db.commit()
        if created_warehouses:
            print(f"Created/found {len(created_warehouses)} warehouses")
        return created_warehouses
    except Exception as e:
        db.rollback()
        print(f"Error seeding warehouses: {e}")
        return []
    finally:
        db.close()


def seed_inventory():
    """Create initial product inventory for all existing products"""
    db = SessionLocal()
    try:
        # Get the first warehouse (or create if none exists)
        warehouse = db.query(Warehouse).first()
        if not warehouse:
            print("No warehouses found. Creating default warehouse...")
            warehouse = Warehouse(
                name="Bodega Principal",
                location="Bogotá",
                active=True
            )
            db.add(warehouse)
            db.commit()
            db.refresh(warehouse)

        # Product IDs 1-6 that exist in PurchasesAndSuppliers
        products_inventory = [
            {"product_id": 1, "stock": 1000, "available": 1000},
            {"product_id": 2, "stock": 500, "available": 500},
            {"product_id": 3, "stock": 2000, "available": 2000},
            {"product_id": 4, "stock": 300, "available": 300},
            {"product_id": 5, "stock": 1500, "available": 1500},
            {"product_id": 6, "stock": 100, "available": 100},
        ]

        created_count = 0
        for item in products_inventory:
            # Check if inventory already exists
            existing = (
                db.query(Inventory)
                .filter(
                    Inventory.warehouse_id == warehouse.id,
                    Inventory.product_id == item["product_id"],
                )
                .first()
            )

            if not existing:
                inventory = Inventory(
                    product_id=item["product_id"],
                    warehouse_id=warehouse.id,
                    stock_quantity=item["stock"],
                    available_quantity=item["available"],
                )
                db.add(inventory)
                created_count += 1
                print(f"  ✓ Added {item['stock']} units of product {item['product_id']} to {warehouse.name}")

        db.commit()
        print(f"\nCreated {created_count} inventory entries")
    except Exception as e:
        db.rollback()
        print(f"Error seeding inventory: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def seed_all():
    """Run all seeding functions in the correct order"""
    print("\n🌱 Starting warehouse database seeding...\n")

    warehouses = seed_warehouses()
    if warehouses:
        seed_inventory()

    print("\nWarehouse database seeding completed!\n")


if __name__ == "__main__":
    seed_all()
