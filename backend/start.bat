@echo off
echo ========================================
echo Starting CivilAI Backend
echo ========================================
echo.

cd /d "%~dp0"

echo Checking environment variables...
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file with required variables
    exit /b 1
)

echo Starting Spring Boot application...
echo.

mvn spring-boot:run

pause
