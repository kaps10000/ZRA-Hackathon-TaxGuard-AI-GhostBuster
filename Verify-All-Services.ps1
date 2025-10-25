# ZRA TaxGuard AI - Service Verification Script
# Checks if all services are running correctly after startup

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "    ZRA TAXGUARD AI - SERVICE VERIFICATION" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking port availability..." -ForegroundColor Green
Write-Host ""

$runningServices = 0
$ports = @(3000, 3001, 3004, 3005, 4000, 4001, 5000, 5001, 5002, 5003)
$serviceNames = @("Dashboard Frontend", "Blockchain Service", "GhostBuster Frontend", "GhostBuster Backend", "WhistlePro Backend", "API Gateway", "VRT Guard (NEW)", "Main Flask Backend", "Anomaly Tracker", "Predictive Analytics")

for ($i = 0; $i -lt $ports.Length; $i++) {
    $port = $ports[$i]
    $name = $serviceNames[$i]
    
    # Check if port is listening
    $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    
    if ($connection) {
        Write-Host "✓ $name - Port $port is listening" -ForegroundColor Green
        $runningServices++
    } else {
        Write-Host "✗ $name - Port $port is not listening" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

if ($runningServices -eq 10) {
    Write-Host "🎉 ALL SERVICES ARE RUNNING! ($runningServices/10)" -ForegroundColor Green
} elseif ($runningServices -ge 6) {
    Write-Host "⚠️  CORE SERVICES RUNNING ($runningServices/10)" -ForegroundColor Yellow
    Write-Host "Some additional services may not be started yet." -ForegroundColor Yellow
} else {
    Write-Host "❌ SERVICES NOT READY ($runningServices/10)" -ForegroundColor Red
    Write-Host "Please wait longer or check for errors in service windows." -ForegroundColor Red
}

Write-Host ""
Write-Host "Quick Access URLs:" -ForegroundColor Green
Write-Host "  Main Dashboard:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "  VRT Guard:          http://localhost:5000" -ForegroundColor Cyan
Write-Host "  GhostBuster:        http://localhost:3004" -ForegroundColor Cyan
Write-Host "  API Gateway:        http://localhost:4001/health" -ForegroundColor Cyan
Write-Host ""

if ($runningServices -lt 6) {
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Wait 60-90 seconds for all services to start" -ForegroundColor White
    Write-Host "  2. Check PowerShell windows for error messages" -ForegroundColor White
    Write-Host "  3. Run .\Stop-All-Services.ps1 and restart" -ForegroundColor White
    Write-Host "  4. Use .\Start-Core-Services.ps1 for essential services only" -ForegroundColor White
}

Write-Host "============================================================" -ForegroundColor Cyan
