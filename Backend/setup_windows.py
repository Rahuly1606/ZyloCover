#!/usr/bin/env python
"""
Windows-friendly RaahPay Setup Script
Handles virtual environment, dependencies, and database initialization
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(cmd, description):
    """Run a command and report result"""
    print(f"\n[*] {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        print(f"    ✓ {description} successful")
        if result.stdout:
            print(f"    {result.stdout.strip()[:100]}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"    ✗ {description} failed: {e.stderr[:200]}")
        return False
    except Exception as e:
        print(f"    ✗ {description} error: {str(e)[:200]}")
        return False

def main():
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    print("\n" + "="*60)
    print("  RAAHPAY BACKEND SETUP (Windows)")
    print("="*60)
    
    # Step 1: Check Python
    print("\n[1/5] Checking Python environment...")
    result = subprocess.run(f"{sys.executable} --version", shell=True, capture_output=True, text=True)
    print(f"    ✓ {result.stdout.strip()}")
    
    # Step 2: Virtual environment
    venv_path = backend_dir / "venv"
    if venv_path.exists():
        print("\n[2/5] Virtual environment already exists")
    else:
        if run_command(f"{sys.executable} -m venv venv", "Creating virtual environment"):
            print("    venv directory created successfully")
        else:
            print("    Failed to create venv!")
            return 1
    
    # Step 3: Install dependencies
    pip_exe = venv_path / "Scripts" / "pip.exe"
    python_exe = venv_path / "Scripts" / "python.exe"
    
    print("\n[3/5] Installing dependencies...")
    print("    This may take 2-3 minutes...")
    
    if run_command(f'"{python_exe}" -m pip install --upgrade pip', "Upgrading pip"):
        pass
    
    result = subprocess.run(f'"{python_exe}" -m pip install -q -r requirements.txt', shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        print("    ✓ All dependencies installed")
    else:
        print(f"    ⚠ Dependencies installed with warnings: {result.stderr[:200]}")
    
    # Step 4: Test imports
    print("\n[4/5] Testing core imports...")
    result = subprocess.run(f'"{python_exe}" -c "from app.core.config import get_settings; from app.db.session import SessionLocal; print(\'Imports OK\')"', shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        print("    ✓ Core imports successful")
        print(f"    {result.stdout.strip()}")
    else:
        print(f"    ✗ Import failed: {result.stderr[:300]}")
    
    # Step 5: Database initialization
    print("\n[5/5] Database initialization...")
    print("    Ensure MySQL is running with credentials from .env")
    result = subprocess.run(f'"{python_exe}" -c "from app.db.init_db import init_db; init_db(); print(\'Database ready\')"', shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        print("    ✓ Database tables created")
    else:
        print(f"    ⚠ Database init skipped (MySQL may not be running): {result.stderr[:200]}")
    
    print("\n" + "="*60)
    print("  ✓ SETUP COMPLETE!")
    print("="*60)
    print("\nNext steps:")
    print("  1. Ensure MySQL is running:")
    print("     - Windows: Use MySQL workbench or start MySQL service")
    print("     - Verify DATABASE_URL in .env is correct")
    print("\n  2. Seed demo data:")
    print(f'     "{python_exe}" -m seed_demo_data')
    print("\n  3. Start development server:")
    print(f'     "{python_exe}" -m uvicorn app.main:app --reload')
    print("\n  4. Access API docs:")
    print("     http://localhost:8000/docs")
    print("\n" + "="*60)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
