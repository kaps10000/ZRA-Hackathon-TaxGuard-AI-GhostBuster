# ZRA TaxGuard AI - Comprehensive Startup Script
# This script starts all services with the correct port configuration

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     ZRA TAXGUARD AI - STARTING ALL SERVICES" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Port Configuration:" -ForegroundColor Green
Write-Host "   1. Dashboard Frontend       - Port 3000" -ForegroundColor White
Write-Host "   2. Blockchain Service       - Port 3001" -ForegroundColor White
Write-Host "   3. GhostBuster Frontend     - Port 3004" -ForegroundColor White
Write-Host "   4. GhostBuster Backend      - Port 3005" -ForegroundColor White
Write-Host "   5. WhistlePro Backend       - Port 4000" -ForegroundColor White
Write-Host "   6. API Gateway              - Port 4001" -ForegroundColor White
Write-Host "   7. Main Flask Backend (OCR) - Port 5000" -ForegroundColor White
Write-Host "   8. Anomaly Tracker          - Port 5001" -ForegroundColor White
Write-Host "   9. VRT Guard                - Port 5002" -ForegroundColor White
Write-Host "  10. Predictive Analytics     - Port 5003" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to start all services..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Set UTF-8 encoding for Python services
$env:PYTHONIOENCODING = 'utf-8'

Write-Host "[1/10] Starting Dashboard Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\ZRA PROJECT\dashboard_integration\frontend'; npm run dev"
Start-Sleep -Seconds 3

Write-Host "[2/10] Starting Main Flask Backend - OCR (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT'; python app.py"
Start-Sleep -Seconds 2

Write-Host "[3/10] Starting VRT Guard (Port 5002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT\vrt_guard'; .\venv\Scripts\python.exe app.py"
Start-Sleep -Seconds 2

Write-Host "[4/10] Starting Anomaly Tracker (Port 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT\ai_risk_scoring'; .\venv\Scripts\python.exe -m api.scoring_api"
Start-Sleep -Seconds 2

Write-Host "[5/10] Starting Predictive Analytics (Port 5003)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT\predictive_analytics'; .\venv\Scripts\python.exe api.py"
Start-Sleep -Seconds 2

Write-Host "[6/10] Starting GhostBuster Backend (Port 3005)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT\GhostBuster\backend'; python app.py"
Start-Sleep -Seconds 2

Write-Host "[7/10] Starting GhostBuster Frontend (Port 3004)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\ZRA PROJECT\GhostBuster\frontend'; npm start"
Start-Sleep -Seconds 3

Write-Host "[8/10] Starting Blockchain Service (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\ZRA PROJECT\blockchain'; npm start"
Start-Sleep -Seconds 2

Write-Host "[9/10] Starting WhistlePro Backend (Port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\ZRA PROJECT\whistlepro_backend'; node src/server.js"
Start-Sleep -Seconds 2

Write-Host "[10/10] Starting API Gateway (Port 4001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\ZRA PROJECT\api-gateway'; node server.js"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "All services are starting..." -ForegroundColor Green
Write-Host "Wait 30-60 seconds for all services to initialize." -ForegroundColor Yellow
Write-Host ""
Write-Host "Service Windows:" -ForegroundColor Green
Write-Host "  - Each service runs in its own PowerShell window" -ForegroundColor White
Write-Host "  - Keep these windows open while using the system" -ForegroundColor White
Write-Host "  - Close a window to stop that service" -ForegroundColor White
Write-Host ""
Write-Host "Main Access URLs:" -ForegroundColor Green
Write-Host "  Dashboard:         http://localhost:3000" -ForegroundColor Cyan
Write-Host "  GhostBuster:       http://localhost:3004" -ForegroundColor Cyan
Write-Host "  VRT Guard:         http://localhost:5002" -ForegroundColor Cyan
Write-Host "  API Gateway:       http://localhost:4001" -ForegroundColor Cyan
Write-Host "  Blockchain:        http://localhost:3001/explorer" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
