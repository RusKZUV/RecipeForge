@echo off
echo Verifying seed data integrity...
cd /d "%~dp0backend"
call uv run python -m app.seed_check
