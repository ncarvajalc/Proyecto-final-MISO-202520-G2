"""
Database seeding script
Populates the database with initial data for testing and development
"""

from app.core.database import SessionLocal
from app.modules.vehicles.models import Vehicle


def seed_vehicles():
    """Create initial test vehicles"""
    db = SessionLocal()
    try:
        vehicles_data = [
            {
                "placa": "ABC-123",
                "conductor": "Juan Pérez",
                "numero_entregas": 5,
            },
            {
                "placa": "DEF-456",
                "conductor": "María García",
                "numero_entregas": 8,
            },
            {
                "placa": "GHI-789",
                "conductor": "Carlos López",
                "numero_entregas": 3,
            },
            {
                "placa": "JKL-012",
                "conductor": "Ana Martínez",
                "numero_entregas": 12,
            },
            {
                "placa": "MNO-345",
                "conductor": "Luis Rodríguez",
                "numero_entregas": 7,
            },
            {
                "placa": "PQR-678",
                "conductor": "Sofía Torres",
                "numero_entregas": 6,
            },
            {
                "placa": "STU-901",
                "conductor": "Diego Ramírez",
                "numero_entregas": 8,
            },
            {
                "placa": "VWX-234",
                "conductor": "Laura Hernández",
                "numero_entregas": 1,
            },
            {
                "placa": "YZA-567",
                "conductor": "Pedro Sánchez",
                "numero_entregas": 9,
            },
            {
                "placa": "BCD-890",
                "conductor": "Carmen Díaz",
                "numero_entregas": 3,
            },
            {
                "placa": "EFG-123",
                "conductor": "Roberto Cruz",
                "numero_entregas": 5,
            },
            {
                "placa": "HIJ-456",
                "conductor": "Patricia Morales",
                "numero_entregas": 4,
            },
        ]

        created_vehicles = []
        for vehicle_data in vehicles_data:
            # Check if vehicle already exists
            existing = (
                db.query(Vehicle)
                .filter(Vehicle.placa == vehicle_data["placa"])
                .first()
            )

            if not existing:
                vehicle = Vehicle(**vehicle_data)
                db.add(vehicle)
                created_vehicles.append(vehicle_data["placa"])

        db.commit()
        if created_vehicles:
            print(
                f"Created {len(created_vehicles)} vehicles: {', '.join(created_vehicles)}"
            )
        else:
            print("Vehicles already exist")
    except Exception as e:
        db.rollback()
        print(f"Error seeding vehicles: {e}")
    finally:
        db.close()


def seed_all():
    """Run all seeding functions in the correct order"""
    print("\n🌱 Starting database seeding...\n")

    seed_vehicles()

    print("\nDatabase seeding completed!\n")


if __name__ == "__main__":
    seed_all()

