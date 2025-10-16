"""Unit tests for shared pagination helpers."""

import pytest
from fastapi import HTTPException

from app.core.pagination import build_pagination_metadata, get_pagination_offset


def test_get_pagination_offset_validates_positive_parameters() -> None:
    with pytest.raises(HTTPException) as exc_info:
        get_pagination_offset(page=0, limit=5)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "page and limit must be greater than zero"

    with pytest.raises(HTTPException) as limit_exc:
        get_pagination_offset(page=1, limit=0)

    assert limit_exc.value.status_code == 400
    assert limit_exc.value.detail == "page and limit must be greater than zero"


def test_get_pagination_offset_calculates_skip() -> None:
    assert get_pagination_offset(page=3, limit=5) == 10


def test_build_pagination_metadata_handles_totals() -> None:
    metadata = build_pagination_metadata(total=23, page=2, limit=5)

    assert metadata == {
        "total": 23,
        "page": 2,
        "limit": 5,
        "total_pages": 5,
    }

    empty = build_pagination_metadata(total=0, page=1, limit=10)
    assert empty["total_pages"] == 0
