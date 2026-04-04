#!/bin/bash
# Backend Startup Script for RaahPay
# ===================================

echo "🚀 Starting RaahPay Backend..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Backend directory: $SCRIPT_DIR"

# Change to the backend directory
cd "$SCRIPT_DIR"
echo "✅ Changed to backend directory"

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    echo "🔧 Activating Python virtual environment..."
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "⚠️  Virtual environment not found"
    echo "Please create it with: python3 -m venv venv"
    exit 1
fi

# Install/update dependencies if needed
echo "📦 Checking dependencies..."
pip install -q -r requirements.txt 2>&1 | grep -E "error|warning" || true
echo "✅ Dependencies checked"

# Start the server
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  🎯 RaahPay Backend is starting on http://127.0.0.1:8000"
echo "  📚 API Docs: http://127.0.0.1:8000/docs"
echo "════════════════════════════════════════════════════════════"
echo ""

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
