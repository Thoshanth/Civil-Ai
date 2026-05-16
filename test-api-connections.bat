@echo off
echo ========================================
echo CivilAI API Connection Test
echo ========================================
echo.

echo Testing Backend (Java Spring Boot)...
echo.

REM Test 1: Backend Health Check
echo [1/8] Backend Health Check...
curl -s http://localhost:8080/actuator/health
echo.
echo.

REM Test 2: Auth - Registration
echo [2/8] Testing Registration Endpoint...
curl -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"fullName\":\"Test User\"}" ^
  -w "\nStatus: %%{http_code}\n"
echo.
echo.

REM Test 3: Projects (requires auth - will get 403)
echo [3/8] Testing Projects Endpoint (should return 403 without auth)...
curl -s -w "\nStatus: %%{http_code}\n" http://localhost:8080/api/projects
echo.
echo.

echo ========================================
echo Testing AI Gateway (Python FastAPI)...
echo ========================================
echo.

REM Test 4: AI Gateway Health Check
echo [4/8] AI Gateway Health Check...
curl -s http://localhost:8000/health
echo.
echo.

REM Test 5: AI Gateway Root
echo [5/8] AI Gateway Root Endpoint...
curl -s http://localhost:8000/
echo.
echo.

REM Test 6: Geotech Module Health
echo [6/8] Geotech Module Health...
curl -s http://localhost:8000/api/geotech/health
echo.
echo.

REM Test 7: BOQ Module Health
echo [7/8] BOQ Module Health...
curl -s http://localhost:8000/api/boq/health
echo.
echo.

REM Test 8: IS Code Module Health
echo [8/8] IS Code Module Health...
curl -s http://localhost:8000/api/iscode/health
echo.
echo.

echo ========================================
echo API Connection Summary
echo ========================================
echo.
echo Backend (Spring Boot): http://localhost:8080
echo   - Health: /actuator/health
echo   - Auth: /api/auth/**
echo   - Projects: /api/projects (requires auth)
echo   - Documents: /api/documents (requires auth)
echo   - Analysis: /api/analyze/** (requires auth)
echo.
echo AI Gateway (FastAPI): http://localhost:8000
echo   - Health: /health
echo   - Geotech: /api/geotech/analyze
echo   - BOQ: /api/boq/analyze
echo   - Structural: /api/structural/calculate
echo   - Site Photo: /api/site_photo/analyze
echo   - IS Code: /api/iscode/query
echo   - Tender: /api/tender/analyze
echo.
echo Frontend (React): http://localhost:5173
echo   - API Base URL: http://localhost:8080/api
echo.
echo ========================================
echo Test Complete
echo ========================================
pause
