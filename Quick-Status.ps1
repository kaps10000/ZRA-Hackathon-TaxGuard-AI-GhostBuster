# Quick Service Status Check
Write-Host "=== ZRA TaxGuard AI - Quick Status ===" -ForegroundColor Cyan
Write-Host ""

$services = @{
    3000 = "Dashboard Frontend"
    3004 = "GhostBuster Frontend" 
    3005 = "GhostBuster Backend"
    4001 = "API Gateway"
    5000 = "VRT Guard (NEW)"
    5003 = "Predictive Analytics"
}

$running = 0
foreach($port in $services.Keys | Sort-Object) {
    $name = $services[$port]
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
        Write-Host "[OK] $name - Port $port" -ForegroundColor Green
        $running++
    } catch {
        Write-Host "[--] $name - Port $port" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Core Services Running: $running/6" -ForegroundColor $(if($running -ge 4) {"Green"} else {"Yellow"})

if ($running -ge 4) {
    Write-Host ""
    Write-Host "🎉 System is ready! Access at:" -ForegroundColor Green
    Write-Host "   Dashboard: http://localhost:3000" -ForegroundColor Cyan
}
