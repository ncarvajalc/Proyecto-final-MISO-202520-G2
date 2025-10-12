from __future__ import annotations

from backend.test_client import TestClient


def test_bulk_upload_rejects_non_csv_extension(client: TestClient) -> None:
    response = client.post(
        "/proveedores/bulk-upload",
        files={"file": ("proveedores.txt", "contenido", "text/plain")},
    )

    assert response.status_code == 400
    assert "extensión" in response.json()["detail"]


def test_bulk_upload_invalid_csv_structure_returns_error(client: TestClient) -> None:
    response = client.post(
        "/proveedores/bulk-upload",
        files={"file": ("proveedores.csv", "sin_encabezado", "text/csv")},
    )

    assert response.status_code == 400
    assert "encabezados" in response.json()["detail"]
