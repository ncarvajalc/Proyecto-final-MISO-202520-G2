"""CRUD operations for vehicle domain."""

from __future__ import annotations

from sqlalchemy.orm import Session

from ..models.vehicle import Vehicle
from ..schemas.vehicle import VehicleCreate


def get_vehicle(db: Session, vehicle_id: str) -> Vehicle | None:
    """Get vehicle by ID."""
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()


def get_vehicle_by_placa(db: Session, placa: str) -> Vehicle | None:
    """Get vehicle by placa (license plate)."""
    return db.query(Vehicle).filter(Vehicle.placa == placa).first()


def get_vehicles_all(db: Session, skip: int = 0, limit: int = 10) -> dict:
    """List all vehicles with pagination."""
    total = db.query(Vehicle).count()
    vehicles = db.query(Vehicle).offset(skip).limit(limit).all()
    return {"vehicles": vehicles, "total": total}


def create_vehicle(db: Session, vehicle: VehicleCreate) -> Vehicle:
    """Create a new vehicle."""
    db_vehicle = Vehicle(
        placa=vehicle.placa,
        conductor=vehicle.conductor,
        numero_entregas=vehicle.numero_entregas,
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


__all__ = [
    "get_vehicle",
    "get_vehicle_by_placa",
    "get_vehicles_all",
    "create_vehicle",
]
