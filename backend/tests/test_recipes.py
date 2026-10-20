def test_recipes_list_and_seed_protection(client, auth_headers):
    # 1. List recipes returns seed recipes
    resp = client.get("/recipes?limit=50", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 50
    assert len(data["items"]) >= 20

    seed_recipe = data["items"][0]
    assert seed_recipe["is_seed"] is True
    seed_id = seed_recipe["id"]

    # 2. Detail view
    detail_resp = client.get(f"/recipes/{seed_id}", headers=auth_headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == seed_id
    assert len(detail_resp.json()["steps"]) >= 1

    # 3. Cannot edit or delete seed recipe
    edit_resp = client.patch(f"/recipes/{seed_id}", json={"title": "Hacked"}, headers=auth_headers)
    assert edit_resp.status_code == 403

    del_resp = client.delete(f"/recipes/{seed_id}", headers=auth_headers)
    assert del_resp.status_code == 403


def test_user_recipe_creation_and_validation(client, auth_headers):
    # Missing title returns 422
    bad_resp = client.post(
        "/recipes",
        json={"title": " ", "servings": 1, "time_minutes": 10, "equipment": [], "ingredients": [], "steps": []},
        headers=auth_headers,
    )
    assert bad_resp.status_code == 422

    # Valid user recipe
    valid_payload = {
        "title": "My Dorm Omelette",
        "servings": 1,
        "time_minutes": 8,
        "equipment": ["stovetop"],
        "ingredients": [
            {"ingredient_id": "ing-eggs", "quantity": 2, "unit": "pcs", "optional": False},
            {"ingredient_id": "ing-salt", "quantity": 2, "unit": "g", "optional": False},
        ],
        "steps": [
            {"position": 1, "text": "Beat eggs with salt.", "timer_seconds": None},
            {"position": 2, "text": "Cook on pan for 3 minutes.", "timer_seconds": 180},
        ],
    }
    create_resp = client.post("/recipes", json=valid_payload, headers=auth_headers)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["title"] == "My Dorm Omelette"
    assert created["is_seed"] is False
    rec_id = created["id"]

    # Edit user recipe
    patch_resp = client.patch(f"/recipes/{rec_id}", json={"title": "Updated Omelette"}, headers=auth_headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["title"] == "Updated Omelette"

    # Delete user recipe
    del_resp = client.delete(f"/recipes/{rec_id}", headers=auth_headers)
    assert del_resp.status_code == 200
