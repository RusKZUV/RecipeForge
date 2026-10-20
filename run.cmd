@echo off
echo Starting RecipeForge Backend and Frontend...
start "RecipeForge Backend" cmd /k "cd /d "%~dp0backend" && uv run uvicorn app.main:app --reload --port 8091"
start "RecipeForge Frontend" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"
echo Services started. Backend: http://localhost:8091, Frontend: http://localhost:5173
