"""Routes for route operations."""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from ..schemas.route import RouteCreate, RouteUpdate
from ..services import route_service

router = APIRouter(prefix="/rutas", tags=["routes"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_route(route: RouteCreate, db: Session = Depends(get_db)):
    """Create a new route."""
    return route_service.create(db, route)


@router.get("")
def list_routes(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    vehicle_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List routes with pagination. Optionally filter by vehicle_id."""
    if vehicle_id:
        return route_service.read_by_vehicle(db, vehicle_id=vehicle_id, page=page, limit=limit)
    return route_service.read(db, page=page, limit=limit)


@router.get("/{route_id}")
def get_route(route_id: str, db: Session = Depends(get_db)):
    """Get a specific route by ID."""
    return route_service.get_by_id(db, route_id=route_id)


@router.patch("/{route_id}")
def update_route(route_id: str, route_update: RouteUpdate, db: Session = Depends(get_db)):
    """Update a route."""
    return route_service.update_route_data(db, route_id=route_id, route_update=route_update)


@router.delete("/{route_id}", status_code=status.HTTP_200_OK)
def delete_route(route_id: str, db: Session = Depends(get_db)):
    """Delete a route."""
    return route_service.delete_route_by_id(db, route_id=route_id)


@router.post("/{route_id}/optimize", status_code=status.HTTP_200_OK)
def optimize_route(
    route_id: str,
    start_lat: float = Query(0.0, description="Starting latitude (warehouse/depot)"),
    start_lon: float = Query(0.0, description="Starting longitude (warehouse/depot)"),
    avg_speed_kmh: float = Query(40.0, ge=1, le=120, description="Average speed in km/h"),
    db: Session = Depends(get_db)
):
    """
    Optimize a route using nearest-neighbor algorithm.
    Updates stop sequences and recalculates route metrics.
    """
    return route_service.optimize_route_and_save(
        db,
        route_id=route_id,
        start_lat=start_lat,
        start_lon=start_lon,
        avg_speed_kmh=avg_speed_kmh
    )
