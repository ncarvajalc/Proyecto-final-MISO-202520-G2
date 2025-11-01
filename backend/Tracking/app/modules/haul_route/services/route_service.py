"""Service layer for route operations."""

from typing import Any, Dict, List
from datetime import datetime, timedelta
from decimal import Decimal
import math
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.pagination import build_pagination_metadata, get_pagination_offset
from ..crud.crud_route import (
    create_route,
    get_route,
    get_routes_all,
    get_routes_by_vehicle,
    update_route,
    delete_route,
)
from ..crud.crud_route_stop import (
    create_route_stop,
    get_route_stops_by_route,
    create_route_stops_bulk,
)
from ..models.route import Route
from ..models.route_stop import RouteStop
from ..schemas.route import RouteCreate, RouteUpdate
from ..schemas.route_stop import RouteStopCreate


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


def _serialize_route(route: Route, include_stops: bool = True) -> Dict[str, Any]:
    """Convert Route ORM instance to dict for API response."""
    result = {
        "id": route.id,
        "vehicleId": route.vehicle_id,
        "date": route.date.isoformat() if route.date else None,
        "totalDistanceKm": float(route.total_distance_km) if route.total_distance_km else 0.0,
        "estimatedTimeH": float(route.estimated_time_h) if route.estimated_time_h else 0.0,
        "priorityLevel": route.priority_level,
        "status": route.status,
        "createdAt": route.created_at.isoformat() if route.created_at else None,
        "updatedAt": route.updated_at.isoformat() if route.updated_at else None,
    }

    if include_stops and hasattr(route, "stops"):
        result["stops"] = [_serialize_route_stop(stop) for stop in sorted(route.stops, key=lambda s: s.sequence)]

    return result


def create(db: Session, route: RouteCreate) -> Dict[str, Any]:
    """Create a new route with business validations."""
    db_route = create_route(db, route=route)
    return _serialize_route(db_route)


def read(db: Session, page: int = 1, limit: int = 10) -> Dict[str, Any]:
    """List routes with pagination."""
    skip = get_pagination_offset(page, limit)
    result = get_routes_all(db, skip=skip, limit=limit)
    total = result["total"]
    routes = result["routes"]
    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    serialized_routes = [_serialize_route(r) for r in routes]

    return {"data": serialized_routes, **metadata}


def read_by_vehicle(db: Session, vehicle_id: str, page: int = 1, limit: int = 10) -> Dict[str, Any]:
    """List routes for a specific vehicle with pagination."""
    skip = get_pagination_offset(page, limit)
    result = get_routes_by_vehicle(db, vehicle_id=vehicle_id, skip=skip, limit=limit)
    total = result["total"]
    routes = result["routes"]
    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    serialized_routes = [_serialize_route(r) for r in routes]

    return {"data": serialized_routes, **metadata}


def get_by_id(db: Session, route_id: str) -> Dict[str, Any]:
    """Get a single route by ID."""
    route = get_route(db, route_id=route_id)
    if not route:
        raise HTTPException(status_code=404, detail=f"Route with id '{route_id}' not found")

    return _serialize_route(route)


def update_route_data(db: Session, route_id: str, route_update: RouteUpdate) -> Dict[str, Any]:
    """Update a route."""
    route = update_route(db, route_id=route_id, route_update=route_update)
    if not route:
        raise HTTPException(status_code=404, detail=f"Route with id '{route_id}' not found")

    return _serialize_route(route)


