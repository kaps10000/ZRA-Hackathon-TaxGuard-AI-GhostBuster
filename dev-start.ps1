## dev-start.ps1
# Starts the API and frontend in separate PowerShell windows (Windows only)

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

$apiFolder = Join-Path $root 'dashboard_integration\api_integration'
$frontendFolder = Join-Path $root 'dashboard_integration\frontend'

Write-Host "Starting API server in new window..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$apiFolder'; npm run dev"

Start-Sleep -Milliseconds 600

Write-Host "Starting Frontend (Vite) in new window..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$frontendFolder'; npm run dev"

Write-Host "Launched both processes. API -> http://localhost:4000, Frontend -> http://localhost:3000"
