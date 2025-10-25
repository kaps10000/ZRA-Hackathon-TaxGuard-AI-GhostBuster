# ZRA TaxGuard AI - Simplified Dashboard System Startup
# Uses the existing batch files as instructed

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ZRA TAXGUARD AI - DASHBOARD SYSTEM STARTUP" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will start:" -ForegroundColor Green
Write-Host "  1. Dashboard Frontend       - Port 3000" -ForegroundColor White
Write-Host "  2. VRT Guard (NEW)          - Port 5000" -ForegroundColor White
Write-Host "  3. GhostBuster Backend      - Port 3005" -ForegroundColor White
Write-Host "  4. GhostBuster Frontend     - Port 3004" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to start all services..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Set UTF-8 encoding for Python services
$env:PYTHONIOENCODING = 'utf-8'

Write-Host "[1/4] Starting Dashboard Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\ZRA PROJECT\dashboard_integration\frontend'; npm run dev"
Start-Sleep -Seconds 3

Write-Host "[2/4] Starting VRT Guard - NEW (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT\ZRA Tax Refund NEW'; python app.py"
Start-Sleep -Seconds 3

Write-Host "[3/4] Starting GhostBuster Backend (Port 3005)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\ZRA PROJECT\GhostBuster'; .\start_backend.bat"
Start-Sleep -Seconds 3

Write-Host "[4/4] Starting GhostBuster Frontend (Port 3004)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\ZRA PROJECT\GhostBuster'; .\start_frontend.bat"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "All services are starting..." -ForegroundColor Green
Write-Host "Wait 30-60 seconds for all services to initialize." -ForegroundColor Yellow
Write-Host ""
Write-Host "Service Windows:" -ForegroundColor Green
Write-Host "  - Each service runs in its own PowerShell window" -ForegroundColor White
Write-Host "  - Keep these windows open while using the system" -ForegroundColor White
Write-Host "  - To stop services, close the PowerShell windows or press Ctrl+C" -ForegroundColor White
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Green
Write-Host "  Dashboard:         http://localhost:3000" -ForegroundColor Cyan
Write-Host "  VRT Guard:         http://localhost:5000" -ForegroundColor Cyan
Write-Host "  GhostBuster:       http://localhost:3004" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dashboard Integration:" -ForegroundColor Green
Write-Host "  - Open http://localhost:3000" -ForegroundColor White
Write-Host "  - Click 'VRT Guard' to access VAT Fraud Detection (port 5000)" -ForegroundColor White
Write-Host "  - Click 'GhostBuster Detection' to access Ghost Employee Detection (port 3004)" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Startup complete! Services are running in background windows." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
