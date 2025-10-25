# ZRA TaxGuard AI - Stop All Services Script
# Cleanly stops all Node.js and Python processes

Write-Host "============================================================" -ForegroundColor Red
Write-Host "     STOPPING ALL ZRA TAXGUARD AI SERVICES" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Red
Write-Host ""

Write-Host "Stopping all Node.js and Python processes..." -ForegroundColor Yellow
Write-Host ""

# Get all Node.js and Python processes
$processes = Get-Process | Where-Object {$_.ProcessName -eq 'node' -or $_.ProcessName -eq 'python'}

if ($processes) {
    $count = $processes.Count
    Write-Host "Found $count processes to stop:" -ForegroundColor Cyan
    
    foreach ($proc in $processes) {
        Write-Host "  - Stopping $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor White
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        } catch {
            # Process already terminated, ignore
        }
    }
    
    Write-Host ""
    Write-Host "All services stopped successfully!" -ForegroundColor Green
} else {
    Write-Host "No services are currently running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verifying all ports are free..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$portsInUse = netstat -ano | Select-String -Pattern ":3000|:3001|:3004|:3005|:4000|:4001|:5000|:5001|:5002|:5003" | Select-String -Pattern "LISTENING"

if ($portsInUse) {
    Write-Host "Warning: Some ports are still in use:" -ForegroundColor Red
    Write-Host $portsInUse -ForegroundColor Yellow
} else {
    Write-Host "All ports are now free!" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Red
Write-Host "Services stopped. You can now restart with:" -ForegroundColor Yellow
Write-Host "  .\Start-Core-Services.ps1" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Red
