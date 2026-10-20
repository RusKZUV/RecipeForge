def test_register_and_login_flow(client):
    email = "newstudent@nu.edu.kz"
    password = "SuperSecretPassword123"

    # Register
    reg_resp = client.post("/auth/register", json={"email": email, "password": password, "default_servings": 2})
    assert reg_resp.status_code == 200
    data = reg_resp.json()
    assert data["user"]["email"] == email
    assert data["user"]["default_servings"] == 2
    assert "access_token" in data["token"]
    token = data["token"]["access_token"]

    # Duplicate register returns 409
    dup_resp = client.post("/auth/register", json={"email": email, "password": password})
    assert dup_resp.status_code == 409

    # Login
    login_resp = client.post("/auth/login", json={"email": email, "password": password})
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()["token"]

    # Invalid login returns generic error
    bad_login = client.post("/auth/login", json={"email": email, "password": "WrongPassword"})
    assert bad_login.status_code == 401
    assert "Invalid email or password" in bad_login.json()["detail"]

    # Get me
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email

    # Update profile
    patch_resp = client.patch(
        "/auth/profile",
        json={"default_servings": 3, "dietary_filters": ["vegetarian"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["default_servings"] == 3
    assert "vegetarian" in patch_resp.json()["dietary_filters"]

    # Delete account
    del_resp = client.delete("/auth/account", headers={"Authorization": f"Bearer {token}"})
    assert del_resp.status_code == 200

    # Token is now invalid
    me_after_del = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_after_del.status_code == 401


def test_unauthorized_access(client):
    resp = client.get("/pantry")
    assert resp.status_code == 401
