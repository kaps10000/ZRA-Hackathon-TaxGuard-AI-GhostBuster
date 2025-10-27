# ZRA TaxGuard AI - Complete System Startup Script
# Starts ALL services (Core + Additional) in one go

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "    ZRA TAXGUARD AI - COMPLETE SYSTEM STARTUP" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will start ALL 10 services:" -ForegroundColor Green
Write-Host ""
Write-Host "CORE SERVICES (Essential):" -ForegroundColor Cyan
Write-Host "  1. Dashboard Frontend         - Port 3000" -ForegroundColor White
Write-Host "  2. VRT Guard (NEW)            - Port 5000" -ForegroundColor White
Write-Host "  3. GhostBuster Backend        - Port 3005" -ForegroundColor White
Write-Host "  4. GhostBuster Frontend       - Port 3004" -ForegroundColor White
Write-Host "  5. API Gateway                - Port 4001" -ForegroundColor White
Write-Host "  6. Predictive Analytics       - Port 5003" -ForegroundColor White
Write-Host ""
Write-Host "ADDITIONAL SERVICES (Optional):" -ForegroundColor Cyan
Write-Host "  7. Blockchain Service         - Port 3001" -ForegroundColor White
Write-Host "  8. WhistlePro Backend         - Port 4000" -ForegroundColor White
Write-Host "  9. Main Flask Backend (OCR)   - Port 5001" -ForegroundColor White
Write-Host " 10. Anomaly Tracker            - Port 5002" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to start all services..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Set UTF-8 encoding for Python services
$env:PYTHONIOENCODING = 'utf-8'

# Check for port conflicts and kill any existing services
Write-Host ""
Write-Host "========== CHECKING FOR PORT CONFLICTS ==========" -ForegroundColor Yellow
Write-Host ""

$ports = @(3000, 3001, 3004, 3005, 4000, 4001, 5001, 5002, 8000)
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

# CORE SERVICE 1: Dashboard Frontend (Port 3000)
Write-Host "[1/10] Starting Dashboard Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Dashboard Frontend - Port 3000' -ForegroundColor Cyan; cd 'C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\dashboard_integration\frontend'; npm run dev"
Start-Sleep -Seconds 3

# CORE SERVICE 2: VRT Guard NEW (Port 5002) - FIXED: Was conflicting with OCR Backend
Write-Host "[2/10] Starting VRT Guard - NEW VERSION (Port 5002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'VRT Guard (NEW) - Port 5002' -ForegroundColor Cyan; `$env:PYTHONIOENCODING='utf-8'; `$env:PORT='5002'; cd 'C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\ZRA Tax Refund NEW'; python app.py"
Start-Sleep -Seconds 3

# CORE SERVICE 3: GhostBuster Backend (Port 3005)
Write-Host "[3/10] Starting GhostBuster Backend (Port 3005)..." -ForegroundColor Yellow
Write-Host "    Using: C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\GhostBuster\backend (uppercase G)" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'GhostBuster Backend - Port 3005 (UPPERCASE G)' -ForegroundColor Cyan; `$env:PYTHONIOENCODING='utf-8'; cd 'C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\GhostBuster\backend'; python app.py"
Start-Sleep -Seconds 4

# CORE SERVICE 4: GhostBuster Frontend (Port 3004)
Write-Host "[4/10] Starting GhostBuster Frontend (Port 3004)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'GhostBuster Frontend - Port 3004' -ForegroundColor Cyan; cd 'C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\GhostBuster\frontend'; npm start"
Start-Sleep -Seconds 3

# CORE SERVICE 5: API Gateway (Port 4001)
Write-Host "[5/10] Starting API Gateway (Port 4001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'API Gateway - Port 4001' -ForegroundColor Cyan; cd 'C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\api-gateway'; node server.js"
Start-Sleep -Seconds 2

# CORE SERVICE 6: Predictive Analytics (Port 5003)
Write-Host "[6/10] Starting Predictive Analytics (Port 5003)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Predictive Analytics - Port 5003' -ForegroundColor Cyan; `$env:PYTHONIOENCODING='utf-8'; cd 'C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\predictive_analytics'; .\venv\Scripts\python.exe api.py"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========== STARTING ADDITIONAL SERVICES ==========" -ForegroundColor Green
Write-Host ""

# ADDITIONAL SERVICE 7: Blockchain Service (Port 3001)
Write-Host "[7/10] Starting Blockchain Service (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Blockchain Service - Port 3001' -ForegroundColor Cyan; cd 'C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\blockchain'; npm start"
Start-Sleep -Seconds 3

# ADDITIONAL SERVICE 8: WhistlePro Backend (Port 4000)
Write-Host "[8/10] Starting WhistlePro Backend (Port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'WhistlePro Backend - Port 4000' -ForegroundColor Cyan; cd 'C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\whistlepro_backend'; node src/server.js"
Start-Sleep -Seconds 2

# ADDITIONAL SERVICE 9: Anomaly Tracker - AI Risk Scoring (Port 5001)
Write-Host "[9/10] Starting Anomaly Tracker - AI Risk Scoring (Port 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Anomaly Tracker - Port 5001' -ForegroundColor Cyan; `$env:PYTHONIOENCODING='utf-8'; `$env:PORT='5001'; cd 'C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\ai_risk_scoring'; .\venv\Scripts\python.exe -m api.scoring_api"
Start-Sleep -Seconds 3

# ADDITIONAL SERVICE 10: OCR AI Service (Port 8000)
Write-Host "[10/10] Starting OCR AI Service (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'OCR AI Service - Port 8000' -ForegroundColor Cyan; `$env:PYTHONIOENCODING='utf-8'; cd 'C:\Users\EPHRAIM\Downloads\ZRA-Hackathon-TaxGuard-AI-GhostBuster\ocr-ai-service'; .\venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Complete system startup in progress!" -ForegroundColor Green
Write-Host "Wait 60-90 seconds for all services to fully initialize." -ForegroundColor Yellow
Write-Host ""
Write-Host "Service Windows:" -ForegroundColor Green
Write-Host "  - 10 PowerShell windows opened (one per service)" -ForegroundColor White
Write-Host "  - Each window shows the service name and port" -ForegroundColor White
Write-Host "  - Keep all windows open while using the system" -ForegroundColor White
Write-Host ""
Write-Host "Main Access Point:" -ForegroundColor Green
Write-Host "  Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "All Service URLs:" -ForegroundColor Green
Write-Host "  Core Services:" -ForegroundColor Cyan
Write-Host "    - Dashboard:              http://localhost:3000" -ForegroundColor White
Write-Host "    - VRT Guard (NEW):        http://localhost:5002" -ForegroundColor White
Write-Host "    - GhostBuster:            http://localhost:3004" -ForegroundColor White
Write-Host "    - GhostBuster API:        http://localhost:3005/api/health" -ForegroundColor White
Write-Host "    - API Gateway:            http://localhost:4001/health" -ForegroundColor White
Write-Host ""
Write-Host "  Additional Services:" -ForegroundColor Cyan
Write-Host "    - Blockchain:             http://localhost:3001" -ForegroundColor White
Write-Host "    - WhistlePro:             http://localhost:4000/api" -ForegroundColor White
Write-Host "    - Anomaly Tracker:        http://localhost:5001/health" -ForegroundColor White
Write-Host "    - OCR AI Service:         http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Complete system startup finished!" -ForegroundColor Green
Write-Host "All 10 services are now running." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
