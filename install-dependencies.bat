@echo off
REM ZRA TaxGuard AI - Dependency Installation Script (Windows)
REM This script installs all dependencies for all services

chcp 65001 >nul
setlocal enabledelayedexpansion

echo ╔═══════════════════════════════════════════════════════════╗
echo ║  🔧 ZRA TAXGUARD AI - INSTALLING DEPENDENCIES 🔧        ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

set ERRORS=0
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo 📋 Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js not found. Please install Node.js v18+
    echo    Download from: https://nodejs.org/
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo ✅ Node.js !NODE_VER!
)

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ npm not found
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    echo ✅ npm !NPM_VER!
)

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    where py >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo ❌ Python not found. Please install Python 3.10+
        echo    Download from: https://www.python.org/
        set /a ERRORS+=1
        set PYTHON_CMD=python
    ) else (
        for /f "tokens=*" %%i in ('py --version') do set PY_VER=%%i
        echo ✅ !PY_VER!
        set PYTHON_CMD=py
    )
) else (
    for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
    echo ✅ !PY_VER!
    set PYTHON_CMD=python
)

REM Check pip
%PYTHON_CMD% -m pip --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ pip not found
    set /a ERRORS+=1
) else (
    for /f "tokens=2" %%i in ('%PYTHON_CMD% -m pip --version') do set PIP_VER=%%i
    echo ✅ pip !PIP_VER!
)

if !ERRORS! gtr 0 (
    echo.
    echo ❌ Please install missing prerequisites before continuing
    pause
    exit /b 1
)

echo.
echo 🚀 Starting dependency installation...
echo.

REM =====================================================
REM Function to install Node.js dependencies
REM =====================================================
goto :skip_node_function
:install_node_deps
    set DIR=%~1
    set NAME=%~2

    echo 📦 Installing dependencies for: %NAME%
    cd /d "%SCRIPT_DIR%\%DIR%"

    if exist package.json (
        call npm install --silent >nul 2>&1
        if !ERRORLEVEL! equ 0 (
            echo    ✅ %NAME% dependencies installed
        ) else (
            echo    ❌ Failed to install %NAME% dependencies
            set /a ERRORS+=1
        )
    ) else (
        echo    ⚠️  No package.json found in %DIR%
    )

    cd /d "%SCRIPT_DIR%"
    goto :eof
:skip_node_function

REM =====================================================
REM Function to install Python dependencies
REM =====================================================
goto :skip_python_function
:install_python_deps
    set DIR=%~1
    set NAME=%~2

    echo 📦 Installing dependencies for: %NAME%
    cd /d "%SCRIPT_DIR%\%DIR%"

    if exist requirements.txt (
        REM Create virtual environment if it doesn't exist
        if not exist venv (
            echo    Creating virtual environment...
            %PYTHON_CMD% -m venv venv
        )

        REM Activate virtual environment
        call venv\Scripts\activate.bat

        REM Upgrade pip
        python -m pip install --upgrade pip --quiet >nul 2>&1

        REM Install dependencies
        pip install -r requirements.txt --quiet >nul 2>&1
        if !ERRORLEVEL! equ 0 (
            echo    ✅ %NAME% dependencies installed
        ) else (
            echo    ❌ Failed to install %NAME% dependencies
            set /a ERRORS+=1
        )

        REM Deactivate virtual environment
        call deactivate
    ) else (
        echo    ⚠️  No requirements.txt found in %DIR%
    )

    cd /d "%SCRIPT_DIR%"
    goto :eof
:skip_python_function

REM =====================================================
REM Install Node.js Services
REM =====================================================
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Installing Node.js Services
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

call :install_node_deps "api-gateway" "API Gateway"
call :install_node_deps "dashboard_integration\frontend" "Frontend Dashboard"
call :install_node_deps "ghostbuster\backend" "GhostBuster Backend"
call :install_node_deps "ocr-backend" "OCR Backend"
call :install_node_deps "blockchain" "Blockchain Service"
call :install_node_deps "whistlepro_backend" "WhistlePro Backend"

REM =====================================================
REM Install Python Services
REM =====================================================
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Installing Python Services
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

call :install_python_deps "vrt_guard" "VRT Guard"
call :install_python_deps "ai_risk_scoring" "Anomaly Tracker"
call :install_python_deps "predictive_analytics" "Predictive Analytics"
call :install_python_deps "ocr-ai-service" "OCR AI Service"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if !ERRORS! equ 0 (
    echo.
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║        ✅ ALL DEPENDENCIES INSTALLED SUCCESSFULLY! ✅    ║
    echo ╚═══════════════════════════════════════════════════════════╝
    echo.
    echo 🎉 You're ready to start the services!
    echo.
    echo Next steps:
    echo   1. Setup PostgreSQL database ^(if not done^):
    echo      - Download PostgreSQL from: https://www.postgresql.org/download/windows/
    echo      - Install and start PostgreSQL
    echo      - Create database: CREATE DATABASE zra_taxguard;
    echo.
    echo   2. Start all services:
    echo      - Use start-all-services.bat ^(create this for Windows^)
    echo      - Or start services manually
    echo.
    echo   3. Access the dashboard:
    echo      http://localhost:3000
    echo.
) else (
    echo.
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║     ⚠️  INSTALLATION COMPLETED WITH !ERRORS! ERROR^(S^)  ⚠️      ║
    echo ╚═══════════════════════════════════════════════════════════╝
    echo.
    echo Please check the errors above and try again.
    echo.
    pause
    exit /b 1
)

pause
