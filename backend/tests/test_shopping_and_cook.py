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


def test_shopping_crud_and_tenant_isolation(client, auth_headers):
    # 1. Reject non-positive quantity with 422
    bad_resp = client.post(
        "/shopping",
        json={"ingredient_id": "ing-bread", "quantity": 0, "unit": "pcs"},
        headers=auth_headers,
    )
    assert bad_resp.status_code == 422

    bad_resp_neg = client.post(
        "/shopping",
        json={"ingredient_id": "ing-bread", "quantity": -3, "unit": "pcs"},
        headers=auth_headers,
    )
    assert bad_resp_neg.status_code == 422

    # 2. Add valid shopping item
    add_resp = client.post(
        "/shopping",
        json={"ingredient_id": "ing-bread", "quantity": 2, "unit": "pcs", "source_recipes": ["recipe-1"]},
        headers=auth_headers,
    )
    assert add_resp.status_code == 201
    item_id = add_resp.json()["id"]
    assert add_resp.json()["quantity"] == 2
    assert add_resp.json()["source_recipes"] == ["recipe-1"]

    # 3. GET /shopping returns user's items
    get_resp = client.get("/shopping", headers=auth_headers)
    assert get_resp.status_code == 200
    items = get_resp.json()
    assert any(i["id"] == item_id for i in items)

    # 4. Multi-tenant isolation: create User 2
    u2_resp = client.post("/auth/register", json={"email": "shopper2@nu.edu.kz", "password": "Password123"})
    u2_token = u2_resp.json()["token"]["access_token"]
    u2_headers = {"Authorization": f"Bearer {u2_token}"}

    # User 2 list does not contain User 1's shopping item
    u2_list = client.get("/shopping", headers=u2_headers).json()
    assert all(i["id"] != item_id for i in u2_list)

    # User 2 cannot delete User 1's shopping item (403 Forbidden)
    forbidden_del = client.delete(f"/shopping/{item_id}", headers=u2_headers)
    assert forbidden_del.status_code == 403

    # User 2 cannot mark User 1's shopping item as bought (403 Forbidden)
    forbidden_bought = client.post(f"/shopping/{item_id}/bought", headers=u2_headers)
    assert forbidden_bought.status_code == 403

    # 5. Non-existent item operations return 404
    assert client.delete("/shopping/non-existent-shop-id", headers=auth_headers).status_code == 404
    assert client.post("/shopping/non-existent-shop-id/bought", headers=auth_headers).status_code == 404

    # 6. User 1 successfully deletes shopping item
    del_resp = client.delete(f"/shopping/{item_id}", headers=auth_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["message"] == "Shopping item deleted successfully"

    # Confirm item is gone
    del_again = client.delete(f"/shopping/{item_id}", headers=auth_headers)
    assert del_again.status_code == 404


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
