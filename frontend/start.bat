@echo off
echo Starting CivilAI Frontend...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
)

echo Starting development server...
echo Frontend will be available at http://localhost:5173
echo.
call npm run dev
