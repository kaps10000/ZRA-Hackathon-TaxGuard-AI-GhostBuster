@echo off
title ZRA TaxGuard AI - System Manager
color 0B

:MENU
cls
echo.
echo ============================================================
echo      ZRA TAXGUARD AI - SYSTEM MANAGER
echo ============================================================
echo.
echo Choose an option:
echo.
echo   1. Start Core Services (Recommended)
echo   2. Start ALL Services (Core + Additional)
echo   3. Check System Status
echo   4. Stop All Services
echo   5. Open Dashboard (http://localhost:3000)
echo   6. View Service Logs
echo   7. Exit
echo.
echo ============================================================
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto START_CORE
if "%choice%"=="2" goto START_ALL
if "%choice%"=="3" goto CHECK_STATUS
if "%choice%"=="4" goto STOP_SERVICES
if "%choice%"=="5" goto OPEN_DASHBOARD
if "%choice%"=="6" goto VIEW_LOGS
if "%choice%"=="7" goto EXIT

echo Invalid choice. Please try again.
pause
goto MENU

:START_CORE
echo.
echo Starting Core Services...
powershell -ExecutionPolicy Bypass -File "Start-Core-Services.ps1"
echo.
echo Core services started! Press any key to return to menu...
pause >nul
goto MENU

:START_ALL
echo.
echo Starting ALL Services...
powershell -ExecutionPolicy Bypass -File "Start-ALL-Services.ps1"
echo.
echo All services started! Press any key to return to menu...
pause >nul
goto MENU

:CHECK_STATUS
echo.
echo Checking System Status...
powershell -ExecutionPolicy Bypass -File "Quick-Status.ps1"
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:STOP_SERVICES
echo.
echo Stopping All Services...
powershell -ExecutionPolicy Bypass -File "Stop-All-Services.ps1"
echo.
echo Services stopped! Press any key to return to menu...
pause >nul
goto MENU

:OPEN_DASHBOARD
echo.
echo Opening Dashboard in your default browser...
start http://localhost:3000
echo.
echo Dashboard opened! Press any key to return to menu...
pause >nul
goto MENU

:VIEW_LOGS
echo.
echo Service Logs Location:
echo   API Gateway: E:\ZRA PROJECT\api-gateway\logs\
echo   GhostBuster: Check PowerShell windows
echo   VRT Guard: Check PowerShell windows
echo   Predictive Analytics: Check PowerShell windows
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:EXIT
echo.
echo Thank you for using ZRA TaxGuard AI System Manager!
echo.
exit
