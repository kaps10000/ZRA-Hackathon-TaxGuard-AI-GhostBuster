# ZRA TaxGuard AI - Port Verification Script
# Checks if all services are running on correct ports

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     ZRA TAXGUARD AI - PORT VERIFICATION" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Define expected ports and services
$services = @(
    @{Port=3000; Name="Dashboard Frontend"; HealthCheck=""},
    @{Port=3001; Name="Blockchain Service"; HealthCheck=""},
    @{Port=3004; Name="GhostBuster Frontend"; HealthCheck=""},
    @{Port=3005; Name="GhostBuster Backend"; HealthCheck="http://localhost:3005/api/health"},
    @{Port=4000; Name="WhistlePro Backend"; HealthCheck=""},
    @{Port=4001; Name="API Gateway"; HealthCheck="http://localhost:4001/health"},
    @{Port=5000; Name="OCR Backend"; HealthCheck=""},
    @{Port=5001; Name="Anomaly Tracker"; HealthCheck="http://localhost:5001/health"},
    @{Port=5002; Name="VRT Guard (NEW)"; HealthCheck="http://localhost:5002/health"},
    @{Port=5003; Name="Predictive Analytics"; HealthCheck="http://localhost:5003/health"},
    @{Port=8000; Name="OCR AI Service"; HealthCheck="http://localhost:8000/docs"}
)

Write-Host "Checking port status..." -ForegroundColor Yellow
Write-Host ""

$runningCount = 0
$totalCount = $services.Count

foreach ($service in $services) {
    $port = $service.Port
    $name = $service.Name
    $healthCheck = $service.HealthCheck

    # Check if port is listening
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1

    if ($connection) {
        Write-Host "✓ Port $port" -ForegroundColor Green -NoNewline
        Write-Host " - $name" -ForegroundColor White -NoNewline
        Write-Host " [RUNNING]" -ForegroundColor Green

        # Try health check if available
        if ($healthCheck) {
            try {
                $response = Invoke-RestMethod -Uri $healthCheck -TimeoutSec 2 -ErrorAction Stop
                Write-Host "    └─ Health check: " -ForegroundColor Gray -NoNewline
                Write-Host "OK" -ForegroundColor Green
            } catch {
                Write-Host "    └─ Health check: " -ForegroundColor Gray -NoNewline
                Write-Host "No response (service may still be starting)" -ForegroundColor Yellow
            }
        }

        $runningCount++
    } else {
        Write-Host "✗ Port $port" -ForegroundColor Red -NoNewline
        Write-Host " - $name" -ForegroundColor White -NoNewline
        Write-Host " [NOT RUNNING]" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Summary: " -ForegroundColor Yellow -NoNewline
Write-Host "$runningCount/$totalCount services running" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($runningCount -eq 0) {
    Write-Host "⚠ No services are running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start all services, run:" -ForegroundColor Yellow
    Write-Host "  .\START-ALL-SERVICES-FIXED.ps1" -ForegroundColor White
    Write-Host ""
} elseif ($runningCount -lt $totalCount) {
    Write-Host "⚠ Some services are not running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Missing services can be started individually or run:" -ForegroundColor Yellow
    Write-Host "  .\START-ALL-SERVICES-FIXED.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "✓ All services are running successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "  Main Dashboard:    http://localhost:3000" -ForegroundColor White
    Write-Host "  GhostBuster:       http://localhost:3004" -ForegroundColor White
    Write-Host "  GhostBuster API:   http://localhost:3005/api/health" -ForegroundColor White
    Write-Host "  API Gateway:       http://localhost:4001" -ForegroundColor White
    Write-Host ""
}

# Check for port conflicts
Write-Host "Checking for port conflicts..." -ForegroundColor Yellow
$allPorts = $services | ForEach-Object { $_.Port }
$conflicts = @()

foreach ($port in $allPorts) {
    $connections = @(Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue)
    if ($connections.Count -gt 1) {
        $conflicts += $port
    }
}

if ($conflicts.Count -gt 0) {
    Write-Host "⚠ WARNING: Port conflicts detected!" -ForegroundColor Red
    Write-Host "Ports with multiple processes: $($conflicts -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run this to fix:" -ForegroundColor Yellow
    Write-Host "  .\Stop-All-Services.ps1" -ForegroundColor White
    Write-Host "  .\START-ALL-SERVICES-FIXED.ps1" -ForegroundColor White
} else {
    Write-Host "✓ No port conflicts detected" -ForegroundColor Green
}

Write-Host ""
