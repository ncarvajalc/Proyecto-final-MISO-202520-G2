from faker import Faker


def test_salesperson_registration_end_to_end_flow(client, fake: Faker):
    payload = {
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "hire_date": fake.date_between(start_date="-2y", end_date="today").isoformat(),
        "status": fake.random_element(("active", "inactive")),
    }

    create_response = client.post("/vendedores/", json=payload)
    assert create_response.status_code == 200
    created = create_response.json()
    salesperson_id = created["id"]

    list_response = client.get("/vendedores/?page=1&limit=5")
    assert list_response.status_code == 200
    body = list_response.json()
    assert body["total"] == 1
    assert any(item["id"] == salesperson_id for item in body["data"])
    assert body["total_pages"] == 1

    detail_response = client.get(f"/vendedores/{salesperson_id}")
    assert detail_response.status_code == 200
    detail_data = detail_response.json()
    assert detail_data["email"] == payload["email"]
    # El endpoint de detalle debe incluir el campo sales_plans
    assert "sales_plans" in detail_data
    # Un vendedor sin planes de venta debe tener una lista vacía
    assert detail_data["sales_plans"] == []

    updated_name = fake.name()
    updated_status = fake.random_element(("active", "inactive"))
    while updated_status == payload["status"]:
        updated_status = fake.random_element(("active", "inactive"))

    update_response = client.put(
        f"/vendedores/{salesperson_id}",
        json={"full_name": updated_name, "status": updated_status},
    )
    assert update_response.status_code == 200
    updated_body = update_response.json()
    assert updated_body["full_name"] == updated_name
    assert updated_body["status"] == updated_status

    delete_response = client.delete(f"/vendedores/{salesperson_id}")
    assert delete_response.status_code == 200

    not_found_response = client.get(f"/vendedores/{salesperson_id}")
    assert not_found_response.status_code == 404
    assert not_found_response.json()["detail"] == "Salespeople not found"
