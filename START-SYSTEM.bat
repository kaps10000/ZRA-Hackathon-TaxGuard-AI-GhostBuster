@echo off
title ZRA TaxGuard AI - System Startup
color 0B

echo.
echo ============================================================
echo      ZRA TAXGUARD AI - ONE-CLICK SYSTEM STARTUP
echo ============================================================
echo.
echo Starting all core services...
echo.

REM Change to the project directory
cd /d "E:\ZRA PROJECT"

REM Run the PowerShell startup script
powershell -ExecutionPolicy Bypass -File "Start-Core-Services.ps1"

echo.
echo ============================================================
echo System startup complete!
echo.
echo Access your dashboard at: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
