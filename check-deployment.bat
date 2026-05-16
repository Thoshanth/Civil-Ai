@echo off
REM CivilAI Deployment Status Checker for Windows

echo ==========================================
echo   CivilAI Deployment Status Checker
echo ==========================================
echo.

REM Default URLs (update these with your actual deployment URLs)
set AI_GATEWAY_URL=https://civilai-gateway.onrender.com
set BACKEND_URL=https://civilai-backend.onrender.com
set FRONTEND_URL=https://civilai.vercel.app

echo Checking services...
echo.

REM Check AI Gateway
echo [1] AI Gateway
curl -s %AI_GATEWAY_URL%/health
if %errorlevel%==0 (
    echo [OK] AI Gateway is responding
) else (
    echo [FAIL] AI Gateway is not responding
)
echo.

REM Check Backend
echo [2] Backend
curl -s %BACKEND_URL%/actuator/health
if %errorlevel%==0 (
    echo [OK] Backend is responding
) else (
    echo [FAIL] Backend is not responding
)
echo.

REM Check Frontend
echo [3] Frontend
curl -s -o nul -w "HTTP %%{http_code}" %FRONTEND_URL%
if %errorlevel%==0 (
    echo [OK] Frontend is responding
) else (
    echo [FAIL] Frontend is not responding
)
echo.

echo ==========================================
echo   Service URLs
echo ==========================================
echo.
echo Frontend:   %FRONTEND_URL%
echo Backend:    %BACKEND_URL%
echo AI Gateway: %AI_GATEWAY_URL%
echo.
echo API Documentation:
echo   Swagger UI: %BACKEND_URL%/swagger-ui
echo   OpenAPI:    %BACKEND_URL%/api-docs
echo   AI Docs:    %AI_GATEWAY_URL%/docs
echo.

echo ==========================================
echo   Note
echo ==========================================
echo.
echo Free tier services may sleep after 15 min inactivity.
echo First request may take 30-60 seconds (cold start).
echo.
echo To keep services awake, use a cron job:
echo   https://cron-job.org
echo   Ping every 14 minutes:
echo     - %BACKEND_URL%/actuator/health
echo     - %AI_GATEWAY_URL%/health
echo.

pause
