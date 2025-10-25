# ZRA TaxGuard AI - Integration Verification Script
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ZRA TAXGUARD AI - INTEGRATION VERIFICATION" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if services are running
$ports = @(3000, 3004, 3005, 4001, 5000, 5001, 5002)
$services = @{
    3000 = "Dashboard Frontend"
    3004 = "GhostBuster Frontend"
    3005 = "GhostBuster Backend"
    4001 = "API Gateway"
    5000 = "Main Flask Backend"
    5001 = "Anomaly Tracker"
    5002 = "VRT Guard"
}

Write-Host "Checking Service Status..." -ForegroundColor Green
Write-Host ""

foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port " | Select-String "LISTENING"
    if ($connections) {
        Write-Host "[✓] Port $port - $($services[$port])" -ForegroundColor Green
    } else {
        Write-Host "[✗] Port $port - $($services[$port]) NOT RUNNING" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Testing GhostBuster Backend Health..." -ForegroundColor Green
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3005/api/health" -Method GET
    if ($response.datasets_loaded -eq $true) {
        Write-Host "[✓] GhostBuster Backend: HEALTHY - Datasets Loaded" -ForegroundColor Green
        Write-Host "    Timestamp: $($response.timestamp)" -ForegroundColor Gray
    } else {
        Write-Host "[✗] GhostBuster Backend: Datasets NOT Loaded" -ForegroundColor Red
    }
} catch {
    Write-Host "[✗] GhostBuster Backend: Cannot connect" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing VRT Guard..." -ForegroundColor Green
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5002/" -Method GET
    if ($response.StatusCode -eq 200) {
        Write-Host "[✓] VRT Guard: OPERATIONAL - UI Accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "[✗] VRT Guard: Cannot connect" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing Dashboard..." -ForegroundColor Green
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -Method GET
    if ($response.StatusCode -eq 200) {
        Write-Host "[✓] Dashboard: OPERATIONAL" -ForegroundColor Green
    }
} catch {
    Write-Host "[✗] Dashboard: Cannot connect" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Integration Test Summary" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Green
Write-Host "  Dashboard:         http://localhost:3000" -ForegroundColor Cyan
Write-Host "  GhostBuster:       http://localhost:3004" -ForegroundColor Cyan
Write-Host "  VRT Guard:         http://localhost:5002" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dashboard Integration:" -ForegroundColor Green
Write-Host "  - GhostBuster Detection page embeds http://localhost:3004" -ForegroundColor White
Write-Host "  - VRT Guard page embeds http://localhost:5002" -ForegroundColor White
Write-Host ""
Write-Host "Backend Status:" -ForegroundColor Green
Write-Host "  - GhostBuster datasets loaded from E:\ZRA PROJECT\GhostBuster\backend\data" -ForegroundColor White
Write-Host "  - VRT Guard using templates from E:\ZRA PROJECT\vrt_guard\templates" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
