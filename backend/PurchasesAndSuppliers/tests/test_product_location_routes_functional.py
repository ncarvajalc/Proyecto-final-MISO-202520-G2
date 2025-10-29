"""Functional tests for product location routes."""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from faker import Faker


@pytest.fixture
def mock_httpx_client():
    """Mock httpx.AsyncClient for testing external service calls."""
    with patch("httpx.AsyncClient") as mock_client:
        yield mock_client


def test_get_product_location_success(client, mock_httpx_client, fake: Faker):
    """Test GET /productos/localizacion returns product location successfully."""
    sku = "MED-12345"
    warehouse_id = fake.uuid4()
    warehouse_name = "Bogotá-1"

    # Create mock responses
    inventory_response = MagicMock()
    inventory_response.status_code = 200
    inventory_response.json.return_value = {
        "data": [
            {
                "product_id": sku,
                "warehouse_id": warehouse_id,
                "zona": "A1-3",
                "storage_type": "cold"
            }
        ]
    }

    warehouse_response = MagicMock()
    warehouse_response.status_code = 200
    warehouse_response.json.return_value = {
        "id": warehouse_id,
        "nombre": warehouse_name,
        "ubicacion": "Bogotá"
    }

    # Setup mock client
    mock_instance = MagicMock()
    mock_instance.get = AsyncMock(side_effect=[inventory_response, warehouse_response])
    mock_httpx_client.return_value.__aenter__.return_value = mock_instance

    response = client.get(f"/productos/localizacion?sku={sku}")

    assert response.status_code == 200
    data = response.json()
    assert data["sku"] == sku
    assert data["bodega"] == warehouse_name
    assert data["zona"] == "A1-3"
    assert data["encontrado"] is True


def test_get_product_location_not_found(client, mock_httpx_client):
    """Test GET /productos/localizacion when product is not found."""
    sku = "MED-NOTFOUND"

    inventory_response = MagicMock()
    inventory_response.status_code = 200
    inventory_response.json.return_value = {"data": []}

    mock_instance = MagicMock()
    mock_instance.get = AsyncMock(return_value=inventory_response)
    mock_httpx_client.return_value.__aenter__.return_value = mock_instance

    response = client.get(f"/productos/localizacion?sku={sku}")

    assert response.status_code == 200
    data = response.json()
    assert data["sku"] == sku
    assert data["bodega"] == ""
    assert data["zona"] == ""
    assert data["encontrado"] is False


def test_get_product_location_missing_sku(client):
    """Test GET /productos/localizacion validates required sku parameter."""
    response = client.get("/productos/localizacion")

    assert response.status_code == 422  # Unprocessable Entity


def test_get_product_location_empty_sku(client):
    """Test GET /productos/localizacion rejects empty sku."""
    response = client.get("/productos/localizacion?sku=")

    assert response.status_code == 400
    assert "no puede estar vacío" in response.json()["detail"]


