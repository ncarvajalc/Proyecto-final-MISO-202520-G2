"""CRUD operations for route stop domain."""

from typing import Optional, List
from sqlalchemy.orm import Session
from ..models.route_stop import RouteStop
from ..schemas.route_stop import RouteStopCreate, RouteStopUpdate


def get_route_stop(db: Session, stop_id: str) -> RouteStop | None:
    """Get route stop by ID."""
    return db.query(RouteStop).filter(RouteStop.id == stop_id).first()


def get_route_stops_by_route(db: Session, route_id: str, skip: int = 0, limit: int = 100) -> dict:
    """List all stops for a specific route ordered by sequence."""
    total = db.query(RouteStop).filter(RouteStop.route_id == route_id).count()
    stops = (
        db.query(RouteStop)
        .filter(RouteStop.route_id == route_id)
        .order_by(RouteStop.sequence)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"stops": stops, "total": total}


def create_route_stop(db: Session, stop: RouteStopCreate) -> RouteStop:
    """Create a new route stop."""
    db_stop = RouteStop(
        route_id=stop.route_id,
        client_id=stop.client_id,
        sequence=stop.sequence,
        estimated_arrival=stop.estimated_arrival,
        delivered=stop.delivered,
        latitude=stop.latitude,
        longitude=stop.longitude,
        address=stop.address,
    )
    db.add(db_stop)
    db.commit()
    db.refresh(db_stop)
    return db_stop


def update_route_stop(db: Session, stop_id: str, stop_update: RouteStopUpdate) -> RouteStop | None:
    """Update a route stop."""
    db_stop = db.query(RouteStop).filter(RouteStop.id == stop_id).first()
    if not db_stop:
        return None

    update_data = stop_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_stop, field, value)

    db.commit()
    db.refresh(db_stop)
    return db_stop


def delete_route_stop(db: Session, stop_id: str) -> bool:
    """Delete a route stop."""
    db_stop = db.query(RouteStop).filter(RouteStop.id == stop_id).first()
    if not db_stop:
        return False

    db.delete(db_stop)
    db.commit()
    return True


def create_route_stops_bulk(db: Session, stops: List[RouteStopCreate]) -> List[RouteStop]:
    """Create multiple route stops in bulk."""
    db_stops = [
        RouteStop(
            route_id=stop.route_id,
            client_id=stop.client_id,
            sequence=stop.sequence,
            estimated_arrival=stop.estimated_arrival,
            delivered=stop.delivered,
            latitude=stop.latitude,
            longitude=stop.longitude,
            address=stop.address,
        )
        for stop in stops
    ]
    db.add_all(db_stops)
    db.commit()
    for stop in db_stops:
        db.refresh(stop)
    return db_stops
