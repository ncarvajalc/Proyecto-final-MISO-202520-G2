"""Acceptance tests for vehicle module - end-to-end scenarios."""

from __future__ import annotations

from faker import Faker

from app.modules.vehicles.models.vehicle import Vehicle


def test_vehicle_creation_end_to_end(client, db_session, fake: Faker):
    """
    Test complete vehicle creation flow from API to database.

    This test covers the full lifecycle of vehicle creation:
    1. Create vehicle via API
    2. Verify API response
    3. Verify database persistence
    4. Verify vehicle appears in list
    5. Verify duplicate prevention
    """
    # Step 1: Create vehicle via API
    vehicle_payload = {
        "placa": fake.unique.bothify(text="???-###"),
        "conductor": fake.name(),
        "numero_entregas": fake.random_int(min=0, max=20),
    }

    create_response = client.post("/vehiculos/", json=vehicle_payload)
    assert create_response.status_code == 201
    created_vehicle = create_response.json()
    vehicle_id = created_vehicle["id"]

    # Step 2: Verify API response structure and values
    assert created_vehicle["placa"] == vehicle_payload["placa"]
    assert created_vehicle["conductor"] == vehicle_payload["conductor"]
    assert created_vehicle["numeroEntregas"] == vehicle_payload["numero_entregas"]
    assert "id" in created_vehicle and created_vehicle["id"]
    assert "created_at" in created_vehicle and created_vehicle["created_at"]
    assert "updated_at" in created_vehicle and created_vehicle["updated_at"]

    # Step 3: Verify database persistence
    stored_vehicle = db_session.query(Vehicle).filter_by(id=vehicle_id).first()
    assert stored_vehicle is not None
    assert stored_vehicle.placa == vehicle_payload["placa"]
    assert stored_vehicle.conductor == vehicle_payload["conductor"]
    assert stored_vehicle.numero_entregas == vehicle_payload["numero_entregas"]

    # Step 4: Verify vehicle appears in list
    list_response = client.get("/vehiculos/", params={"page": 1, "limit": 10})
    assert list_response.status_code == 200

    paginated = list_response.json()
    assert paginated["total"] >= 1
    assert paginated["total_pages"] >= 1
    assert paginated["page"] == 1
    assert paginated["limit"] == 10

    # Find our vehicle in the list
    vehicle_in_list = None
    for vehicle in paginated["data"]:
        if vehicle["id"] == vehicle_id:
            vehicle_in_list = vehicle
            break

    assert vehicle_in_list is not None
    assert vehicle_in_list["placa"] == vehicle_payload["placa"]
    assert vehicle_in_list["conductor"] == vehicle_payload["conductor"]
    assert vehicle_in_list["numeroEntregas"] == vehicle_payload["numero_entregas"]

    # Step 5: Verify duplicate prevention
    duplicate_response = client.post("/vehiculos/", json=vehicle_payload)
    assert duplicate_response.status_code == 409
    assert (
        f"Vehicle with placa '{vehicle_payload['placa']}' already exists"
        in duplicate_response.json()["detail"]
    )


def test_vehicle_pagination_end_to_end(client, db_session, fake: Faker):
    """
    Test pagination functionality end-to-end.

    This test covers:
    1. Creating multiple vehicles
    2. Retrieving different pages
    3. Verifying correct pagination metadata
    4. Verifying no duplicate vehicles across pages
    """
    # Step 1: Create 7 vehicles
    created_placas = []
    for _ in range(7):
        payload = {
            "placa": fake.unique.bothify(text="???-###"),
            "conductor": fake.name(),
            "numero_entregas": fake.random_int(min=0, max=20),
        }
        response = client.post("/vehiculos/", json=payload)
        assert response.status_code == 201
        created_placas.append(payload["placa"])

    # Step 2: Retrieve first page (3 items)
    page1_response = client.get("/vehiculos/", params={"page": 1, "limit": 3})
    assert page1_response.status_code == 200
    page1 = page1_response.json()

    assert page1["total"] == 7
    assert page1["page"] == 1
    assert page1["limit"] == 3
    assert page1["total_pages"] == 3  # ceil(7/3) = 3
    assert len(page1["data"]) == 3

    # Step 3: Retrieve second page (3 items)
    page2_response = client.get("/vehiculos/", params={"page": 2, "limit": 3})
    assert page2_response.status_code == 200
    page2 = page2_response.json()

    assert page2["total"] == 7
    assert page2["page"] == 2
    assert len(page2["data"]) == 3

    # Step 4: Retrieve third page (1 item)
    page3_response = client.get("/vehiculos/", params={"page": 3, "limit": 3})
    assert page3_response.status_code == 200
    page3 = page3_response.json()

    assert page3["total"] == 7
    assert page3["page"] == 3
    assert len(page3["data"]) == 1

    # Step 5: Verify no duplicates across pages
    all_vehicle_ids = []
    for page in [page1, page2, page3]:
        for vehicle in page["data"]:
            assert (
                vehicle["id"] not in all_vehicle_ids
            ), "Duplicate vehicle across pages"
            all_vehicle_ids.append(vehicle["id"])

    # Step 6: Verify all vehicles are accounted for
    assert len(all_vehicle_ids) == 7

    # Step 7: Verify database count matches
    db_count = db_session.query(Vehicle).count()
    assert db_count == 7


def test_vehicle_validation_end_to_end(client, fake: Faker):
    """
    Test validation scenarios end-to-end.

    This test covers:
    1. Missing required fields
    2. Invalid data types
    3. Business rule validations
    """
    # Test 1: Missing placa
    payload = {
        "conductor": fake.name(),
        "numero_entregas": 5,
    }
    response = client.post("/vehiculos/", json=payload)
    assert response.status_code == 422

    # Test 2: Missing conductor
    payload = {
        "placa": fake.unique.bothify(text="???-###"),
        "numero_entregas": 5,
    }
    response = client.post("/vehiculos/", json=payload)
    assert response.status_code == 422

    # Test 3: Negative numero_entregas
    payload = {
        "placa": fake.unique.bothify(text="???-###"),
        "conductor": fake.name(),
        "numero_entregas": -1,
    }
    response = client.post("/vehiculos/", json=payload)
    assert response.status_code == 422

    # Test 4: Invalid placa (too long)
    payload = {
        "placa": "A" * 30,  # Exceeds max_length
        "conductor": fake.name(),
        "numero_entregas": 5,
    }
    response = client.post("/vehiculos/", json=payload)
    assert response.status_code == 422

    # Test 5: Valid vehicle should succeed
    payload = {
        "placa": fake.unique.bothify(text="???-###"),
        "conductor": fake.name(),
        "numero_entregas": 0,
    }
    response = client.post("/vehiculos/", json=payload)
    assert response.status_code == 201


__all__ = []