def test_get_product_location_in_warehouse_success(client, mock_httpx_client, fake: Faker):
    """Test GET /productos/localizacion-bodega returns product location in specific warehouse."""
    sku = "MED-12345"
    warehouse_id = fake.uuid4()
    warehouse_name = "Medellín-1"

    inventory_response = MagicMock()
    inventory_response.status_code = 200
    inventory_response.json.return_value = {
        "data": [
            {
                "product_id": sku,
                "warehouse_id": warehouse_id,
                "zona": "B2-5",
                "storage_type": "general"
            }
        ]
    }

    warehouse_response = MagicMock()
    warehouse_response.status_code = 200
    warehouse_response.json.return_value = {
        "id": warehouse_id,
        "nombre": warehouse_name,
        "ubicacion": "Medellín"
    }

    mock_instance = MagicMock()
    mock_instance.get = AsyncMock(side_effect=[inventory_response, warehouse_response])
    mock_httpx_client.return_value.__aenter__.return_value = mock_instance

    response = client.get(
        f"/productos/localizacion-bodega?sku={sku}&bodegaId={warehouse_id}"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["sku"] == sku
    assert data["bodega"] == warehouse_name
    assert data["zona"] == "B2-5"
    assert data["encontrado"] is True


def test_get_product_location_in_warehouse_not_found(client, mock_httpx_client, fake: Faker):
    """Test GET /productos/localizacion-bodega when product not in warehouse."""
    sku = "MED-12345"
    warehouse_id = fake.uuid4()
    warehouse_name = "Cali-1"

    inventory_response = MagicMock()
    inventory_response.status_code = 200
    inventory_response.json.return_value = {"data": []}

    warehouse_response = MagicMock()
    warehouse_response.status_code = 200
    warehouse_response.json.return_value = {
        "id": warehouse_id,
        "nombre": warehouse_name,
        "ubicacion": "Cali"
    }

    mock_instance = MagicMock()
    mock_instance.get = AsyncMock(side_effect=[inventory_response, warehouse_response])
    mock_httpx_client.return_value.__aenter__.return_value = mock_instance

    response = client.get(
        f"/productos/localizacion-bodega?sku={sku}&bodegaId={warehouse_id}"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["sku"] == sku
    assert data["bodega"] == warehouse_name
    assert data["zona"] == ""
    assert data["encontrado"] is False


def test_get_product_location_in_warehouse_warehouse_not_found(client, mock_httpx_client, fake: Faker):
    """Test GET /productos/localizacion-bodega when warehouse doesn't exist."""
    sku = "MED-12345"
    warehouse_id = fake.uuid4()

    inventory_response = MagicMock()
    inventory_response.status_code = 200
    inventory_response.json.return_value = {"data": []}

    warehouse_response = MagicMock()
    warehouse_response.status_code = 404

    mock_instance = MagicMock()
    mock_instance.get = AsyncMock(side_effect=[inventory_response, warehouse_response])
    mock_httpx_client.return_value.__aenter__.return_value = mock_instance

    response = client.get(
        f"/productos/localizacion-bodega?sku={sku}&bodegaId={warehouse_id}"
    )

    assert response.status_code == 404
    assert "Bodega no encontrada" in response.json()["detail"]


def test_get_product_location_in_warehouse_missing_params(client):
    """Test GET /productos/localizacion-bodega validates required parameters."""
    # Missing both params
    response = client.get("/productos/localizacion-bodega")
    assert response.status_code == 422

    # Missing bodegaId
    response = client.get("/productos/localizacion-bodega?sku=MED-12345")
    assert response.status_code == 422

    # Missing sku
    response = client.get("/productos/localizacion-bodega?bodegaId=123")
    assert response.status_code == 422


def test_get_product_location_in_warehouse_empty_params(client, fake: Faker):
    """Test GET /productos/localizacion-bodega rejects empty parameters."""
    response = client.get("/productos/localizacion-bodega?sku=&bodegaId=123")
    assert response.status_code == 400

    response = client.get("/productos/localizacion-bodega?sku=MED-12345&bodegaId=")
    assert response.status_code == 400


def test_get_product_location_inventory_service_error(client, mock_httpx_client):
    """Test GET /productos/localizacion handles inventory service errors."""
    sku = "MED-12345"

    inventory_response = MagicMock()
    inventory_response.status_code = 500

    mock_instance = MagicMock()
    mock_instance.get = AsyncMock(return_value=inventory_response)
    mock_httpx_client.return_value.__aenter__.return_value = mock_instance

    response = client.get(f"/productos/localizacion?sku={sku}")

    assert response.status_code == 500
    assert "Error al consultar el servicio de inventario" in response.json()["detail"]


def test_get_product_location_connection_error(client, mock_httpx_client):
    """Test GET /productos/localizacion handles connection errors."""
    import httpx

    sku = "MED-12345"

    mock_instance = MagicMock()
    mock_instance.get = AsyncMock(side_effect=httpx.ConnectError("Connection failed"))
    mock_httpx_client.return_value.__aenter__.return_value = mock_instance

    response = client.get(f"/productos/localizacion?sku={sku}")

    assert response.status_code == 500
    assert "No se pudo conectar al servicio de inventario" in response.json()["detail"]


__all__ = []
