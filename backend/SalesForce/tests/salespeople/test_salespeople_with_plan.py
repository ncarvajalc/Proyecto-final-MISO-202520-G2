from faker import Faker


def test_salesperson_detail_includes_sales_plan(client, fake: Faker):
    """Test that fetching a salesperson with a sales plan returns the plan data"""
    # Create a salesperson
    salesperson_payload = {
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "hire_date": fake.date_between(start_date="-2y", end_date="today").isoformat(),
        "status": "active",
    }
    
    salesperson_response = client.post("/vendedores/", json=salesperson_payload)
    assert salesperson_response.status_code == 200
    salesperson_id = salesperson_response.json()["id"]
    
    # Create a sales plan for this salesperson
    plan_payload = {
        "identificador": fake.unique.bothify(text="PV-####-Q#"),
        "nombre": fake.catch_phrase(),
        "descripcion": fake.text(max_nb_chars=60),
        "periodo": f"{fake.random_int(min=2024, max=2025)}-Q{fake.random_int(min=1, max=4)}",
        "meta": float(round(fake.pyfloat(min_value=50, max_value=500, right_digits=2), 2)),
        "vendedorId": salesperson_id,
    }
    
    plan_response = client.post("/planes-venta/", json=plan_payload)
    assert plan_response.status_code == 200
    
    # Fetch the salesperson detail - should include the sales plan
    detail_response = client.get(f"/vendedores/{salesperson_id}")
    assert detail_response.status_code == 200
    
    detail_data = detail_response.json()
    assert detail_data["id"] == salesperson_id
    assert detail_data["email"] == salesperson_payload["email"]
    
    # Verify sales_plans field exists and contains the plan
    assert "sales_plans" in detail_data
    assert len(detail_data["sales_plans"]) == 1
    
    plan_data = detail_data["sales_plans"][0]
    assert plan_data["identificador"] == plan_payload["identificador"]
    assert plan_data["nombre"] == plan_payload["nombre"]
    assert plan_data["descripcion"] == plan_payload["descripcion"]
    assert plan_data["periodo"] == plan_payload["periodo"]
    assert plan_data["meta"] == plan_payload["meta"]
    # The field uses camelCase in the response due to alias
    assert plan_data["unidadesVendidas"] == 0  # Default value for new plans
    
