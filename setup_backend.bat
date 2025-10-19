@echo off
echo ============================================================
echo GhostBuster Backend Setup
echo ============================================================
echo.

cd backend

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Generating synthetic datasets...
python generate_datasets.py

echo.
echo ============================================================
echo Backend setup complete!
echo ============================================================
echo.
echo To start the backend server, run: start_backend.bat
echo.
pause
