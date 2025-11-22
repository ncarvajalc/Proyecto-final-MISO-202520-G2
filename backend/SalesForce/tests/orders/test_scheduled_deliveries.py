from datetime import date
from decimal import Decimal

from faker import Faker

from app.modules.institutional_clients.models.institutional_client_model import (
    InstitutionalClient,
)
from app.modules.orders.models.order_model import Order
from app.modules.orders.services.order_service import (
    get_scheduled_deliveries_service,
    get_territory_hierarchy,
)
from app.modules.orders.schemas.order import ScheduledDeliveriesResponse
from app.modules.territories.crud.territories_crud import create_territorio, get_territorio
from app.modules.territories.schemas.territories_schemas import TerritoryCreate, TerritoryType


def test_get_scheduled_deliveries_service_enriches_results(db_session, fake: Faker):
    """Service should return pending deliveries enriched with territory data."""
    country = create_territorio(
        db_session,
        TerritoryCreate(name="Colombia", type=TerritoryType.COUNTRY),
    )
    city = create_territorio(
        db_session,
        TerritoryCreate(name="Bogota", type=TerritoryType.CITY, id_parent=country.id),
    )

    client = InstitutionalClient(
        nombre_institucion=fake.company(),
        direccion=fake.street_address(),
        direccion_institucional=fake.unique.company_email(),
        identificacion_tributaria=fake.unique.bothify(text="NIT##########"),
        representante_legal=fake.name(),
        telefono=fake.msisdn(),
        justificacion_acceso="Suministro hospitalario",
        certificado_camara="ZmFrZS1jZXJ0",
        territory_id=str(city.id),
    )
    db_session.add(client)
    db_session.flush()

    # Ensure territories are persisted and retrievable
    assert get_territorio(db_session, country.id) is not None
    assert get_territorio(db_session, city.id) is not None

    matching_order = Order(
        institutional_client_id=client.id,
        order_date=date(2024, 12, 5),
        subtotal=Decimal("100000.00"),
        tax_amount=Decimal("19000.00"),
        total_amount=Decimal("119000.00"),
        status="pending",
    )
    db_session.add(matching_order)
    db_session.add(
        Order(
            institutional_client_id=client.id,
            order_date=date(2024, 12, 4),
            subtotal=Decimal("50000.00"),
            tax_amount=Decimal("9500.00"),
            total_amount=Decimal("59500.00"),
            status="pending",
        )
    )
    db_session.add(
        Order(
            institutional_client_id=client.id,
            order_date=date(2024, 12, 5),
            subtotal=Decimal("70000.00"),
            tax_amount=Decimal("13300.00"),
            total_amount=Decimal("83300.00"),
            status="delivered",
        )
    )
    db_session.commit()

    response = get_scheduled_deliveries_service(
        db_session, delivery_date=date(2024, 12, 5), page=1, limit=10
    )

    assert isinstance(response, ScheduledDeliveriesResponse)
    assert response.total == 1
    assert response.total_pages == 1
    assert response.page == 1
    assert response.limit == 10

    assert len(response.data) == 1
    delivery = response.data[0]
    assert delivery.order_id == matching_order.id
    assert delivery.client_name == client.nombre_institucion
    assert delivery.country == "Colombia"
    assert delivery.city == "Bogota"
    assert delivery.address == client.direccion


def test_get_scheduled_deliveries_service_defaults_when_no_territory(db_session, fake: Faker):
    """Missing territory information should return N/A defaults without failing."""
    client = InstitutionalClient(
        nombre_institucion=fake.company(),
        direccion=fake.street_address(),
        direccion_institucional=fake.unique.company_email(),
        identificacion_tributaria=fake.unique.bothify(text="NIT##########"),
        representante_legal=fake.name(),
        telefono=fake.msisdn(),
        justificacion_acceso="Suministro hospitalario",
        certificado_camara="ZmFrZS1jZXJ0",
        territory_id=None,
    )
    db_session.add(client)
    db_session.flush()

    db_session.add(
        Order(
            institutional_client_id=client.id,
            order_date=date(2024, 11, 15),
            subtotal=Decimal("42000.00"),
            tax_amount=Decimal("7980.00"),
            total_amount=Decimal("49980.00"),
            status="pending",
        )
    )
    db_session.commit()

    response = get_scheduled_deliveries_service(
        db_session, delivery_date=date(2024, 11, 15), page=1, limit=5
    )

    assert response.total == 1
    assert response.total_pages == 1
    assert response.page == 1
    assert response.limit == 5
    assert len(response.data) == 1

    delivery = response.data[0]
    assert delivery.country == "N/A"
    assert delivery.city == "N/A"
    assert delivery.address == client.direccion


def test_get_territory_hierarchy_returns_defaults_for_invalid_id(db_session):
    """Invalid identifiers should not raise and must return default labels."""
    hierarchy = get_territory_hierarchy(db_session, "not-a-uuid")

    assert hierarchy == {"country": "N/A", "city": "N/A"}


def test_get_scheduled_deliveries_endpoint_returns_data(client, db_session, fake: Faker):
    """Endpoint should parse date and return enriched delivery data."""
    country = create_territorio(
        db_session,
        TerritoryCreate(name="Peru", type=TerritoryType.COUNTRY),
    )
    state = create_territorio(
        db_session,
        TerritoryCreate(name="Lima", type=TerritoryType.STATE, id_parent=country.id),
    )
    city = create_territorio(
        db_session,
        TerritoryCreate(name="Miraflores", type=TerritoryType.CITY, id_parent=state.id),
    )

    client_model = InstitutionalClient(
        nombre_institucion=fake.company(),
        direccion=fake.street_address(),
        direccion_institucional=fake.unique.company_email(),
        identificacion_tributaria=fake.unique.bothify(text="NIT##########"),
        representante_legal=fake.name(),
        telefono=fake.msisdn(),
        justificacion_acceso="Suministro hospitalario",
        certificado_camara="ZmFrZS1jZXJ0",
        territory_id=str(city.id),
    )
    db_session.add(client_model)
    db_session.flush()

    db_session.add(
        Order(
            institutional_client_id=client_model.id,
            order_date=date(2024, 10, 20),
            subtotal=Decimal("88000.00"),
            tax_amount=Decimal("16720.00"),
            total_amount=Decimal("104720.00"),
            status="pending",
        )
    )
    db_session.commit()

    response = client.get(
        "/pedidos/entregas-programadas",
        params={"fecha": "20/10/2024", "page": 1, "limit": 5},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["total_pages"] == 1
    assert payload["page"] == 1
    assert payload["limit"] == 5
    assert len(payload["data"]) == 1

    delivery = payload["data"][0]
    assert delivery["client_name"] == client_model.nombre_institucion
    assert delivery["country"] == "Peru"
    assert delivery["city"] == "Miraflores"
    assert delivery["address"] == client_model.direccion


def test_get_scheduled_deliveries_endpoint_validates_date_format(client):
    """Endpoint must reject dates outside the expected DD/MM/YYYY format."""
    response = client.get(
        "/pedidos/entregas-programadas", params={"fecha": "2024-10-20"}
    )

    assert response.status_code == 400
    assert "formato de fecha" in response.json()["detail"].lower()
