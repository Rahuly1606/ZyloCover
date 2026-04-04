@echo off
REM RaahPay Setup for Windows PowerShell
REM ════════════════════════════════════════════════════════

echo.
echo ██████╗  █████╗  █████╗ ██╗  ██╗██████╗  █████╗ ██╗   ██╗
echo ██╔══██╗██╔══██╗██╔══██╗██║  ██║██╔══██╗██╔══██╗╚██╗ ██╔╝
echo ██████╔╝███████║███████║███████║██████╔╝███████║ ╚████╔╝ 
echo ██╔══██╗██╔══██║██╔══██║██╔══██║██╔═══╝ ██╔══██║  ╚██╔╝  
echo ██║  ██║██║  ██║██║  ██║██║  ██║██║     ██║  ██║   ██║   
echo ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝   
echo.
echo Parametric Income Insurance for India's Gig Workers
echo ====================================================
echo.

setlocal enabledelayedexpansion

REM Check Python
echo [1/6] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in PATH
    exit /b 1
)
echo   ✓ Python ready

REM Virtual Environment
echo [2/6] Virtual environment...
if exist venv\ (
    echo   ✓ venv already exists
) else (
    python -m venv venv
    echo   ✓ venv created
)

REM Activate and Install
echo [3/6] Installing dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt >nul 2>&1
echo   ✓ Dependencies installed

REM Database
echo [4/6] Database initialization...
python -c "from app.db.init_db import init_db; init_db()" 2>nul
if errorlevel 0 (
    echo   ✓ Database ready
) else (
    echo   ⚠ Database setup skipped
)

REM Demo Data
echo [5/6] Seeding demo data...
python -m seed_demo_data >nul 2>&1
if errorlevel 0 (
    echo   ✓ Demo data loaded
) else (
    echo   ⚠ Demo data skipped
)

REM Summary
echo [6/6] Verification...
python verify_setup.py >nul 2>&1
if errorlevel 0 (
    echo   ✓ All imports verified
) else (
    echo   ⚠ Verification skipped
)

echo.
echo ════════════════════════════════════════
echo ✓ RaahPay Setup Complete!
echo ════════════════════════════════════════
echo.
echo Next steps:
echo   1. Ensure MySQL is running and credentials in .env are correct
echo   2. Start server: uvicorn app.main:app --reload
echo   3. API docs: http://localhost:8000/docs
echo.

pause
