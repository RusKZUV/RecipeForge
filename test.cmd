@echo off
echo Running RecipeForge test suites...
cd /d "%~dp0backend"
call uv run pytest
if errorlevel 1 exit /b %errorlevel%
cd /d "%~dp0frontend"
call npm.cmd test
if errorlevel 1 exit /b %errorlevel%
echo All backend and frontend tests passed successfully!
