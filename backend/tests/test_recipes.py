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


def test_get_recipe_details_and_isolation(client, auth_headers):
    # 1. Non-existent recipe returns 404
    resp_404 = client.get("/recipes/non-existent-id-12345", headers=auth_headers)
    assert resp_404.status_code == 404
    assert "not found" in resp_404.json()["detail"].lower()

    # 2. Complete details of a seed recipe
    list_resp = client.get("/recipes?limit=1", headers=auth_headers)
    assert list_resp.status_code == 200
    recipe_id = list_resp.json()["items"][0]["id"]

    detail_resp = client.get(f"/recipes/{recipe_id}", headers=auth_headers)
    assert detail_resp.status_code == 200
    data = detail_resp.json()
    assert data["id"] == recipe_id
    assert "title" in data
    assert "servings" in data
    assert "time_minutes" in data
    assert "equipment" in data
    assert "ingredients" in data
    assert isinstance(data["ingredients"], list)
    if len(data["ingredients"]) > 0:
        first_ing = data["ingredients"][0]
        assert "ingredient_id" in first_ing
        assert "quantity" in first_ing
        assert "unit" in first_ing
        assert "optional" in first_ing
    assert "steps" in data
    assert isinstance(data["steps"], list)
    if len(data["steps"]) > 0:
        first_step = data["steps"][0]
        assert "position" in first_step
        assert "text" in first_step
        assert "timer_seconds" in first_step

    # 3. Multi-tenant isolation for private recipes
    # User A creates a private recipe
    create_resp = client.post(
        "/recipes",
        json={
            "title": "User A Secret Recipe",
            "servings": 2,
            "time_minutes": 20,
            "equipment": ["microwave"],
            "ingredients": [{"ingredient_id": "ing-salt", "quantity": 1, "unit": "g", "optional": False}],
            "steps": [{"position": 1, "text": "Secret step.", "timer_seconds": None}],
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    private_recipe_id = create_resp.json()["id"]

    # Register User B
    reg_resp = client.post("/auth/register", json={"email": "user_b_recipe_test@example.com", "password": "password123"})
    assert reg_resp.status_code in (200, 201)
    user_b_token = reg_resp.json()["token"]["access_token"]
    user_b_headers = {"Authorization": f"Bearer {user_b_token}"}

    # User B attempts to access User A's private recipe -> 403 Forbidden
    forbidden_resp = client.get(f"/recipes/{private_recipe_id}", headers=user_b_headers)
    assert forbidden_resp.status_code == 403
    assert "forbidden" in forbidden_resp.json()["detail"].lower()

