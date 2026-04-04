@echo off
REM Backend Startup Script for RaahPay
REM ===================================

echo.
echo 🚀 Starting RaahPay Backend...
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
echo Backend directory: %SCRIPT_DIR%

REM Change to the backend directory
cd /d "%SCRIPT_DIR%"
echo ✅ Changed to backend directory

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    echo 🔧 Activating Python virtual environment...
    call venv\Scripts\activate.bat
    echo ✅ Virtual environment activated
) else (
    echo ⚠️  Virtual environment not found
    echo Please create it with: python -m venv venv
    pause
    exit /b 1
)

REM Install/update dependencies
echo 📦 Checking dependencies...
pip install -q -r requirements.txt
echo ✅ Dependencies checked

REM Start the server
echo.
echo ════════════════════════════════════════════════════════════
echo    🎯 RaahPay Backend is starting on http://127.0.0.1:8000
echo    📚 API Docs: http://127.0.0.1:8000/docs
echo ════════════════════════════════════════════════════════════
echo.

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
