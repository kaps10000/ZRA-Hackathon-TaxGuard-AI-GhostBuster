@echo off
title ZRA TaxGuard AI - System Status
color 0A

echo.
echo ============================================================
echo      ZRA TAXGUARD AI - SYSTEM STATUS CHECK
echo ============================================================
echo.

REM Change to the project directory
cd /d "E:\ZRA PROJECT"

REM Run the PowerShell status script
powershell -ExecutionPolicy Bypass -File "Quick-Status.ps1"

echo.
echo Press any key to exit...
pause >nul
