@echo off
REM CivilAI Deployment Helper for Windows

echo ========================================
echo    CivilAI Deployment Helper
echo ========================================
echo.

:menu
echo What would you like to do?
echo.
echo 1) Show deployment guide
echo 2) Generate environment variable templates
echo 3) Test local setup
echo 4) Open deployment documentation
echo 5) Exit
echo.
set /p choice="Enter choice [1-5]: "

if "%choice%"=="1" goto guide
if "%choice%"=="2" goto generate
if "%choice%"=="3" goto test
if "%choice%"=="4" goto docs
if "%choice%"=="5" goto exit
echo Invalid choice
goto menu

:guide
echo.
echo ========================================
echo    Deployment Steps
echo ========================================
echo.
echo 1. Database Setup (Neon.tech)
echo    - Go to https://neon.tech
echo    - Create project: 'civilai'
echo    - Copy connection string
echo.
echo 2. File Storage Setup (Cloudflare R2)
echo    - Go to https://cloudflare.com
echo    - Create R2 bucket: 'civilai-files'
echo    - Generate API token
echo.
echo 3. Get API Keys
echo    - Groq: https://console.groq.com
echo    - Gemini: https://aistudio.google.com/app/apikey
echo    - HuggingFace: https://huggingface.co/settings/tokens
echo.
echo 4. Deploy AI Gateway (Render.com)
echo    - Go to https://render.com
echo    - New Web Service - Connect GitHub
echo    - Select 'ai-gateway' folder
echo    - Use ai-gateway/render.yaml config
echo.
echo 5. Deploy Backend (Render.com)
echo    - New Web Service - Connect GitHub
echo    - Select 'backend' folder
echo    - Use backend/render.yaml config
echo.
echo 6. Deploy Frontend (Vercel)
echo    - Go to https://vercel.com
echo    - Import GitHub repository
echo    - Select 'frontend' folder
echo.
echo Full guide: See DEPLOYMENT.md
echo.
pause
goto menu

:generate
echo.
echo Generating environment variable templates...
echo.

REM Backend .env template
(
echo # Database Configuration (Neon.tech^)
echo DB_HOST=your-project.neon.tech:5432
echo DB_USERNAME=your_username
echo DB_PASSWORD=your_password
echo DB_NAME=neondb
echo DB_SSL_MODE=require
echo.
echo # File Storage Configuration (Cloudflare R2^)
echo MINIO_ENDPOINT=https://your-account.r2.cloudflarestorage.com
echo MINIO_ACCESS_KEY=your_r2_access_key
echo MINIO_SECRET_KEY=your_r2_secret_key
echo MINIO_BUCKET=civilai-files
echo.
echo # AI Service Configuration
echo AI_SERVICE_URL=https://civilai-gateway.onrender.com
echo.
echo # JWT Configuration
echo JWT_SECRET=change_this_to_a_random_32_character_string_minimum
echo.
echo # Email Configuration (Optional^)
echo MAIL_USERNAME=your-email@gmail.com
echo MAIL_PASSWORD=your-app-password
echo MAIL_HOST=smtp.gmail.com
echo MAIL_PORT=587
echo.
echo # Spring Profile
echo SPRING_PROFILES_ACTIVE=prod
) > backend\.env.deploy

REM AI Gateway .env template
(
echo # LLM API Keys
echo GROQ_API_KEY=gsk_your_groq_api_key
echo GEMINI_API_KEY=AIzaSy_your_gemini_api_key
echo HF_TOKEN=hf_your_huggingface_token
echo.
echo # Python Version
echo PYTHON_VERSION=3.11
) > ai-gateway\.env.deploy

REM Frontend .env template
(
echo # Backend API URL
echo VITE_API_BASE_URL=https://civilai-backend.onrender.com/api
) > frontend\.env.deploy

echo Created deployment environment templates:
echo   - backend\.env.deploy
echo   - ai-gateway\.env.deploy
echo   - frontend\.env.deploy
echo.
echo Fill in these templates with your actual credentials
echo.
pause
goto menu

:test
echo.
echo Testing Local Setup...
echo.

curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel%==0 (
    echo [OK] AI Gateway is running (http://localhost:8000^)
) else (
    echo [WARN] AI Gateway not running (http://localhost:8000^)
)

curl -s http://localhost:8080/actuator/health >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Backend is running (http://localhost:8080^)
) else (
    echo [WARN] Backend not running (http://localhost:8080^)
)

curl -s http://localhost:5173 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Frontend is running (http://localhost:5173^)
) else (
    echo [WARN] Frontend not running (http://localhost:5173^)
)

echo.
pause
goto menu

:docs
start DEPLOYMENT.md
goto menu

:exit
echo.
echo Goodbye!
exit /b 0
