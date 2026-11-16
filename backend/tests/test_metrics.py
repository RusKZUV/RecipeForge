import pytest
from unittest.mock import patch
from metrics import (
    recipeforge_recipes_created_total,
    recipeforge_pantry_match_requests_total,
    recipeforge_pantry_match_duration_seconds,
    HISTOGRAM_BUCKETS,
)


def test_metrics_definitions():
    # Verify bucket boundaries
    assert recipeforge_pantry_match_duration_seconds.buckets == [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    assert HISTOGRAM_BUCKETS == [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    
    # Test Counter operations (both otel and prometheus style)
    recipeforge_recipes_created_total.add(1, {"environment": "test"})
    recipeforge_recipes_created_total.labels(environment="production").inc()
    
    recipeforge_pantry_match_requests_total.add(1)
    recipeforge_pantry_match_requests_total.inc()
    
    # Test Histogram operations
    recipeforge_pantry_match_duration_seconds.record(0.04)
    recipeforge_pantry_match_duration_seconds.observe(0.12)
    
    with recipeforge_pantry_match_duration_seconds.time():
        pass


def test_endpoint_metric_integration(client, auth_headers):
    # 1. Test POST /recipes triggers recipeforge_recipes_created_total
    with patch.object(recipeforge_recipes_created_total, "add", wraps=recipeforge_recipes_created_total.add) as mock_recipe_metric:
        recipe_resp = client.post("/recipes", json={
            "title": "Metrics Test Recipe",
            "servings": 2,
            "time_minutes": 15,
            "equipment": ["pot"],
            "ingredients": [
                {
                    "ingredient_id": "ing_salt",
                    "custom_name": "Salt",
                    "quantity": 5.0,
                    "unit": "g",
                    "optional": False,
                }
            ],
            "steps": [
                {
                    "position": 1,
                    "text": "Add salt to water",
                    "timer_seconds": 60,
                }
            ],
        }, headers=auth_headers)
        assert recipe_resp.status_code == 201
        assert mock_recipe_metric.called
        call_args = mock_recipe_metric.call_args
        assert call_args[0][0] == 1
        assert "environment" in call_args[0][1]

    # 2. Test GET /pantry/match triggers match metrics
    with patch.object(recipeforge_pantry_match_requests_total, "add", wraps=recipeforge_pantry_match_requests_total.add) as mock_match_req, \
         patch.object(recipeforge_pantry_match_duration_seconds, "record", wraps=recipeforge_pantry_match_duration_seconds.record) as mock_match_dur:
        
        match_resp = client.get("/pantry/match", headers=auth_headers)
        assert match_resp.status_code == 200
        assert mock_match_req.called
        assert mock_match_dur.called

    # 3. Test GET /matches also triggers match metrics
    with patch.object(recipeforge_pantry_match_requests_total, "add", wraps=recipeforge_pantry_match_requests_total.add) as mock_match_req, \
         patch.object(recipeforge_pantry_match_duration_seconds, "record", wraps=recipeforge_pantry_match_duration_seconds.record) as mock_match_dur:
        
        match_resp = client.get("/matches", headers=auth_headers)
        assert match_resp.status_code == 200
        assert mock_match_req.called
        assert mock_match_dur.called
