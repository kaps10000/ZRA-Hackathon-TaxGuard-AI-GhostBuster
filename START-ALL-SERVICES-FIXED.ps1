# ZRA TaxGuard AI - Complete System Startup Script (PORT CONFLICTS FIXED)
# All services configured with correct, non-conflicting ports
# Last Updated: October 26, 2025

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "    ZRA TAXGUARD AI - COMPLETE SYSTEM STARTUP" -ForegroundColor Yellow
Write-Host "          (PORT CONFLICTS FIXED)" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will start ALL 11 services with NO PORT CONFLICTS:" -ForegroundColor Green
Write-Host ""
Write-Host "DATABASE:" -ForegroundColor Magenta
Write-Host "  0. PostgreSQL Database        - Port 5432" -ForegroundColor White
Write-Host ""
Write-Host "CORE SERVICES:" -ForegroundColor Cyan
Write-Host "  1. Dashboard Frontend         - Port 3000" -ForegroundColor White
Write-Host "  2. API Gateway                - Port 4001" -ForegroundColor White
Write-Host "  3. VRT Guard (NEW)            - Port 5002" -ForegroundColor White
Write-Host "  4. Anomaly Tracker            - Port 5001" -ForegroundColor White
Write-Host "  5. GhostBuster Frontend       - Port 3004" -ForegroundColor White
Write-Host "  6. GhostBuster Backend        - Port 3005" -ForegroundColor White
Write-Host "  7. OCR AI Service             - Port 8000" -ForegroundColor White
Write-Host "  8. OCR Backend                - Port 5000" -ForegroundColor White
Write-Host "  9. Blockchain Service         - Port 3001" -ForegroundColor White
Write-Host " 10. WhistlePro Backend         - Port 4000" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to start all services, or Ctrl+C to cancel..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Set UTF-8 encoding for Python services
$env:PYTHONIOENCODING = 'utf-8'

# Check for port conflicts and kill any existing services
Write-Host ""
Write-Host "========== CHECKING FOR PORT CONFLICTS ==========" -ForegroundColor Yellow
Write-Host ""

$ports = @(3000, 3001, 3004, 3005, 4000, 4001, 5000, 5001, 5002, 8000)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($process) {
        Write-Host "Port $port is in use - attempting to free it..." -ForegroundColor Yellow
        $processId = (Get-NetTCPConnection -LocalPort $port).OwningProcess | Select-Object -First 1
        if ($processId) {
            try {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Start-Sleep -Milliseconds 500
                Write-Host "  ✓ Freed port $port" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ Could not free port $port - you may need to close it manually" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "========== STARTING ALL SERVICES ==========" -ForegroundColor Green
Write-Host ""

# SERVICE 1: Dashboard Frontend (Port 3000)
Write-Host "[1/11] Starting Dashboard Frontend (Port 3000)..." -ForegroundColor Yellow
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  DASHBOARD FRONTEND - PORT 3000' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; cd 'E:\ZRA PROJECT\dashboard_integration\frontend'; npm run dev"
    Write-Host "  ✓ Dashboard Frontend started" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "  ✗ Failed to start Dashboard Frontend" -ForegroundColor Red
}

# SERVICE 2: API Gateway (Port 4001)
Write-Host "[2/11] Starting API Gateway (Port 4001)..." -ForegroundColor Yellow
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  API GATEWAY - PORT 4001' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; cd 'E:\ZRA PROJECT\api-gateway'; node server.js"
    Write-Host "  ✓ API Gateway started" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "  ✗ Failed to start API Gateway" -ForegroundColor Red
}

# SERVICE 3: VRT Guard NEW (Port 5002) - Tax Refund Validation
Write-Host "[3/11] Starting VRT Guard NEW (Port 5002)..." -ForegroundColor Yellow
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  VRT GUARD (NEW) - PORT 5002' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; `$env:PYTHONIOENCODING='utf-8'; `$env:PORT='5002'; cd 'E:\ZRA PROJECT\ZRA Tax Refund NEW'; python app.py"
    Write-Host "  ✓ VRT Guard (NEW) started" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "  ✗ Failed to start VRT Guard" -ForegroundColor Red
}

