#!/usr/bin/env python3
"""
RaahPay Backend Verification Script
====================================
Checks that all critical files and imports are in place.
"""

import os
import sys
from pathlib import Path

REQUIRED_DIRS = [
    "app",
    "app/core",
    "app/db",
    "app/models",
    "app/services",
    "app/api",
    "app/api/routes",
    "app/schemas",
    "app/engine",
]

REQUIRED_FILES = [
    "app/__init__.py",
    "app/main.py",
    "app/core/__init__.py",
    "app/core/config.py",
    "app/core/security.py",
    "app/db/__init__.py",
    "app/db/session.py",
    "app/db/init_db.py",
    "app/models/__init__.py",
    "app/models/user.py",
    "app/models/policy.py",
    "app/models/trigger.py",
    "app/models/claim.py",
    "app/models/payout.py",
    "app/services/__init__.py",
    "app/services/pricing_engine.py",
    "app/services/fraud_engine.py",
    "app/services/environmental.py",
    "app/services/claim_pipeline.py",
    "app/api/__init__.py",
    "app/api/routes/__init__.py",
    "app/api/routes/auth.py",
    "app/api/routes/user.py",
    "app/api/routes/policy.py",
    "app/api/routes/pricing.py",
    "app/api/routes/claims.py",
    "app/api/routes/trigger.py",
    "app/api/routes/admin.py",
    "app/schemas/__init__.py",
    "app/engine/__init__.py",
    "app/engine/scheduler.py",
    ".env.example",
    ".env",
    ".gitignore",
    "requirements.txt",
    "setup.sh",
    "mysql_setup.sh",
    "seed_demo_data.py",
    "SETUP_GUIDE.md",
    "REFACTOR_SUMMARY.md",
]

def check_structure():
    """Verify all required directories and files exist"""
    print("\n" + "="*70)
    print("RaahPay Backend Structure Verification")
    print("="*70 + "\n")
    
    backend_dir = Path.cwd()
    if backend_dir.name != "Backend":
        print(f"⚠️  Warning: You should run this from the Backend directory")
        print(f"   Current: {backend_dir}")
    
    all_ok = True
    
    # Check directories
    print("📁 Checking directories...")
    for dir_path in REQUIRED_DIRS:
        full_path = backend_dir / dir_path
        if full_path.exists() and full_path.is_dir():
            print(f"  ✅ {dir_path}/")
        else:
            print(f"  ❌ {dir_path}/ - MISSING!")
            all_ok = False
    
    print()
    
    # Check files
    print("📄 Checking files...")
    for file_path in REQUIRED_FILES:
        full_path = backend_dir / file_path
        if full_path.exists() and full_path.is_file():
            size_kb = full_path.stat().st_size / 1024
            print(f"  ✅ {file_path} ({size_kb:.1f} KB)")
        else:
            print(f"  ❌ {file_path} - MISSING!")
            all_ok = False
    
    print()
    
    # Check key imports
    print("🔌 Checking key imports...")
    try:
        sys.path.insert(0, str(backend_dir))
        from app.core.config import Settings
        print(f"  ✅ app.core.config.Settings")
    except Exception as e:
        print(f"  ❌ app.core.config - {e}")
        all_ok = False
    
    try:
        from app.db.session import Base, SessionLocal
        print(f"  ✅ app.db.session (SQLAlchemy)")
    except Exception as e:
        print(f"  ❌ app.db.session - {e}")
        all_ok = False
    
    try:
        from app.models.user import User
        from app.models.policy import Policy
        from app.models.trigger import TriggerEvent
        from app.models.claim import Claim
        from app.models.payout import Payout
        print(f"  ✅ All ORM models loaded")
    except Exception as e:
        print(f"  ❌ ORM models - {e}")
        all_ok = False
    
    try:
        from app.services.pricing_engine import pricing_engine
        from app.services.fraud_engine import fraud_engine
        from app.services.environmental import env_service
        from app.services.claim_pipeline import claim_pipeline
        print(f"  ✅ All business logic services loaded")
    except Exception as e:
        print(f"  ❌ Services - {e}")
        all_ok = False
    
    try:
        from app.core.security import hash_password, create_access_token
        print(f"  ✅ Security utilities loaded")
    except Exception as e:
        print(f"  ❌ Security - {e}")
        all_ok = False
    
    print()
    print("="*70)
    if all_ok:
        print("✅ ALL CHECKS PASSED - Backend is ready!")
        print("="*70)
        print("\n📋 Next steps:")
        print("   1. Edit .env with your MySQL credentials")
        print("   2. Run: bash mysql_setup.sh")
        print("   3. Run: bash setup.sh")
        print("   4. Start server: uvicorn app.main:app --reload")
        print("   5. Visit: http://localhost:8000/docs")
        return 0
    else:
        print("❌ SOME CHECKS FAILED - Please fix the missing files above")
        print("="*70)
        return 1

if __name__ == "__main__":
    sys.exit(check_structure())
