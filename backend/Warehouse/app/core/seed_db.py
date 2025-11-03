"""
Database seeding script
Populates the database with initial warehouses and product inventory
"""

from datetime import date, timedelta
from app.core.database import SessionLocal
from app.modules.warehouse.models.warehouse_model import WarehouseV1 as Warehouse
from app.modules.inventory.models.product_inventory_model import ProductInventory


def seed_warehouses():
    """Create initial warehouses in different Colombian cities"""
    db = SessionLocal()
    try:
        warehouses_data = [
            {
                "nombre": "Bogotá-1",
                "ubicacion": "Bogotá",
            },
            {
                "nombre": "Medellín-1",
                "ubicacion": "Medellín",
            },
            {
                "nombre": "Cali-1",
                "ubicacion": "Cali",
            },
            {
                "nombre": "Barranquilla-1",
                "ubicacion": "Barranquilla",
            },
        ]

        created_warehouses = []
        for warehouse_data in warehouses_data:
            # Check if warehouse already exists
            existing = (
                db.query(Warehouse)
                .filter(Warehouse.nombre == warehouse_data["nombre"])
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
    """Create initial product inventory across warehouses"""
    db = SessionLocal()
    try:
        # Get existing warehouses
        warehouses = db.query(Warehouse).all()
        if not warehouses:
            print("No warehouses found. Please seed warehouses first.")
            return

        # Medical products SKUs that should have inventory
        products_data = [
            {
                "product_id": "MED-12345",
                "name": "Termómetro Digital",
                "storage_type": "general",
                "quantity_per_warehouse": 100,
            },
            {
                "product_id": "MED-12346",
                "name": "Tensiómetro Digital",
                "storage_type": "general",
                "quantity_per_warehouse": 75,
            },
            {
                "product_id": "MED-12347",
                "name": "Oxímetro de Pulso",
                "storage_type": "general",
                "quantity_per_warehouse": 120,
            },
            {
                "product_id": "MED-12348",
                "name": "Glucómetro",
                "storage_type": "cold",
                "quantity_per_warehouse": 80,
            },
            {
                "product_id": "MED-12349",
                "name": "Nebulizador Ultrasónico",
                "storage_type": "general",
                "quantity_per_warehouse": 60,
            },
            {
                "product_id": "MED-12350",
                "name": "Estetoscopio Profesional",
                "storage_type": "general",
                "quantity_per_warehouse": 90,
            },
            {
                "product_id": "MED-12351",
                "name": "Mascarilla N95",
                "storage_type": "general",
                "quantity_per_warehouse": 500,
            },
            {
                "product_id": "MED-12352",
                "name": "Guantes de Nitrilo",
                "storage_type": "general",
                "quantity_per_warehouse": 800,
            },
            {
                "product_id": "MED-12353",
                "name": "Jeringa 10ml",
                "storage_type": "cold",
                "quantity_per_warehouse": 300,
            },
            {
                "product_id": "MED-12354",
                "name": "Alcohol Antiséptico 70%",
                "storage_type": "general",
                "quantity_per_warehouse": 200,
            },
        ]

        created_count = 0

        # Warehouse zones - realistic location codes
        zones = ["A1-3", "A2-5", "B1-2", "B3-7", "C2-4", "D1-6", "E3-1", "F2-8"]

        # Distribute products across warehouses
        for i, product in enumerate(products_data):
            # Each product will be in 2-3 warehouses
            num_warehouses = 2 if i % 3 == 0 else 3

            for j in range(num_warehouses):
                warehouse = warehouses[j % len(warehouses)]

                # Check if inventory already exists
                existing = (
                    db.query(ProductInventory)
                    .filter(
                        ProductInventory.warehouse_id == warehouse.id,
                        ProductInventory.product_id == product["product_id"],
                    )
                    .first()
                )

                if not existing:
                    # Calculate expiration date (1-2 years from now)
                    expiration_date = date.today() + timedelta(days=365 + (i * 30))

                    # Assign a zone based on product and warehouse
                    zone_index = (i + j) % len(zones)
                    zona = zones[zone_index]

                    inventory = ProductInventory(
                        warehouse_id=warehouse.id,
                        product_id=product["product_id"],
                        batch_number=f"BATCH-{product['product_id']}-{j+1}",
                        quantity=product["quantity_per_warehouse"],
                        storage_type=product["storage_type"],
                        zona=zona,
                        capacity=product["quantity_per_warehouse"] * 2,
                        expiration_date=expiration_date,
                    )
                    db.add(inventory)
                    created_count += 1
                    print(
                        f"  ✓ Added {product['quantity_per_warehouse']} units of "
                        f"{product['product_id']} to {warehouse.nombre} in zone {zona} ({product['storage_type']})"
                    )

        db.commit()
        print(f"\nCreated {created_count} inventory entries")
    except Exception as e:
        db.rollback()
        print(f"Error seeding inventory: {e}")
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
