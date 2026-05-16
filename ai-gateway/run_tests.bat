@echo off
REM Run all tests for AI Gateway (Windows)

echo ===================================
echo CivilAI Gateway - Test Suite
echo ===================================

REM Run startup test
echo.
echo 1. Testing startup configuration...
.venv\Scripts\python.exe test_startup.py

REM Run end-to-end tests
echo.
echo 2. Running end-to-end tests...
.venv\Scripts\python.exe test_e2e.py

REM Check if server is running
echo.
echo 3. Checking if server is running...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓ Server is running[0m
    
    REM Run API tests
    echo.
    echo 4. Running API endpoint tests...
    .venv\Scripts\python.exe test_api_endpoints.py
) else (
    echo [31m✗ Server is not running[0m
    echo Start server with: .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
)

echo.
echo ===================================
echo Test suite completed
echo ===================================
pause
