"""Service layer for vehicle operations."""

from __future__ import annotations

from typing import Any, Dict

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.pagination import build_pagination_metadata, get_pagination_offset

from ..crud.crud_vehicle import (
    create_vehicle,
    get_vehicle_by_placa,
    get_vehicles_all,
)
from ..models.vehicle import Vehicle
from ..schemas.vehicle import VehicleCreate


def _serialize_vehicle(vehicle: Vehicle) -> Dict[str, Any]:
    """Convert Vehicle ORM instance to dict for API response."""
    return {
        "id": vehicle.id,
        "placa": vehicle.placa,
        "conductor": vehicle.conductor,
        "numeroEntregas": vehicle.numero_entregas,
        "created_at": vehicle.created_at,
        "updated_at": vehicle.updated_at,
    }


def create(db: Session, vehicle: VehicleCreate) -> Dict[str, Any]:
    """Create a new vehicle with business validations."""
    # Validate placa uniqueness
    existing = get_vehicle_by_placa(db, placa=vehicle.placa)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Vehicle with placa '{vehicle.placa}' already exists",
        )

    db_vehicle = create_vehicle(db, vehicle=vehicle)
    return _serialize_vehicle(db_vehicle)


def read(db: Session, page: int = 1, limit: int = 10) -> Dict[str, Any]:
    """List vehicles with pagination."""
    skip = get_pagination_offset(page, limit)
    result = get_vehicles_all(db, skip=skip, limit=limit)
    total = result["total"]
    vehicles = result["vehicles"]
    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    # Serialize vehicles
    serialized_vehicles = [_serialize_vehicle(v) for v in vehicles]

    return {"data": serialized_vehicles, **metadata}


__all__ = ["create", "read"]

