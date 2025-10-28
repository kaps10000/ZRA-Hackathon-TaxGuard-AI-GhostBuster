@echo off
cls
echo ============================================================
echo              GHOSTBUSTER - QUICK START GUIDE
echo ============================================================
echo.
echo This will help you set up and run GhostBuster
echo.
echo Prerequisites:
echo   - Python 3.8+ (with pip)
echo   - Node.js 16+ (with npm)
echo.
echo ============================================================
echo.
pause

:menu
cls
echo ============================================================
echo                    GHOSTBUSTER MENU
echo ============================================================
echo.
echo 1. Setup Backend (First Time)
echo 2. Setup Frontend (First Time)
echo 3. Start Backend Server
echo 4. Start Frontend Application
echo 5. Setup Everything (First Time - Recommended)
echo 6. Exit
echo.
echo ============================================================
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto setup_backend
if "%choice%"=="2" goto setup_frontend
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto start_frontend
if "%choice%"=="5" goto setup_all
if "%choice%"=="6" goto exit
goto menu

:setup_backend
cls
echo ============================================================
echo Setting up Backend...
echo ============================================================
call setup_backend.bat
goto menu

:setup_frontend
cls
echo ============================================================
echo Setting up Frontend...
echo ============================================================
call setup_frontend.bat
goto menu

:start_backend
cls
echo ============================================================
echo Starting Backend Server...
echo ============================================================
echo.
echo API will be available at: http://localhost:5000
echo.
echo Keep this window open while using GhostBuster
echo Press Ctrl+C to stop the server
echo.
call start_backend.bat
goto menu

:start_frontend
cls
echo ============================================================
echo Starting Frontend Application...
echo ============================================================
echo.
echo Application will open at: http://localhost:3000
echo.
echo Keep this window open while using GhostBuster
echo Press Ctrl+C to stop the application
echo.
call start_frontend.bat
goto menu

:setup_all
cls
echo ============================================================
echo Setting up EVERYTHING (This may take a few minutes)...
echo ============================================================
echo.
echo Step 1/2: Setting up Backend...
call setup_backend.bat
echo.
echo Step 2/2: Setting up Frontend...
call setup_frontend.bat
echo.
echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo Next Steps:
echo   1. Open TWO command prompt windows
echo   2. In window 1, run: start_backend.bat
echo   3. In window 2, run: start_frontend.bat
echo   4. Application will open at http://localhost:3000
echo.
pause
goto menu

:exit
cls
echo ============================================================
echo                    Thank You!
echo ============================================================
echo.
echo GhostBuster - Catching Ghost Employees in Zambia
echo Built for ZRA Hackathon
echo.
echo For help, see:
echo   - README.md
echo   - INSTALLATION_GUIDE.md
echo   - USER_GUIDE.md
echo.
pause
exit
