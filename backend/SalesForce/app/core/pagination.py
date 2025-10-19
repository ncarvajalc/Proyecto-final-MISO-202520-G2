"""Shared pagination helpers for the SalesForce service."""

from __future__ import annotations

import math
from typing import Dict

from fastapi import HTTPException, status


def get_pagination_offset(page: int, limit: int) -> int:
    """Validate pagination parameters and compute the offset."""

    if page < 1 or limit < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="page and limit must be greater than zero",
        )
    return (page - 1) * limit


def build_pagination_metadata(total: int, page: int, limit: int) -> Dict[str, int]:
    """Return pagination metadata using snake_case keys."""

    total_pages = math.ceil(total / limit) if total else 0
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }
