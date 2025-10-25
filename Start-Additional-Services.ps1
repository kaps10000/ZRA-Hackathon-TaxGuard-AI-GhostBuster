# ZRA TaxGuard AI - Additional Services Startup Script
# Starts the optional/additional services that complement the core system

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ZRA TAXGUARD AI - ADDITIONAL SERVICES STARTUP" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will start the following additional services:" -ForegroundColor Green
Write-Host ""
Write-Host "  1. Blockchain Service         - Port 3001" -ForegroundColor White
Write-Host "  2. WhistlePro Backend         - Port 4000" -ForegroundColor White
Write-Host "  3. Main Flask Backend (OCR)   - Port 5001" -ForegroundColor White
Write-Host "  4. Anomaly Tracker            - Port 5002" -ForegroundColor White
Write-Host ""
Write-Host "NOTE: These services are OPTIONAL and provide additional" -ForegroundColor Yellow
Write-Host "      functionality beyond the core system." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to start additional services..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Set UTF-8 encoding for Python services
$env:PYTHONIOENCODING = 'utf-8'

# Service 1: Blockchain Service (Port 3001)
Write-Host "[1/4] Starting Blockchain Service (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Blockchain Service - Port 3001' -ForegroundColor Cyan; cd 'E:\ZRA PROJECT\blockchain'; npm start"
Start-Sleep -Seconds 3

# Service 2: WhistlePro Backend (Port 4000)
Write-Host "[2/4] Starting WhistlePro Backend (Port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'WhistlePro Backend - Port 4000' -ForegroundColor Cyan; cd 'E:\ZRA PROJECT\whistlepro_backend'; node src/server.js"
Start-Sleep -Seconds 2

# Service 3: Main Flask Backend - OCR (Port 5001)
Write-Host "[3/4] Starting Main Flask Backend - OCR (Port 5001)..." -ForegroundColor Yellow
Write-Host "  NOTE: Changed to port 5001 to avoid conflict with VRT Guard (5000)" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Main Flask Backend OCR - Port 5001' -ForegroundColor Cyan; `$env:PYTHONIOENCODING='utf-8'; `$env:FLASK_RUN_PORT='5001'; cd 'E:\ZRA PROJECT'; python app.py"
Start-Sleep -Seconds 3

# Service 4: Anomaly Tracker (Port 5002)
Write-Host "[4/4] Starting Anomaly Tracker (Port 5002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Anomaly Tracker - Port 5002' -ForegroundColor Cyan; `$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT\ai_risk_scoring'; .\venv\Scripts\python.exe -m api.scoring_api"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "All additional services are starting..." -ForegroundColor Green
Write-Host "Wait 20-30 seconds for full initialization." -ForegroundColor Yellow
Write-Host ""
Write-Host "Service Details:" -ForegroundColor Green
Write-Host ""
Write-Host "  Blockchain Service (3001):" -ForegroundColor Cyan
Write-Host "    - Audit trail and immutable record keeping" -ForegroundColor White
Write-Host "    - Access: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "  WhistlePro Backend (4000):" -ForegroundColor Cyan
Write-Host "    - Anonymous whistleblower reporting" -ForegroundColor White
Write-Host "    - Case management system" -ForegroundColor White
Write-Host "    - Access: http://localhost:4000/api" -ForegroundColor White
Write-Host ""
Write-Host "  Main Flask Backend - OCR (5001):" -ForegroundColor Cyan
Write-Host "    - Document OCR processing" -ForegroundColor White
Write-Host "    - Text extraction from images/PDFs" -ForegroundColor White
Write-Host "    - Access: http://localhost:5001" -ForegroundColor White
Write-Host ""
Write-Host "  Anomaly Tracker (5002):" -ForegroundColor Cyan
Write-Host "    - AI-powered risk scoring" -ForegroundColor White
Write-Host "    - Anomaly detection in transactions" -ForegroundColor White
Write-Host "    - Access: http://localhost:5002" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Additional services startup complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Combined with core services, you now have:" -ForegroundColor Yellow
Write-Host "  - 10 total services running" -ForegroundColor White
Write-Host "  - Complete ZRA TaxGuard AI ecosystem" -ForegroundColor White
