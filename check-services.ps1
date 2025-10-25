# ZRA TaxGuard AI - Service Status Checker
Write-Host "=== ZRA TaxGuard AI - Service Status Check ===" -ForegroundColor Cyan
Write-Host ""

$ports = @{
    3000 = "Dashboard Frontend"
    3001 = "Blockchain Service"
    3004 = "Predictive Analytics"
    3005 = "GhostBuster/WhistlePro Backend"
    4000 = "API Gateway (Alt)"
    4001 = "API Gateway"
    5000 = "Main Flask Backend / OCR Backend"
    5001 = "Anomaly Tracker"
    5002 = "VRT Guard"
    8000 = "OCR AI Service"
}

$running = @()
$notRunning = @()

foreach($port in $ports.Keys | Sort-Object){
    $serviceName = $ports[$port]
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
        Write-Host "[OK] Port $port : $serviceName (PID: $($conn.OwningProcess))" -ForegroundColor Green
        $running += $serviceName
    } catch {
        Write-Host "[--] Port $port : $serviceName (NOT RUNNING)" -ForegroundColor Yellow
        $notRunning += $serviceName
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Running Services: $($running.Count)" -ForegroundColor Green
Write-Host "Not Running: $($notRunning.Count)" -ForegroundColor Yellow

if ($notRunning.Count -gt 0) {
    Write-Host ""
    Write-Host "Services Not Running:" -ForegroundColor Yellow
    foreach($svc in $notRunning) {
        Write-Host "  - $svc" -ForegroundColor Yellow
    }
}
