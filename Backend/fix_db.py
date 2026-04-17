#!/usr/bin/env python3
"""
Add missing admin_credential column to users table
"""
import os
import sys
from pathlib import Path

# Add Backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment
load_dotenv()

def add_missing_column():
    """Add admin_credential column if it doesn't exist."""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        return 1
    
    print(f"🔗 Connecting to database...")
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Check if column exists
            result = conn.execute(text("""
                SELECT COUNT(*) as count
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'users' 
                AND COLUMN_NAME = 'admin_credential'
            """))
            
            exists = result.fetchone()[0] > 0
            
            if exists:
                print("✅ Column 'admin_credential' already exists")
                return 0
            
            # Add the column
            print("➕ Adding 'admin_credential' column...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN admin_credential VARCHAR(255) NULL
            """))
            conn.commit()
            
            print("✅ Column added successfully!")
            return 0
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(add_missing_column())
