"""
Database seeding script
Populates the database with initial data for testing and development
"""

from datetime import date, datetime, timedelta
from decimal import Decimal
from app.core.database import SessionLocal
from app.modules.vehicles.models import Vehicle
from app.modules.haul_route.models import Route, RouteStop


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


def seed_routes():
    """Create initial test routes with stops"""
    db = SessionLocal()
    try:
        # Get existing vehicles
        vehicles = db.query(Vehicle).limit(3).all()
        if not vehicles:
            print("No vehicles found. Please seed vehicles first.")
            return

        # Create routes for demonstration
        # Route 1: Multiple stops in Bogotá area (unoptimized)
        route1 = Route(
            vehicle_id=vehicles[0].id,
            date=date.today(),
            total_distance_km=Decimal("0.0"),
            estimated_time_h=Decimal("0.0"),
            priority_level="high",
            status="pending"
        )
        db.add(route1)
        db.flush()

        # Add stops for route 1 (intentionally unoptimized order)
        stops1 = [
            RouteStop(
                route_id=route1.id,
                client_id="CLIENT-001",
                sequence=1,
                latitude=Decimal("4.6097100"),  # Bogotá - North
                longitude=Decimal("-74.0817500"),
                address="Calle 127 #15-20, Bogotá",
                delivered=False
            ),
            RouteStop(
                route_id=route1.id,
                client_id="CLIENT-002",
                sequence=2,
                latitude=Decimal("4.5980800"),  # Bogotá - South
                longitude=Decimal("-74.0760900"),
                address="Av. Caracas #1-50, Bogotá",
                delivered=False
            ),
            RouteStop(
                route_id=route1.id,
                client_id="CLIENT-003",
                sequence=3,
                latitude=Decimal("4.6533800"),  # Bogotá - Far North
                longitude=Decimal("-74.0548200"),
                address="Autopista Norte #145-30, Bogotá",
                delivered=False
            ),
            RouteStop(
                route_id=route1.id,
                client_id="CLIENT-004",
                sequence=4,
                latitude=Decimal("4.6486200"),  # Bogotá - Center North
                longitude=Decimal("-74.0645000"),
                address="Carrera 7 #72-35, Bogotá",
                delivered=False
            ),
            RouteStop(
                route_id=route1.id,
                client_id="CLIENT-005",
                sequence=5,
                latitude=Decimal("4.6355400"),  # Bogotá - West
                longitude=Decimal("-74.1079700"),
                address="Av. Boyacá #80-94, Bogotá",
                delivered=False
            ),
        ]
        db.add_all(stops1)

        # Route 2: Fewer stops
        route2 = Route(
            vehicle_id=vehicles[1].id,
            date=date.today(),
            total_distance_km=Decimal("0.0"),
            estimated_time_h=Decimal("0.0"),
            priority_level="normal",
            status="pending"
        )
        db.add(route2)
        db.flush()

        stops2 = [
            RouteStop(
                route_id=route2.id,
                client_id="CLIENT-006",
                sequence=1,
                latitude=Decimal("4.7110000"),
                longitude=Decimal("-74.0721000"),
                address="Calle 170 #60-20, Bogotá",
                delivered=False
            ),
            RouteStop(
                route_id=route2.id,
                client_id="CLIENT-007",
                sequence=2,
                latitude=Decimal("4.6882800"),
                longitude=Decimal("-74.0548300"),
                address="Carrera 15 #140-12, Bogotá",
                delivered=False
            ),
            RouteStop(
                route_id=route2.id,
                client_id="CLIENT-008",
                sequence=3,
                latitude=Decimal("4.6686200"),
                longitude=Decimal("-74.0593000"),
                address="Calle 100 #19-61, Bogotá",
                delivered=False
            ),
        ]
        db.add_all(stops2)

        # Route 3: Already delivered route
        route3 = Route(
            vehicle_id=vehicles[2].id,
            date=date.today() - timedelta(days=1),
            total_distance_km=Decimal("25.5"),
            estimated_time_h=Decimal("1.5"),
            priority_level="normal",
            status="completed"
        )
        db.add(route3)
        db.flush()

        stops3 = [
            RouteStop(
                route_id=route3.id,
                client_id="CLIENT-009",
                sequence=1,
                latitude=Decimal("4.6097"),
                longitude=Decimal("-74.0817"),
                address="Calle 50 #13-50, Bogotá",
                delivered=True
            ),
            RouteStop(
                route_id=route3.id,
                client_id="CLIENT-010",
                sequence=2,
                latitude=Decimal("4.6510"),
                longitude=Decimal("-74.0630"),
                address="Carrera 11 #82-30, Bogotá",
                delivered=True
            ),
        ]
        db.add_all(stops3)

        db.commit()
        print(f"Created 3 routes with {len(stops1) + len(stops2) + len(stops3)} total stops")
    except Exception as e:
        db.rollback()
        print(f"Error seeding routes: {e}")
    finally:
        db.close()


def seed_all():
    """Run all seeding functions in the correct order"""
    print("\n🌱 Starting database seeding...\n")

    seed_vehicles()
    seed_routes()

    print("\nDatabase seeding completed!\n")


if __name__ == "__main__":
    seed_all()