def delete_route_by_id(db: Session, route_id: str) -> Dict[str, str]:
    """Delete a route."""
    success = delete_route(db, route_id=route_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Route with id '{route_id}' not found")

    return {"message": "Route deleted successfully"}


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the Haversine distance between two points on the Earth.
    Returns distance in kilometers.
    """
    # Radius of the Earth in kilometers
    R = 6371.0

    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c

    return distance


def optimize_route_greedy(stops: List[Dict[str, Any]], start_lat: float = 0.0, start_lon: float = 0.0) -> List[Dict[str, Any]]:
    """
    Simple greedy nearest-neighbor algorithm for route optimization.
    This is a basic TSP approximation that visits the nearest unvisited stop next.

    Args:
        stops: List of stop dictionaries with latitude and longitude
        start_lat: Starting latitude (default 0,0 - can be warehouse location)
        start_lon: Starting longitude

    Returns:
        Optimized list of stops with updated sequence numbers
    """
    if not stops:
        return []

    # Filter stops that have coordinates
    stops_with_coords = [s for s in stops if s.get("latitude") is not None and s.get("longitude") is not None]
    stops_without_coords = [s for s in stops if s.get("latitude") is None or s.get("longitude") is None]

    if not stops_with_coords:
        # No coordinates, return original order
        for idx, stop in enumerate(stops, start=1):
            stop["sequence"] = idx
        return stops

    optimized = []
    remaining = stops_with_coords.copy()
    current_lat, current_lon = start_lat, start_lon

    # Greedy nearest neighbor
    while remaining:
        nearest_stop = None
        nearest_distance = float("inf")

        for stop in remaining:
            dist = calculate_distance(
                current_lat, current_lon,
                float(stop["latitude"]), float(stop["longitude"])
            )
            if dist < nearest_distance:
                nearest_distance = dist
                nearest_stop = stop

        optimized.append(nearest_stop)
        remaining.remove(nearest_stop)
        current_lat = float(nearest_stop["latitude"])
        current_lon = float(nearest_stop["longitude"])

    # Add stops without coordinates at the end
    optimized.extend(stops_without_coords)

    # Update sequence numbers
    for idx, stop in enumerate(optimized, start=1):
        stop["sequence"] = idx

    return optimized


def calculate_route_metrics(stops: List[Dict[str, Any]], avg_speed_kmh: float = 40.0) -> Dict[str, float]:
    """
    Calculate total distance and estimated time for a route.

    Args:
        stops: List of stops with coordinates in sequence order
        avg_speed_kmh: Average speed in km/h for time estimation

    Returns:
        Dictionary with totalDistanceKm and estimatedTimeH
    """
    total_distance = 0.0

    for i in range(len(stops) - 1):
        if stops[i].get("latitude") and stops[i].get("longitude") and \
           stops[i+1].get("latitude") and stops[i+1].get("longitude"):
            dist = calculate_distance(
                float(stops[i]["latitude"]), float(stops[i]["longitude"]),
                float(stops[i+1]["latitude"]), float(stops[i+1]["longitude"])
            )
            total_distance += dist

    estimated_time = total_distance / avg_speed_kmh if avg_speed_kmh > 0 else 0.0

    return {
        "totalDistanceKm": round(total_distance, 2),
        "estimatedTimeH": round(estimated_time, 2)
    }


def optimize_route_and_save(
    db: Session,
    route_id: str,
    start_lat: float = 0.0,
    start_lon: float = 0.0,
    avg_speed_kmh: float = 40.0
) -> Dict[str, Any]:
    """
    Optimize an existing route using nearest-neighbor algorithm and update the database.

    Args:
        db: Database session
        route_id: ID of the route to optimize
        start_lat: Starting latitude (warehouse/depot)
        start_lon: Starting longitude (warehouse/depot)
        avg_speed_kmh: Average speed for time estimation

    Returns:
        Optimized route with updated stops
    """
    # Get the route with stops
    route = get_route(db, route_id=route_id)
    if not route:
        raise HTTPException(status_code=404, detail=f"Route with id '{route_id}' not found")

    if not route.stops:
        raise HTTPException(status_code=400, detail="Route has no stops to optimize")

    # Convert stops to dict format for optimization
    stops_data = [_serialize_route_stop(stop) for stop in route.stops]

    # Optimize the route
    optimized_stops = optimize_route_greedy(stops_data, start_lat, start_lon)

    # Update stop sequences in database
    for stop_data in optimized_stops:
        stop = db.query(RouteStop).filter(RouteStop.id == stop_data["id"]).first()
        if stop:
            stop.sequence = stop_data["sequence"]

    # Calculate metrics
    metrics = calculate_route_metrics(optimized_stops, avg_speed_kmh)

    # Update route with new metrics
    route.total_distance_km = Decimal(str(metrics["totalDistanceKm"]))
    route.estimated_time_h = Decimal(str(metrics["estimatedTimeH"]))

    db.commit()
    db.refresh(route)

    return _serialize_route(route)
