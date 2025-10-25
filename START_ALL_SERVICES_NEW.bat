@echo off
cls
echo ============================================================
echo     ZRA TAXGUARD AI - STARTING ALL SERVICES
echo ============================================================
echo.
echo Port Configuration:
echo   1. Dashboard Frontend       - Port 3000
echo   2. Blockchain Service       - Port 3001
echo   3. GhostBuster Frontend     - Port 3004
echo   4. Predictive Analytics     - Port 3004
echo   5. GhostBuster Backend      - Port 3005
echo   6. WhistlePro Backend       - Port 4000
echo   7. API Gateway              - Port 4001
echo   8. Main Flask Backend (OCR) - Port 5000
echo   9. Anomaly Tracker          - Port 5001
echo  10. VRT Guard                - Port 5002
echo  11. OCR AI Service           - Port 8000
echo.
echo ============================================================
echo.
pause
echo.

echo [1/10] Starting Dashboard Frontend (Port 3000)...
start "Dashboard Frontend" cmd /k "cd /d E:\ZRA PROJECT\dashboard_integration\frontend && npm run dev"
timeout /t 3 >nul

echo [2/10] Starting Main Flask Backend - OCR (Port 5000)...
start "Main Flask Backend" cmd /k "cd /d E:\ZRA PROJECT && $env:PYTHONIOENCODING='utf-8'; python app.py"
timeout /t 2 >nul

echo [3/10] Starting VRT Guard (Port 5002)...
start "VRT Guard" cmd /k "cd /d E:\ZRA PROJECT\vrt_guard && $env:PYTHONIOENCODING='utf-8'; .\venv\Scripts\python.exe app.py"
timeout /t 2 >nul

echo [4/10] Starting Anomaly Tracker (Port 5001)...
start "Anomaly Tracker" cmd /k "cd /d E:\ZRA PROJECT\ai_risk_scoring && $env:PYTHONIOENCODING='utf-8'; .\venv\Scripts\python.exe -m api.scoring_api"
timeout /t 2 >nul

echo [5/10] Starting Predictive Analytics (Port 3004)...
start "Predictive Analytics" cmd /k "cd /d E:\ZRA PROJECT\predictive_analytics && $env:PYTHONIOENCODING='utf-8'; .\venv\Scripts\python.exe api.py"
timeout /t 2 >nul

echo [6/10] Starting GhostBuster Backend (Port 3005)...
start "GhostBuster Backend" cmd /k "cd /d E:\ZRA PROJECT\GhostBuster\backend && $env:PYTHONIOENCODING='utf-8'; python app.py"
timeout /t 2 >nul

echo [7/10] Starting GhostBuster Frontend (Port 3004)...
start "GhostBuster Frontend" cmd /k "cd /d E:\ZRA PROJECT\GhostBuster\frontend && npm start"
timeout /t 3 >nul

echo [8/10] Starting Blockchain Service (Port 3001)...
start "Blockchain Service" cmd /k "cd /d E:\ZRA PROJECT\blockchain && npm start"
timeout /t 2 >nul

echo [9/10] Starting WhistlePro Backend (Port 4000)...
start "WhistlePro Backend" cmd /k "cd /d E:\ZRA PROJECT\whistlepro_backend && node src/server.js"
timeout /t 2 >nul

echo [10/10] Starting API Gateway (Port 4001)...
start "API Gateway" cmd /k "cd /d E:\ZRA PROJECT\api-gateway && node server.js"
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
echo   Dashboard:         http://localhost:3000
echo   GhostBuster:       http://localhost:3004
echo   VRT Guard:         http://localhost:5002
echo   API Gateway:       http://localhost:4001
echo   Blockchain:        http://localhost:3001/explorer
echo.
echo ============================================================
pause
