import os
import tempfile
from fastapi.testclient import TestClient
from app.main import app, static_dir


def test_static_and_spa_fallback():
    # Create temporary static dir with index.html and a test asset
    with tempfile.TemporaryDirectory() as tmpdir:
        index_content = "<html><body>RecipeForge App</body></html>"
        with open(os.path.join(tmpdir, "index.html"), "w", encoding="utf-8") as f:
            f.write(index_content)
        with open(os.path.join(tmpdir, "style.css"), "w", encoding="utf-8") as f:
            f.write("body { background: #f6efe2; }")

        # Temporarily point static_dir to tmpdir and mount route
        import app.main as main_module
        orig_static = main_module.static_dir
        main_module.static_dir = tmpdir

        try:
            client = TestClient(app)

            # Test root with HTML accept header
            resp = client.get("/", headers={"accept": "text/html"})
            assert resp.status_code == 200
            assert "RecipeForge App" in resp.text

            # Test root with JSON accept header (returns API info)
            resp = client.get("/", headers={"accept": "application/json"})
            assert resp.status_code == 200
            assert "Welcome to RecipeForge API" in resp.json()["message"]

            # Test fallback for arbitrary client-side SPA routes
            resp = client.get("/cook-mode", headers={"accept": "text/html"})
            assert resp.status_code == 200
            assert "RecipeForge App" in resp.text

            # Test serving existing static file
            resp = client.get("/style.css")
            assert resp.status_code == 200
            assert "background: #f6efe2" in resp.text

        finally:
            main_module.static_dir = orig_static
