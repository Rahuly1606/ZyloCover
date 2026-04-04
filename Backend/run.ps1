# Backend Startup Script for RaahPay
# ==========================================

Write-Host "🚀 Starting RaahPay Backend..." -ForegroundColor Cyan

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Backend directory: $scriptDir" -ForegroundColor Gray

# Change to the backend directory
Set-Location $scriptDir
Write-Host "✅ Changed to backend directory" -ForegroundColor Green

# Activate virtual environment
$venvPath = Join-Path $scriptDir "venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    Write-Host "🔧 Activating Python virtual environment..." -ForegroundColor Cyan
    & $venvPath
    Write-Host "✅ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "⚠️  Virtual environment not found at $venvPath" -ForegroundColor Yellow
    Write-Host "Please create it with: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Install/update dependencies if needed
Write-Host "📦 Checking dependencies..." -ForegroundColor Cyan
pip install -q -r requirements.txt 2>&1 | Where-Object { $_ -match "error|warning" } | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
Write-Host "✅ Dependencies checked" -ForegroundColor Green

# Start the server
Write-Host "" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎯 RaahPay Backend is starting on http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  📚 API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
