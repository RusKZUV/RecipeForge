def test_shopping_list_and_bought_transfer(client, auth_headers):
    # 1. Add shopping item
    add_resp = client.post(
        "/shopping",
        json={"ingredient_id": "ing-bread", "quantity": 1, "unit": "pcs", "estimated_price_kzt": 180},
        headers=auth_headers,
    )
    assert add_resp.status_code == 201
    shop_id = add_resp.json()["id"]

    # 2. Mark bought -> moves into pantry
    bought_resp = client.post(
        f"/shopping/{shop_id}/bought",
        json={"ingredient_id": "ing-bread", "quantity": 1, "unit": "pcs", "expires_on": "2026-10-30"},
        headers=auth_headers,
    )
    assert bought_resp.status_code == 200

    # 3. Item is now gone from shopping list
    shop_list = client.get("/shopping", headers=auth_headers).json()
    assert all(i["id"] != shop_id for i in shop_list)

    # 4. Item appears in pantry
    pantry_list = client.get("/pantry", headers=auth_headers).json()
    assert any(i["ingredient_id"] == "ing-bread" for i in pantry_list)


def test_cook_completion_pantry_deduction(client, auth_headers):
    # Add an item to pantry with quantity 10
    add_resp = client.post(
        "/pantry",
        json={"ingredient_id": "ing-butter", "quantity": 100, "unit": "g"},
        headers=auth_headers,
    )
    assert add_resp.status_code == 201

    # Cook complete deducting 40g
    cook_resp = client.post(
        "/cook/complete",
        json={
            "recipe_id": "recipe-05-scrambled-eggs-toast",
            "servings": 1,
            "deductions": [{"ingredient_id": "ing-butter", "deduct_quantity": 40, "unit": "g"}],
        },
        headers=auth_headers,
    )
    assert cook_resp.status_code == 200

    # Check pantry quantity is now 60g
    pantry_list = client.get("/pantry", headers=auth_headers).json()
    butter_item = next(i for i in pantry_list if i["ingredient_id"] == "ing-butter")
    assert butter_item["quantity"] == 60
