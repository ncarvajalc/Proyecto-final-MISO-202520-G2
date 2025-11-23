from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.pagination import build_pagination_metadata, get_pagination_offset
from app.modules.visits.crud import create_visit, list_visits_paginated
from app.modules.visits.schemas import Visit, VisitCreate, VisitsResponse


def create(db: Session, visit: VisitCreate, multimedia_data: Optional[List[dict]] = None) -> Visit:
    """Create a new visit with optional multimedia files."""
    created = create_visit(db, visit, multimedia_data)
    return Visit.model_validate(created)


def list_visits(db: Session, page: int = 1, limit: int = 10) -> VisitsResponse:
    """List all visits with pagination."""
    skip = get_pagination_offset(page, limit)
    result = list_visits_paginated(db, skip=skip, limit=limit)

    total = result["total"]
    visits = [Visit.model_validate(item) for item in result["items"]]

    metadata = build_pagination_metadata(total=total, page=page, limit=limit)

    return VisitsResponse(data=visits, **metadata)
