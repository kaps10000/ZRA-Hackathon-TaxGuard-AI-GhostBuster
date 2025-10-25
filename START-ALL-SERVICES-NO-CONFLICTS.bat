@echo off
cls
echo ============================================================
echo     ZRA TAXGUARD AI - PERMANENT FIX FOR PORT CONFLICTS
echo ============================================================
echo.
echo GhostBuster Backend has been moved to PORT 3006
echo This prevents conflicts with other Node.js services
echo.
echo Starting all services...
echo.

REM Kill any existing processes on our ports
echo [STEP 1] Cleaning up any existing processes...
for %%P in (3000 3001 3004 3006 4000 4001 5001 5002 5003 8000) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P" ^| findstr "LISTENING"') do (
        echo   Freeing port %%P...
        taskkill /F /PID %%a >nul 2>&1
    )
)
timeout /t 2 >nul

echo.
echo [STEP 2] Starting all services with FIXED ports...
echo.

echo [1/10] Starting Dashboard Frontend (Port 3000)...
start "Dashboard - 3000" cmd /k "cd /d E:\ZRA PROJECT\dashboard_integration\frontend && npm run dev"
timeout /t 3 >nul

echo [2/10] Starting API Gateway (Port 4001)...
start "API Gateway - 4001" cmd /k "cd /d E:\ZRA PROJECT\api-gateway && node server.js"
timeout /t 2 >nul

echo [3/10] Starting VRT Guard NEW (Port 5002)...
start "VRT Guard - 5002" cmd /k "cd /d E:\ZRA PROJECT\ZRA Tax Refund NEW && set PORT=5002 && python app.py"
timeout /t 3 >nul

echo [4/10] Starting Anomaly Tracker (Port 5001)...
start "Anomaly Tracker - 5001" cmd /k "cd /d E:\ZRA PROJECT\ai_risk_scoring && set PORT=5001 && .\venv\Scripts\python.exe -m api.scoring_api"
timeout /t 3 >nul

echo [5/10] Starting GhostBuster Frontend (Port 3004)...
start "GhostBuster UI - 3004" cmd /k "cd /d E:\ZRA PROJECT\GhostBuster\frontend && npm start"
timeout /t 3 >nul

echo [6/10] Starting GhostBuster Backend (Port 3006 - FIXED!)...
start "GhostBuster API - 3006 FIXED" cmd /k "cd /d E:\ZRA PROJECT\GhostBuster\backend && set GHOSTBUSTER_PORT=3006 && python app.py"
timeout /t 4 >nul

echo [7/10] Starting Predictive Analytics (Port 5003)...
start "Predictive Analytics - 5003" cmd /k "cd /d E:\ZRA PROJECT\predictive_analytics && .\venv\Scripts\python.exe api.py"
timeout /t 2 >nul

echo [8/10] Starting Blockchain Service (Port 3001)...
start "Blockchain - 3001" cmd /k "cd /d E:\ZRA PROJECT\blockchain && set PORT=3001 && node api/index.js"
timeout /t 2 >nul

echo [9/10] Starting WhistlePro Backend (Port 4000)...
start "WhistlePro - 4000" cmd /k "cd /d E:\ZRA PROJECT\whistlepro_backend && set PORT=4000 && node src/server.js"
timeout /t 2 >nul

echo [10/10] Starting OCR AI Service (Port 8000)...
if exist "E:\ZRA PROJECT\ocr-ai-service\main.py" (
    start "OCR AI - 8000" cmd /k "cd /d E:\ZRA PROJECT\ocr-ai-service && .\venv\Scripts\python.exe main.py"
) else (
    echo   OCR AI Service not found - skipping
)

echo.
echo ============================================================
echo ALL SERVICES STARTED - PORT CONFLICTS PERMANENTLY FIXED!
echo ============================================================
echo.
echo IMPORTANT CHANGES:
echo   - GhostBuster Backend: 3005 --^> 3006 (PERMANENT FIX)
echo   - Frontend updated to connect to port 3006
echo.
echo Access Points:
echo   Dashboard:         http://localhost:3000
echo   GhostBuster UI:    http://localhost:3004
echo   GhostBuster API:   http://localhost:3006/api/stats
echo   API Gateway:       http://localhost:4001
echo.
echo Wait 60 seconds for all services to fully initialize.
echo.
pause
