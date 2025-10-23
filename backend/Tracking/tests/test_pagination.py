"""Unit tests for pagination helpers."""

from __future__ import annotations

import math

import pytest
from fastapi import HTTPException

from app.core.pagination import build_pagination_metadata, get_pagination_offset


def test_get_pagination_offset_calculates_correct_offset():
    """Test that get_pagination_offset calculates the correct offset."""
    assert get_pagination_offset(page=1, limit=10) == 0
    assert get_pagination_offset(page=2, limit=10) == 10
    assert get_pagination_offset(page=3, limit=10) == 20
    assert get_pagination_offset(page=1, limit=5) == 0
    assert get_pagination_offset(page=2, limit=5) == 5
    assert get_pagination_offset(page=5, limit=20) == 80


def test_get_pagination_offset_rejects_invalid_page():
    """Test that get_pagination_offset rejects invalid page numbers."""
    with pytest.raises(HTTPException) as exc_info:
        get_pagination_offset(page=0, limit=10)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "page and limit must be greater than zero"

    with pytest.raises(HTTPException) as exc_info:
        get_pagination_offset(page=-1, limit=10)

    assert exc_info.value.status_code == 400


def test_get_pagination_offset_rejects_invalid_limit():
    """Test that get_pagination_offset rejects invalid limit values."""
    with pytest.raises(HTTPException) as exc_info:
        get_pagination_offset(page=1, limit=0)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "page and limit must be greater than zero"

    with pytest.raises(HTTPException) as exc_info:
        get_pagination_offset(page=1, limit=-5)

    assert exc_info.value.status_code == 400


def test_build_pagination_metadata_returns_correct_structure():
    """Test that build_pagination_metadata returns correct structure."""
    result = build_pagination_metadata(total=100, page=1, limit=10)

    assert result["total"] == 100
    assert result["page"] == 1
    assert result["limit"] == 10
    assert result["total_pages"] == 10


def test_build_pagination_metadata_calculates_total_pages():
    """Test that build_pagination_metadata calculates total_pages correctly."""
    # Exact division
    result = build_pagination_metadata(total=100, page=1, limit=10)
    assert result["total_pages"] == 10

    # With remainder (should round up)
    result = build_pagination_metadata(total=105, page=1, limit=10)
    assert result["total_pages"] == 11

    result = build_pagination_metadata(total=7, page=1, limit=3)
    assert result["total_pages"] == 3  # ceil(7/3) = 3

    result = build_pagination_metadata(total=1, page=1, limit=10)
    assert result["total_pages"] == 1


def test_build_pagination_metadata_handles_zero_total():
    """Test that build_pagination_metadata handles zero total correctly."""
    result = build_pagination_metadata(total=0, page=1, limit=10)

    assert result["total"] == 0
    assert result["page"] == 1
    assert result["limit"] == 10
    assert result["total_pages"] == 0


def test_build_pagination_metadata_handles_large_numbers():
    """Test that build_pagination_metadata handles large numbers correctly."""
    result = build_pagination_metadata(total=10000, page=50, limit=100)

    assert result["total"] == 10000
    assert result["page"] == 50
    assert result["limit"] == 100
    assert result["total_pages"] == 100


def test_build_pagination_metadata_handles_different_page_sizes():
    """Test that build_pagination_metadata works with various page sizes."""
    total = 50

    # Page size 1
    result = build_pagination_metadata(total=total, page=1, limit=1)
    assert result["total_pages"] == 50

    # Page size 5
    result = build_pagination_metadata(total=total, page=1, limit=5)
    assert result["total_pages"] == 10

    # Page size 25
    result = build_pagination_metadata(total=total, page=1, limit=25)
    assert result["total_pages"] == 2

    # Page size larger than total
    result = build_pagination_metadata(total=total, page=1, limit=100)
    assert result["total_pages"] == 1


def test_pagination_workflow():
    """Test complete pagination workflow."""
    total_items = 25
    page_size = 10

    # Page 1
    offset_1 = get_pagination_offset(page=1, limit=page_size)
    metadata_1 = build_pagination_metadata(total=total_items, page=1, limit=page_size)

    assert offset_1 == 0
    assert metadata_1["total_pages"] == 3
    assert metadata_1["page"] == 1

    # Page 2
    offset_2 = get_pagination_offset(page=2, limit=page_size)
    metadata_2 = build_pagination_metadata(total=total_items, page=2, limit=page_size)

    assert offset_2 == 10
    assert metadata_2["total_pages"] == 3
    assert metadata_2["page"] == 2

    # Page 3 (last page with only 5 items)
    offset_3 = get_pagination_offset(page=3, limit=page_size)
    metadata_3 = build_pagination_metadata(total=total_items, page=3, limit=page_size)

    assert offset_3 == 20
    assert metadata_3["total_pages"] == 3
    assert metadata_3["page"] == 3


__all__ = []
