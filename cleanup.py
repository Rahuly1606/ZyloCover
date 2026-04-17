#!/usr/bin/env python3
"""
ZyloCover Project Cleanup Script
Removes redundant documentation and temporary files
"""

import os
from pathlib import Path
import shutil

# Files to remove (redundant documentation)
DOCS_TO_REMOVE = [
    "ADMIN_API_REFERENCE.md",
    "ADMIN_CENTER_GUIDE.md",
    "ADMIN_CREDENTIAL_SYSTEM.md",
    "ADMIN_FUNCTIONALITY_REPORT.md",
    "ADMIN_LOGIN_GUIDE.md",
    "ADMIN_LOGIN_SIMPLIFIED.md",
    "ADMIN_LOGIN_TROUBLESHOOTING.md",
    "ADMIN_SETUP_GUIDE.md",
    "CLOUDINARY_QUICK_START.md",
    "CLOUDINARY_SETUP.md",
    "COMPLETE_FIX_SUMMARY.md",
    "FINAL_COMPLETE_FIX.md",
    "FINAL_FIX_SUMMARY.md",
    "FINAL_STATUS.md",
    "FIXES_APPLIED.md",
    "HOW_TO_GET_ADMIN_CREDENTIALS.md",
    "QUICK_START.md",
    "STARTUP_GUIDE.md",
    "Backend/SCHEMA_FIX.md",
    "Backend/FINAL_SETUP.txt",
]

# Temporary/test files to remove
TEMP_FILES = [
    "Backend/check_admin.py",
    "Backend/check_claims.py",
    "Backend/create_admin.py",
    "Backend/demo_ai_models.py",
    "Backend/diagnose.py",
    "Backend/fix_schema.sql",
    "Backend/fix_users_schema.py",
    "Backend/get_admin_login.py",
    "Backend/migrate_add_admin_credential.py",
    "Backend/reset_admin_credential.py",
    "Backend/setup_windows.py",
    "Backend/test_ai_service.py",
    "Backend/test_env.py",
    "Backend/verify_setup.py",
]

# Keep these essential files
KEEP_FILES = [
    "README.md",  # Main project documentation
    "DEPLOYMENT.md",  # New unified deployment guide
    "Backend/README.md",  # Backend-specific docs
    "Backend/requirements.txt",
    "Backend/start.py",  # New unified startup
    "Backend/check_health.py",  # New health check
    "Backend/train_all_models.py",  # Essential for AI
    "Backend/seed_demo_data.py",  # Useful for testing
]


def remove_file(filepath: Path, dry_run: bool = True):
    """Remove a file if it exists."""
    if filepath.exists():
        if dry_run:
            print(f"  [DRY RUN] Would remove: {filepath}")
        else:
            filepath.unlink()
            print(f"  ✓ Removed: {filepath}")
        return True
    return False


def main():
    """Run cleanup."""
    import sys
    
    dry_run = "--dry-run" in sys.argv or "-n" in sys.argv
    force = "--force" in sys.argv or "-f" in sys.argv
    
    if not force and not dry_run:
        print("\n⚠️  WARNING: This will permanently delete files!")
        print("Run with --dry-run first to see what would be removed.")
        print("Run with --force to actually remove files.\n")
        return
    
    root = Path(__file__).parent
    
    print("\n" + "=" * 60)
    print("ZyloCover Project Cleanup")
    print("=" * 60 + "\n")
    
    if dry_run:
        print("🔍 DRY RUN MODE - No files will be deleted\n")
    else:
        print("🗑️  REMOVING FILES\n")
    
    # Remove redundant documentation
    print("Redundant Documentation:")
    removed_docs = 0
    for doc in DOCS_TO_REMOVE:
        filepath = root / doc
        if remove_file(filepath, dry_run):
            removed_docs += 1
    
    print(f"\n  Total: {removed_docs} documentation files\n")
    
    # Remove temporary files
    print("Temporary/Test Files:")
    removed_temp = 0
    for temp in TEMP_FILES:
        filepath = root / temp
        if remove_file(filepath, dry_run):
            removed_temp += 1
    
    print(f"\n  Total: {removed_temp} temporary files\n")
    
    # Summary
    print("=" * 60)
    print(f"Summary: {removed_docs + removed_temp} files to remove")
    print("=" * 60 + "\n")
    
    if dry_run:
        print("✓ Dry run complete. Run with --force to actually remove files.")
        print("  Example: python cleanup.py --force\n")
    else:
        print("✓ Cleanup complete!\n")
        print("Essential files kept:")
        for keep in KEEP_FILES:
            print(f"  • {keep}")
        print()


if __name__ == "__main__":
    main()
