@echo off
title ZRA TaxGuard AI - System Shutdown
color 0C

echo.
echo ============================================================
echo      ZRA TAXGUARD AI - SYSTEM SHUTDOWN
echo ============================================================
echo.
echo Stopping all services...
echo.

REM Change to the project directory
cd /d "E:\ZRA PROJECT"

REM Run the PowerShell stop script
powershell -ExecutionPolicy Bypass -File "Stop-All-Services.ps1"

echo.
echo ============================================================
echo All services have been stopped.
echo ============================================================
echo.
echo Press any key to exit...
pause >nul
