# ZRA TaxGuard AI - Comprehensive Service Status Checker
Write-Host "=== ZRA TaxGuard AI - COMPLETE SERVICE STATUS ===" -ForegroundColor Cyan
Write-Host ""

$ports = @{
    3000 = "Main Dashboard Frontend"
    3001 = "Blockchain Service"
    3002 = "GhostBuster Frontend"
    3004 = "Predictive Analytics"
    3005 = "GhostBuster Backend"
    3006 = "WhistlePro Backend"
    4000 = "API Gateway (Alt)"
    4001 = "API Gateway (Primary)"
    5000 = "Main Flask Backend"
    5001 = "Anomaly Tracker (AI Risk Scoring)"
    5002 = "VRT Guard"
    8000 = "OCR AI Service"
}

$running = @()
$notRunning = @()

foreach($port in $ports.Keys | Sort-Object){
    $serviceName = $ports[$port]
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
        $pid = $conn.OwningProcess
        Write-Host "[OK] Port $port : $serviceName (PID: $pid)" -ForegroundColor Green
        $running += $serviceName
    } catch {
        Write-Host "[--] Port $port : $serviceName (NOT RUNNING)" -ForegroundColor Yellow
        $notRunning += $serviceName
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Running Services: $($running.Count)/12" -ForegroundColor Green
Write-Host "Not Running: $($notRunning.Count)/12" -ForegroundColor Yellow
$percentage = [math]::Round(($running.Count / 12) * 100, 0)
Write-Host "System Operational: $percentage%" -ForegroundColor $(if($percentage -ge 80){"Green"}elseif($percentage -ge 50){"Yellow"}else{"Red"})

if ($notRunning.Count -gt 0) {
    Write-Host ""
    Write-Host "Services Not Running:" -ForegroundColor Yellow
    foreach($svc in $notRunning) {
        Write-Host "  - $svc" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== ACCESS URLS ===" -ForegroundColor Cyan
if ($running -contains "Main Dashboard Frontend") {
    Write-Host "Main Dashboard:       http://localhost:3000" -ForegroundColor Green
}
if ($running -contains "GhostBuster Frontend") {
    Write-Host "GhostBuster UI:       http://localhost:3002" -ForegroundColor Green
}
if ($running -contains "GhostBuster Backend") {
    Write-Host "GhostBuster API:      http://localhost:3005" -ForegroundColor Green
}
if ($running -contains "VRT Guard") {
    Write-Host "VRT Guard API:        http://localhost:5002" -ForegroundColor Green
}
if ($running -contains "WhistlePro Backend") {
    Write-Host "WhistlePro API:       http://localhost:3006" -ForegroundColor Green
}

Write-Host ""
