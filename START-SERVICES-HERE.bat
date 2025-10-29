@echo off
echo ============================================================
echo     Starting ZRA TaxGuard AI Services
echo ============================================================
echo.

set CURRENT_DIR=%~dp0

echo [1/6] Starting GhostBuster Backend (Port 3005)...
start "GhostBuster-Backend" cmd /k "cd /d "%CURRENT_DIR%GhostBuster\backend" && python app.py"
timeout /t 3 >nul

echo [2/6] Starting WhistlePro Backend (Port 4000)...
start "WhistlePro-Backend" cmd /k "cd /d "%CURRENT_DIR%whistlepro_backend" && set PORT=4000 && npm start"
timeout /t 3 >nul

echo [3/6] Starting API Gateway (Port 4001)...
start "API-Gateway" cmd /k "cd /d "%CURRENT_DIR%api-gateway" && node server.js"
timeout /t 2 >nul

echo [4/6] Starting Blockchain Service (Port 3001)...
start "Blockchain" cmd /k "cd /d "%CURRENT_DIR%blockchain" && set PORT=3001 && node api/index.js"
timeout /t 2 >nul

echo [5/6] Starting GhostBuster Frontend (Port 3004)...
start "GhostBuster-Frontend" cmd /k "cd /d "%CURRENT_DIR%GhostBuster\frontend" && npm start"
timeout /t 3 >nul

echo [6/6] Starting Dashboard Frontend (Port 3000)...
if exist "%CURRENT_DIR%dashboard_integration\frontend" (
    start "Dashboard" cmd /k "cd /d "%CURRENT_DIR%dashboard_integration\frontend" && npm run dev"
) else if exist "%CURRENT_DIR%frontend" (
    start "Dashboard" cmd /k "cd /d "%CURRENT_DIR%frontend" && npm run dev"
) else (
    echo Dashboard frontend not found in expected locations
)

echo.
echo ============================================================
echo Services are starting...
echo Wait 30-60 seconds for initialization
echo.
echo Access points:
echo   Dashboard:         http://localhost:3000
echo   GhostBuster UI:    http://localhost:3004
echo   GhostBuster API:   http://localhost:3005/api/stats
echo   WhistlePro API:    http://localhost:4000/health
echo   API Gateway:       http://localhost:4001/health
echo   Blockchain:        http://localhost:3001
echo.
echo ============================================================
pause
