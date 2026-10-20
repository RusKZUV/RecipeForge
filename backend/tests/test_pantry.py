def test_pantry_crud_and_isolation(client, auth_headers):
    # 1. List seeded demo pantry
    resp = client.get("/pantry", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 5

    # 2. Add valid item
    add_resp = client.post(
        "/pantry",
        json={"ingredient_id": "ing-flour", "quantity": 1000, "unit": "g", "expires_on": "2026-11-20"},
        headers=auth_headers,
    )
    assert add_resp.status_code == 201
    item_id = add_resp.json()["id"]
    assert add_resp.json()["quantity"] == 1000

    # 3. Add item with non-positive quantity returns 422
    bad_resp = client.post(
        "/pantry",
        json={"ingredient_id": "ing-flour", "quantity": -5, "unit": "g"},
        headers=auth_headers,
    )
    assert bad_resp.status_code == 422

    # 4. Update item
    patch_resp = client.patch(
        f"/pantry/{item_id}",
        json={"quantity": 750},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["quantity"] == 750

    # 5. Multi-tenant isolation: create User 2 and try accessing User 1's item
    u2_resp = client.post("/auth/register", json={"email": "student2@nu.edu.kz", "password": "Password123"})
    u2_token = u2_resp.json()["token"]["access_token"]
    u2_headers = {"Authorization": f"Bearer {u2_token}"}

    # User 2 shouldn't see User 1's items in their list
    u2_list = client.get("/pantry", headers=u2_headers).json()
    assert all(i["id"] != item_id for i in u2_list)

    # User 2 modifying User 1's item returns 403 Forbidden
    forbidden_resp = client.patch(
        f"/pantry/{item_id}",
        json={"quantity": 100},
        headers=u2_headers,
    )
    assert forbidden_resp.status_code == 403

    # User 2 deleting User 1's item returns 403 Forbidden
    forbidden_del = client.delete(f"/pantry/{item_id}", headers=u2_headers)
    assert forbidden_del.status_code == 403

    # Non-existent item delete returns 404 Not Found
    del_nonexistent = client.delete("/pantry/pantry-non-existent", headers=auth_headers)
    assert del_nonexistent.status_code == 404

    # 6. Delete item
    del_resp = client.delete(f"/pantry/{item_id}", headers=auth_headers)
    assert del_resp.status_code == 200

    # Confirm deleted
    del_again = client.delete(f"/pantry/{item_id}", headers=auth_headers)
    assert del_again.status_code == 404
