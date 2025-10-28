"""Service layer for route stop operations."""

from typing import Any, Dict
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.pagination import build_pagination_metadata, get_pagination_offset
from ..crud.crud_route_stop import (
    create_route_stop,
    get_route_stop,
    get_route_stops_by_route,
    update_route_stop,
    delete_route_stop,
)
from ..models.route_stop import RouteStop
from ..schemas.route_stop import RouteStopCreate, RouteStopUpdate


def _serialize_route_stop(stop: RouteStop) -> Dict[str, Any]:
    """Convert RouteStop ORM instance to dict for API response."""
    return {
        "id": stop.id,
        "routeId": stop.route_id,
        "clientId": stop.client_id,
        "sequence": stop.sequence,
        "estimatedArrival": stop.estimated_arrival.isoformat() if stop.estimated_arrival else None,
        "delivered": stop.delivered,
        "latitude": float(stop.latitude) if stop.latitude else None,
        "longitude": float(stop.longitude) if stop.longitude else None,
        "address": stop.address,
        "createdAt": stop.created_at.isoformat() if stop.created_at else None,
        "updatedAt": stop.updated_at.isoformat() if stop.updated_at else None,
    }


def create(db: Session, stop: RouteStopCreate) -> Dict[str, Any]:
    """Create a new route stop with business validations."""
    db_stop = create_route_stop(db, stop=stop)
    return _serialize_route_stop(db_stop)


def read_by_route(db: Session, route_id: str, page: int = 1, limit: int = 100) -> Dict[str, Any]:
    """List stops for a specific route with pagination."""
    skip = get_pagination_offset(page, limit)
    result = get_route_stops_by_route(db, route_id=route_id, skip=skip, limit=limit)
    total = result["total"]
    stops = result["stops"]
    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    serialized_stops = [_serialize_route_stop(s) for s in stops]

    return {"data": serialized_stops, **metadata}


def get_by_id(db: Session, stop_id: str) -> Dict[str, Any]:
    """Get a single route stop by ID."""
    stop = get_route_stop(db, stop_id=stop_id)
    if not stop:
        raise HTTPException(status_code=404, detail=f"RouteStop with id '{stop_id}' not found")

    return _serialize_route_stop(stop)


def update_stop_data(db: Session, stop_id: str, stop_update: RouteStopUpdate) -> Dict[str, Any]:
    """Update a route stop."""
    stop = update_route_stop(db, stop_id=stop_id, stop_update=stop_update)
    if not stop:
        raise HTTPException(status_code=404, detail=f"RouteStop with id '{stop_id}' not found")

    return _serialize_route_stop(stop)


def delete_stop_by_id(db: Session, stop_id: str) -> Dict[str, str]:
    """Delete a route stop."""
    success = delete_route_stop(db, stop_id=stop_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"RouteStop with id '{stop_id}' not found")

    return {"message": "RouteStop deleted successfully"}
