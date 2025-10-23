"""Routes for route stop operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from ..schemas.route_stop import RouteStopCreate, RouteStopUpdate
from ..services import route_stop_service

router = APIRouter(prefix="/paradas", tags=["route_stops"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_route_stop(stop: RouteStopCreate, db: Session = Depends(get_db)):
    """Create a new route stop."""
    return route_stop_service.create(db, stop)


@router.get("")
def list_route_stops(
    route_id: str = Query(..., description="Filter stops by route ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """List stops for a specific route with pagination."""
    return route_stop_service.read_by_route(db, route_id=route_id, page=page, limit=limit)


@router.get("/{stop_id}")
def get_route_stop(stop_id: str, db: Session = Depends(get_db)):
    """Get a specific route stop by ID."""
    return route_stop_service.get_by_id(db, stop_id=stop_id)


@router.patch("/{stop_id}")
def update_route_stop(stop_id: str, stop_update: RouteStopUpdate, db: Session = Depends(get_db)):
    """Update a route stop."""
    return route_stop_service.update_stop_data(db, stop_id=stop_id, stop_update=stop_update)


@router.delete("/{stop_id}", status_code=status.HTTP_200_OK)
def delete_route_stop(stop_id: str, db: Session = Depends(get_db)):
    """Delete a route stop."""
    return route_stop_service.delete_stop_by_id(db, stop_id=stop_id)
