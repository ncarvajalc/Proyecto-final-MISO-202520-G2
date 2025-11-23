"""Shared helpers for order-related tests (HUP-021)."""

from __future__ import annotations

from typing import Any, Dict, List

import pytest
from faker import Faker

from app.modules.institutional_clients.models import InstitutionalClient
from app.modules.orders.services import order_service
import httpx


@pytest.fixture()
def institutional_client_factory(db_session, fake: Faker):
    """Persist an institutional client with sensible defaults."""

    def _create(**overrides) -> InstitutionalClient:
        payload = {
            "nombre_institucion": overrides.get("nombre_institucion", fake.company()),
            "direccion": overrides.get("direccion", fake.street_address().replace("\n", " ")),
            "direccion_institucional": overrides.get(
                "direccion_institucional", fake.unique.company_email()
            ),
            "identificacion_tributaria": overrides.get(
                "identificacion_tributaria", fake.unique.bothify(text="NIT##########")
            ),
            "representante_legal": overrides.get("representante_legal", fake.name()),
            "telefono": overrides.get("telefono", fake.msisdn()),
            "justificacion_acceso": overrides.get(
                "justificacion_acceso", "Abastecimiento de insumos médicos"
            ),
            "certificado_camara": overrides.get("certificado_camara", "ZmFrZS1jZXJ0"),
            "territory_id": overrides.get("territory_id"),
        }
        client = InstitutionalClient(**payload)
        db_session.add(client)
        db_session.commit()
        db_session.refresh(client)
        return client

    return _create


@pytest.fixture()
def mock_order_integrations(monkeypatch):
    """
    Stub out the cross-service calls for product lookup and inventory validation.
    """

    catalog: Dict[int, Dict[str, Any]] = {}
    async def fake_validate_product(product_id: int):
        product = catalog.get(product_id)
        if not product:
            raise AssertionError(f"Product {product_id} not stubbed for this test.")
        return {
            "id": product_id,
            "nombre": product["nombre"],
            "precio": str(product["precio"]),
            "sku": product.get("sku", f"SKU-{product_id}"),
        }

    async def fake_validate_inventory(product_id: int, quantity: int):
        product = catalog.get(product_id)
        stock = product.get("stock", 10_000) if product else 0
        return quantity <= stock

    monkeypatch.setattr(order_service, "validate_product", fake_validate_product)
    monkeypatch.setattr(order_service, "validate_inventory", fake_validate_inventory)

    class FakeResponse:
        def __init__(self, url: str, status_code: int, payload: Any):
            self.url = url
            self.status_code = status_code
            self._payload = payload

        def json(self):
            return self._payload

        def raise_for_status(self):
            if self.status_code >= 400:
                request = httpx.Request("GET", self.url)
                raise httpx.HTTPStatusError("mocked error", request=request, response=self)

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url: str, **kwargs):
            if "/productos/" in url:
                product_id = int(url.rstrip("/").split("/")[-1])
                product = catalog.get(product_id)
                if not product:
                    return FakeResponse(url, 404, {"detail": "not found"})
                payload = {
                    "id": product_id,
                    "nombre": product["nombre"],
                    "precio": str(product["precio"]),
                    "sku": product.get("sku", f"SKU-{product_id}"),
                }
                return FakeResponse(url, 200, payload)

            if "/inventario/producto/" in url:
                sku = url.rstrip("/").split("/")[-1]
                quantities: List[Dict[str, Any]] = []
                for product_id, product in catalog.items():
                    product_sku = product.get("sku", f"SKU-{product_id}")
                    if product_sku == sku:
                        quantities.append({"warehouse": "mock", "quantity": product.get("stock", 0)})
                return FakeResponse(url, 200, quantities or [{"warehouse": "mock", "quantity": 0}])

            return FakeResponse(url, 404, {"detail": "unknown url"})

        async def post(self, url: str, json: Dict[str, Any] | None = None, **kwargs):
            if url.endswith("/productos/by-ids"):
                ids = (json or {}).get("product_ids", [])
                data = []
                for product_id in ids:
                    product = catalog.get(product_id)
                    if not product:
                        continue
                    data.append(
                        {
                            "id": product_id,
                            "nombre": product["nombre"],
                            "precio": str(product["precio"]),
                            "imagen": product.get("imagen"),
                        }
                    )
                return FakeResponse(url, 200, {"data": data})
            return FakeResponse(url, 404, {"detail": "unknown url"})

    monkeypatch.setattr(order_service, "httpx", httpx)
    monkeypatch.setattr(order_service.httpx, "AsyncClient", FakeAsyncClient)

    return catalog

