"""Unit tests for the VisitMultimedia ORM model."""

from __future__ import annotations

import importlib
from datetime import datetime, timezone

import pytest


def _require_visit_multimedia_model():
    try:
        module = importlib.import_module("app.modules.visits.models")
    except ModuleNotFoundError:  # pragma: no cover - feature not implemented yet
        pytest.skip("VisitMultimedia model not implemented yet")
    VisitMultimedia = getattr(module, "VisitMultimedia", None)
    if VisitMultimedia is None:
        pytest.skip("VisitMultimedia model not implemented yet")
    return VisitMultimedia


def test_visit_multimedia_model_creation():
    """Test that VisitMultimedia model can be instantiated with required fields."""
    VisitMultimedia = _require_visit_multimedia_model()

    file_data = b"fake image data"
    multimedia = VisitMultimedia(
        visit_id="visit-123",
        file_name="test_image.jpg",
        file_type="image/jpeg",
        file_size=len(file_data),
        file_data=file_data,
    )

    assert multimedia.visit_id == "visit-123"
    assert multimedia.file_name == "test_image.jpg"
    assert multimedia.file_type == "image/jpeg"
    assert multimedia.file_size == len(file_data)
    assert multimedia.file_data == file_data


def test_visit_multimedia_model_stores_binary_data():
    """Test that VisitMultimedia can store various binary file types."""
    VisitMultimedia = _require_visit_multimedia_model()

    # Simulate video file
    video_data = b"\x00\x00\x00\x18ftypmp42"
    multimedia = VisitMultimedia(
        visit_id="visit-456",
        file_name="test_video.mp4",
        file_type="video/mp4",
        file_size=len(video_data),
        file_data=video_data,
    )

    assert multimedia.file_type == "video/mp4"
    assert multimedia.file_data == video_data
    assert len(multimedia.file_data) == multimedia.file_size
