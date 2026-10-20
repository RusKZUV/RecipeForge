def test_recipe_matching(client, auth_headers):
    # 1. Matches endpoint with demo pantry
    resp = client.get("/matches", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert len(data["items"]) >= 1

    first_match = data["items"][0]
    assert "score" in first_match
    assert "coverage" in first_match
    assert "urgency" in first_match
    assert 0 <= first_match["score"] <= 1.0


def test_matching_dietary_hard_filter(client):
    # Register a strict vegan user
    reg = client.post("/auth/register", json={"email": "vegan@nu.edu.kz", "password": "Password123"})
    token = reg.json()["token"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Set dietary filter to vegan
    client.patch("/auth/profile", json={"dietary_filters": ["vegan"]}, headers=headers)

    matches_resp = client.get("/matches", headers=headers)
    assert matches_resp.status_code == 200
    items = matches_resp.json()["items"]

    # Verify no recipes with meat or animal products are included
    for item in items:
        for ing in item["recipe"]["ingredients"]:
            assert ing["ingredient_id"] not in ["ing-chicken", "ing-minced-beef", "ing-eggs", "ing-milk"]
