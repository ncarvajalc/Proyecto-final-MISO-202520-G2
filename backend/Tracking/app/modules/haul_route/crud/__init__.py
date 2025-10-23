"""CRUD operations for haul route."""

from .crud_route import (
    get_route,
    get_routes_by_vehicle,
    get_routes_all,
    create_route,
    update_route,
    delete_route,
)
from .crud_route_stop import (
    get_route_stop,
    get_route_stops_by_route,
    create_route_stop,
    update_route_stop,
    delete_route_stop,
    create_route_stops_bulk,
)

__all__ = [
    "get_route",
    "get_routes_by_vehicle",
    "get_routes_all",
    "create_route",
    "update_route",
    "delete_route",
    "get_route_stop",
    "get_route_stops_by_route",
    "create_route_stop",
    "update_route_stop",
    "delete_route_stop",
    "create_route_stops_bulk",
]
