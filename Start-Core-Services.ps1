# ZRA TaxGuard AI - Core Services Startup Script
# Starts only the essential services that are confirmed working

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     ZRA TAXGUARD AI - CORE SERVICES STARTUP" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will start the following services:" -ForegroundColor Green
Write-Host ""
Write-Host "  1. Dashboard Frontend         - Port 3000" -ForegroundColor White
Write-Host "  2. VRT Guard (NEW)            - Port 5002" -ForegroundColor White
Write-Host "  3. GhostBuster Backend        - Port 3005" -ForegroundColor White
Write-Host "  4. GhostBuster Frontend       - Port 3004" -ForegroundColor White
Write-Host "  5. API Gateway                - Port 4001" -ForegroundColor White
Write-Host "  6. Predictive Analytics       - Port 5003" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting services automatically in 3 seconds..."
Write-Host "Press Ctrl+C to cancel or any key to start immediately"
Write-Host ""

# Wait for 3 seconds or until key is pressed
$timeout = 3
for ($i = $timeout; $i -gt 0; $i--) {
    if ([Console]::KeyAvailable) {
        $null = [Console]::ReadKey($true)
        break
    }
    Write-Host "Starting in $i seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}
Write-Host ""

# Set UTF-8 encoding for Python services
$env:PYTHONIOENCODING = 'utf-8'

# Check for port conflicts and kill any existing services
Write-Host ""
Write-Host "========== CHECKING FOR PORT CONFLICTS ==========" -ForegroundColor Yellow
Write-Host ""

$ports = @(3000, 3004, 3005, 4001, 5002, 5003)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($process) {
        Write-Host "Port $port is in use - attempting to free it..." -ForegroundColor Yellow
        $processId = (Get-NetTCPConnection -LocalPort $port).OwningProcess | Select-Object -First 1
        if ($processId) {
            try {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "  Freed port $port" -ForegroundColor Green
            } catch {
                Write-Host "  Could not free port $port" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "========== STARTING CORE SERVICES ==========" -ForegroundColor Green
Write-Host ""

# Service 1: Dashboard Frontend (Port 3000)
Write-Host "[1/6] Starting Dashboard Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Dashboard Frontend - Port 3000' -ForegroundColor Cyan; cd 'E:\ZRA PROJECT\dashboard_integration\frontend'; npm run dev"
Start-Sleep -Seconds 3

# Service 2: VRT Guard NEW (Port 5002) - FIXED: Was conflicting with OCR Backend on 5000
Write-Host "[2/6] Starting VRT Guard - NEW VERSION (Port 5002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'VRT Guard (NEW) - Port 5002' -ForegroundColor Cyan; `$env:PYTHONIOENCODING='utf-8'; `$env:PORT='5002'; cd 'E:\ZRA PROJECT\ZRA Tax Refund NEW'; python app.py"
Start-Sleep -Seconds 3

# Service 3: GhostBuster Backend (Port 3005)
Write-Host "[3/6] Starting GhostBuster Backend (Port 3005)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'GhostBuster Backend - Port 3005' -ForegroundColor Cyan; `$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT\GhostBuster\backend'; python app.py"
Start-Sleep -Seconds 4

# Service 4: GhostBuster Frontend (Port 3004)
Write-Host "[4/6] Starting GhostBuster Frontend (Port 3004)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'GhostBuster Frontend - Port 3004' -ForegroundColor Cyan; cd 'E:\ZRA PROJECT\GhostBuster\frontend'; npm start"
Start-Sleep -Seconds 3

# Service 5: API Gateway (Port 4001)
Write-Host "[5/6] Starting API Gateway (Port 4001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'API Gateway - Port 4001' -ForegroundColor Cyan; cd 'E:\ZRA PROJECT\api-gateway'; node server.js"
Start-Sleep -Seconds 2

# Service 6: Predictive Analytics (Port 5003)
Write-Host "[6/6] Starting Predictive Analytics (Port 5003)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Predictive Analytics - Port 5003' -ForegroundColor Cyan; `$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT\predictive_analytics'; .\venv\Scripts\python.exe api.py"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "All core services are starting..." -ForegroundColor Green
Write-Host "Wait 30-60 seconds for all services to fully initialize." -ForegroundColor Yellow
Write-Host ""
Write-Host "Service Windows:" -ForegroundColor Green
Write-Host "  - Each service runs in its own PowerShell window" -ForegroundColor White
Write-Host "  - Window titles show the service name and port" -ForegroundColor White
Write-Host "  - Keep these windows open while using the system" -ForegroundColor White
Write-Host "  - To stop a service, close its PowerShell window or press Ctrl+C" -ForegroundColor White
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Green
Write-Host "  Dashboard:              http://localhost:3000" -ForegroundColor Cyan
Write-Host "  VRT Guard (NEW):        http://localhost:5002" -ForegroundColor Cyan
Write-Host "  GhostBuster:            http://localhost:3004" -ForegroundColor Cyan
Write-Host "  API Gateway:            http://localhost:4001/health" -ForegroundColor Cyan
Write-Host "  Predictive Analytics:   http://localhost:5003/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dashboard Integration:" -ForegroundColor Green
Write-Host "  - Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  - Click 'VRT Guard' to access VAT fraud detection" -ForegroundColor White
Write-Host "  - Click 'GhostBuster Detection' for ghost employee analysis" -ForegroundColor White
Write-Host "  - Click 'Predictive Analytics' for revenue forecasts" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Startup Complete! All core services are running." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services, run: .\Stop-All-Services.ps1" -ForegroundColor Yellow