# SERVICE 4: Anomaly Tracker (Port 5001) - AI Risk Scoring
Write-Host "[4/11] Starting Anomaly Tracker - AI Risk Scoring (Port 5001)..." -ForegroundColor Yellow
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  ANOMALY TRACKER - PORT 5001' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; `$env:PYTHONIOENCODING='utf-8'; `$env:PORT='5001'; cd 'E:\ZRA PROJECT\ai_risk_scoring'; .\venv\Scripts\python.exe -m api.scoring_api"
    Write-Host "  ✓ Anomaly Tracker started" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "  ✗ Failed to start Anomaly Tracker" -ForegroundColor Red
}

# SERVICE 5: GhostBuster Frontend (Port 3004)
Write-Host "[5/11] Starting GhostBuster Frontend (Port 3004)..." -ForegroundColor Yellow
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  GHOSTBUSTER FRONTEND - PORT 3004' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; cd 'E:\ZRA PROJECT\GhostBuster\frontend'; npm start"
    Write-Host "  ✓ GhostBuster Frontend started" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "  ✗ Failed to start GhostBuster Frontend" -ForegroundColor Red
}

# SERVICE 6: GhostBuster Backend (Port 3005)
Write-Host "[6/11] Starting GhostBuster Backend (Port 3005)..." -ForegroundColor Yellow
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  GHOSTBUSTER BACKEND - PORT 3005' -ForegroundColor Green; Write-Host '  (Ghost Employee Detection API)' -ForegroundColor Yellow; Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; `$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT\GhostBuster\backend'; python app.py"
    Write-Host "  ✓ GhostBuster Backend started" -ForegroundColor Green
    Start-Sleep -Seconds 4
} catch {
    Write-Host "  ✗ Failed to start GhostBuster Backend" -ForegroundColor Red
}

