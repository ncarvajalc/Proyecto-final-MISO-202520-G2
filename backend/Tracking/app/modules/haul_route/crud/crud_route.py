"""CRUD operations for route domain."""

from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from ..models.route import Route
from ..schemas.route import RouteCreate, RouteUpdate


def get_route(db: Session, route_id: str) -> Route | None:
    """Get route by ID with stops."""
    return db.query(Route).options(joinedload(Route.stops)).filter(Route.id == route_id).first()


def get_routes_by_vehicle(db: Session, vehicle_id: str, skip: int = 0, limit: int = 10) -> dict:
    """List all routes for a specific vehicle with pagination."""
    total = db.query(Route).filter(Route.vehicle_id == vehicle_id).count()
    routes = (
        db.query(Route)
        .options(joinedload(Route.stops))
        .filter(Route.vehicle_id == vehicle_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"routes": routes, "total": total}


def get_routes_all(db: Session, skip: int = 0, limit: int = 10) -> dict:
    """List all routes with pagination."""
    total = db.query(Route).count()
    routes = db.query(Route).options(joinedload(Route.stops)).offset(skip).limit(limit).all()
    return {"routes": routes, "total": total}


def create_route(db: Session, route: RouteCreate) -> Route:
    """Create a new route."""
    db_route = Route(
        vehicle_id=route.vehicle_id,
        date=route.date,
        total_distance_km=route.total_distance_km,
        estimated_time_h=route.estimated_time_h,
        priority_level=route.priority_level,
        status=route.status,
    )
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route


def update_route(db: Session, route_id: str, route_update: RouteUpdate) -> Route | None:
    """Update a route."""
    db_route = db.query(Route).filter(Route.id == route_id).first()
    if not db_route:
        return None

    update_data = route_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_route, field, value)

    db.commit()
    db.refresh(db_route)
    return db_route


def delete_route(db: Session, route_id: str) -> bool:
    """Delete a route."""
    db_route = db.query(Route).filter(Route.id == route_id).first()
    if not db_route:
        return False

    db.delete(db_route)
    db.commit()
    return True
