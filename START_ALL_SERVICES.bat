@echo off
cls
echo ============================================================
echo     ZRA TAXGUARD AI - STARTING ALL SERVICES
echo ============================================================
echo.
echo This will start all backend and frontend services.
echo Each service will open in a new window.
echo.
echo Press any key to continue...
pause >nul
echo.

echo [1/9] Starting Main Dashboard Frontend (Port 3000)...
start "Dashboard Frontend" cmd /k "cd /d E:\ZRA PROJECT\dashboard_integration\frontend && npm run dev"
timeout /t 3 >nul

echo [2/9] Starting Main Flask Backend (Port 5000)...
start "Main Flask Backend" cmd /k "cd /d E:\ZRA PROJECT && python app.py"
timeout /t 2 >nul

echo [3/9] Starting VRT Guard (Port 5002)...
start "VRT Guard" cmd /k "cd /d E:\ZRA PROJECT\vrt_guard && .\venv\Scripts\python.exe app.py"
timeout /t 2 >nul

echo [4/9] Starting Anomaly Tracker (Port 5001)...
start "Anomaly Tracker" cmd /k "cd /d E:\ZRA PROJECT\ai_risk_scoring && .\venv\Scripts\python.exe -m api.scoring_api"
timeout /t 2 >nul

echo [5/9] Starting Predictive Analytics (Port 3004)...
start "Predictive Analytics" cmd /k "cd /d E:\ZRA PROJECT\predictive_analytics && .\venv\Scripts\python.exe api.py"
timeout /t 2 >nul

echo [6/9] Starting GhostBuster Backend (Port 3005)...
start "GhostBuster Backend" cmd /k "cd /d E:\ZRA PROJECT\GhostBuster\backend && python app.py"
timeout /t 2 >nul

echo [7/9] Starting GhostBuster Frontend (Port 3002)...
start "GhostBuster Frontend" cmd /k "cd /d E:\ZRA PROJECT\GhostBuster\frontend && npm start"
timeout /t 3 >nul

echo [8/9] Starting WhistlePro Backend (Port 3006)...
start "WhistlePro Backend" cmd /k "cd /d E:\ZRA PROJECT\whistlepro_backend && start_whistlepro.bat"
timeout /t 2 >nul

echo [9/9] Starting Blockchain Service (Port 3001)...
start "Blockchain Service" cmd /k "cd /d E:\ZRA PROJECT\blockchain && npm start"
timeout /t 2 >nul

echo.
echo ============================================================
echo All services are starting...
echo Wait 30-60 seconds for all services to initialize.
echo.
echo Service Windows:
echo   - Each service runs in its own command window
echo   - Keep these windows open while using the system
echo   - Close a window to stop that service
echo.
echo Check service status:
echo   powershell -ExecutionPolicy Bypass -File check-all-services.ps1
echo.
echo Main Access URLs:
echo   Dashboard:    http://localhost:3000
echo   GhostBuster:  http://localhost:3002
echo   VRT Guard:    http://localhost:5002/health
echo.
echo ============================================================
pause