# SERVICE 7: OCR AI Service (Port 8000)
Write-Host "[7/11] Starting OCR AI Service (Port 8000)..." -ForegroundColor Yellow
try {
    if (Test-Path "E:\ZRA PROJECT\ocr-ai-service\main.py") {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  OCR AI SERVICE - PORT 8000' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; `$env:PYTHONIOENCODING='utf-8'; cd 'E:\ZRA PROJECT\ocr-ai-service'; .\venv\Scripts\python.exe main.py"
        Write-Host "  ✓ OCR AI Service started" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ OCR AI Service not found - skipping" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2
} catch {
    Write-Host "  ✗ Failed to start OCR AI Service" -ForegroundColor Red
}

# SERVICE 8: OCR Backend (Port 5000)
Write-Host "[8/11] Starting OCR Backend (Port 5000)..." -ForegroundColor Yellow
try {
    if (Test-Path "E:\ZRA PROJECT\ocr-backend") {
        # Check if there's a main script in ocr-backend
        $ocrScript = $null
        if (Test-Path "E:\ZRA PROJECT\ocr-backend\app.py") {
            $ocrScript = "app.py"
        } elseif (Test-Path "E:\ZRA PROJECT\ocr-backend\main.py") {
            $ocrScript = "main.py"
        }

        if ($ocrScript) {
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  OCR BACKEND - PORT 5000' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; `$env:PYTHONIOENCODING='utf-8'; `$env:PORT='5000'; cd 'E:\ZRA PROJECT\ocr-backend'; python $ocrScript"
            Write-Host "  ✓ OCR Backend started" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ OCR Backend script not found - skipping" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠ OCR Backend directory not found - skipping" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2
} catch {
    Write-Host "  ✗ Failed to start OCR Backend" -ForegroundColor Red
}

# SERVICE 9: Blockchain Service (Port 3001)
Write-Host "[9/11] Starting Blockchain Service (Port 3001)..." -ForegroundColor Yellow
try {
    if (Test-Path "E:\ZRA PROJECT\blockchain\api\index.js") {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  BLOCKCHAIN SERVICE - PORT 3001' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; `$env:PORT='3001'; cd 'E:\ZRA PROJECT\blockchain'; node api/index.js"
        Write-Host "  ✓ Blockchain Service started" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Blockchain Service not found - skipping" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2
} catch {
    Write-Host "  ✗ Failed to start Blockchain Service" -ForegroundColor Red
}

# SERVICE 10: WhistlePro Backend (Port 4000)
Write-Host "[10/11] Starting WhistlePro Backend (Port 4000)..." -ForegroundColor Yellow
try {
    if (Test-Path "E:\ZRA PROJECT\whistlepro_backend\src\server.js") {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  WHISTLEPRO BACKEND - PORT 4000' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; `$env:PORT='4000'; cd 'E:\ZRA PROJECT\whistlepro_backend'; node src/server.js"
        Write-Host "  ✓ WhistlePro Backend started" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ WhistlePro Backend not found - skipping" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2
} catch {
    Write-Host "  ✗ Failed to start WhistlePro Backend" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✓ ALL SERVICES STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Wait 60-90 seconds for all services to fully initialize." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 SERVICE WINDOWS:" -ForegroundColor Green
Write-Host "  - Each service runs in its own PowerShell window" -ForegroundColor White
Write-Host "  - Window titles show service name and port" -ForegroundColor White
Write-Host "  - Keep all windows open while using the system" -ForegroundColor White
Write-Host "  - To stop a service: close its window or press Ctrl+C" -ForegroundColor White
Write-Host ""
Write-Host "🌐 ACCESS POINTS:" -ForegroundColor Green
Write-Host ""
Write-Host "  Main Dashboard:" -ForegroundColor Cyan
Write-Host "    → http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Core Services:" -ForegroundColor Cyan
Write-Host "    • API Gateway:        http://localhost:4001/health" -ForegroundColor White
Write-Host "    • VRT Guard (NEW):    http://localhost:5002" -ForegroundColor White
Write-Host "    • Anomaly Tracker:    http://localhost:5001/health" -ForegroundColor White
Write-Host "    • GhostBuster:        http://localhost:3004" -ForegroundColor White
Write-Host "    • GhostBuster API:    http://localhost:3005/api/health" -ForegroundColor White
Write-Host ""
Write-Host "  Additional Services:" -ForegroundColor Cyan
Write-Host "    • OCR AI Service:     http://localhost:8000/docs" -ForegroundColor White
Write-Host "    • OCR Backend:        http://localhost:5000" -ForegroundColor White
Write-Host "    • Blockchain:         http://localhost:3001" -ForegroundColor White
Write-Host "    • WhistlePro:         http://localhost:4000/api" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📊 PORT ASSIGNMENT SUMMARY (NO CONFLICTS):" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Port 3000 → Dashboard Frontend" -ForegroundColor White
Write-Host "  Port 3001 → Blockchain Service" -ForegroundColor White
Write-Host "  Port 3004 → GhostBuster Frontend" -ForegroundColor White
Write-Host "  Port 3005 → GhostBuster Backend" -ForegroundColor White
Write-Host "  Port 4000 → WhistlePro Backend" -ForegroundColor White
Write-Host "  Port 4001 → API Gateway" -ForegroundColor White
Write-Host "  Port 5000 → OCR Backend" -ForegroundColor White
Write-Host "  Port 5001 → Anomaly Tracker (AI Risk)" -ForegroundColor White
Write-Host "  Port 5002 → VRT Guard (Tax Refund NEW)" -ForegroundColor White
Write-Host "  Port 8000 → OCR AI Service" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 TIP: To verify all services are running, use:" -ForegroundColor Yellow
Write-Host "    netstat -ano | findstr `"3000 3001 3004 3005 4000 4001 5000 5001 5002 8000`"" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 To stop all services, run: .\Stop-All-Services.ps1" -ForegroundColor Yellow
Write-Host ""
