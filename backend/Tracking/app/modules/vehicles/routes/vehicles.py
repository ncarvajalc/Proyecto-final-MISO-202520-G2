"""Routes for vehicle operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db

from ..schemas.vehicle import VehicleCreate
from ..services import vehicle_service

router = APIRouter(prefix="/vehiculos", tags=["vehicles"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    """Create a new vehicle."""
    return vehicle_service.create(db, vehicle)


@router.get("")
def list_vehicles(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    """List vehicles with pagination."""
    return vehicle_service.read(db, page=page, limit=limit)


__all__ = ["router"]
