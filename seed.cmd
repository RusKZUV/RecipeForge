@echo off
echo Seeding RecipeForge SQLite database...
cd /d "%~dp0backend"
call uv run python -m app.seed
