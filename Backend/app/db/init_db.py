"""
Database Initialization
=======================
Create all tables on startup
"""

import logging
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import Base, engine, SessionLocal
from app.models import user, policy, trigger, claim, payout
from app.core.security import hash_password
from app.models.user import User, DeliveryPlatform, WorkZone

logger = logging.getLogger("raahpay.db")


def init_db():
    """Create all database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables initialized")
        
        # Apply schema migrations
        apply_migrations()
        
        # Seed initial data
        seed_initial_data()
    except Exception as e:
        logger.error(f"❌ Database initialization error: {e}")
        raise


def apply_migrations():
    """Apply database schema migrations"""
    try:
        with engine.connect() as conn:
            # ──── Users table columns ────
            users_columns = [
                ("base_address", "ALTER TABLE users ADD COLUMN base_address VARCHAR(255) NULL"),
                ("last_gps_update", "ALTER TABLE users ADD COLUMN last_gps_update DATETIME NULL"),
                ("all_time_claim_count", "ALTER TABLE users ADD COLUMN all_time_claim_count INT DEFAULT 0"),
                ("fraud_flag_count", "ALTER TABLE users ADD COLUMN fraud_flag_count INT DEFAULT 0"),
                ("is_blacklisted", "ALTER TABLE users ADD COLUMN is_blacklisted BOOLEAN DEFAULT FALSE"),
                ("user_risk_score", "ALTER TABLE users ADD COLUMN user_risk_score FLOAT DEFAULT 0.0"),
                ("is_admin", "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE"),
                ("is_fraud_flagged", "ALTER TABLE users ADD COLUMN is_fraud_flagged BOOLEAN DEFAULT FALSE"),
                ("fraud_flag_reason", "ALTER TABLE users ADD COLUMN fraud_flag_reason VARCHAR(500) NULL"),
                ("employee_id", "ALTER TABLE users ADD COLUMN employee_id VARCHAR(50) NULL"),
                ("job_proof_image", "ALTER TABLE users ADD COLUMN job_proof_image VARCHAR(500) NULL"),
                ("job_verification_status", "ALTER TABLE users ADD COLUMN job_verification_status VARCHAR(20) DEFAULT 'pending'"),
                ("job_verified_at", "ALTER TABLE users ADD COLUMN job_verified_at DATETIME NULL"),
                ("registered_latitude", "ALTER TABLE users ADD COLUMN registered_latitude FLOAT NULL"),
                ("registered_longitude", "ALTER TABLE users ADD COLUMN registered_longitude FLOAT NULL"),
                ("registered_address", "ALTER TABLE users ADD COLUMN registered_address VARCHAR(255) NULL"),
                ("registered_at", "ALTER TABLE users ADD COLUMN registered_at DATETIME NULL"),
            ]
            
            logger.info("Migrating users table...")
            for column_name, alter_sql in users_columns:
                result = conn.execute(
                    text(f"""
                        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME='users' AND COLUMN_NAME='{column_name}' AND TABLE_SCHEMA=DATABASE()
                    """)
                )
                
                if not result.fetchone():
                    logger.info(f"  Adding {column_name}...")
                    try:
                        conn.execute(text(alter_sql))
                        conn.commit()
                        logger.info(f"  ✅ Added {column_name}")
                    except Exception as e:
                        logger.warning(f"  ⚠️  Could not add {column_name}: {str(e)[:100]}")
                        conn.rollback()
            
            # ──── Policies table columns ────
            policies_columns = [
                ("coverage_tier", "ALTER TABLE policies ADD COLUMN coverage_tier VARCHAR(50) DEFAULT 'standard'"),
                ("income_replacement_ratio", "ALTER TABLE policies ADD COLUMN income_replacement_ratio FLOAT DEFAULT 0.75"),
                ("daily_income_insured", "ALTER TABLE policies ADD COLUMN daily_income_insured FLOAT DEFAULT 0.0"),
                ("max_weekly_payout", "ALTER TABLE policies ADD COLUMN max_weekly_payout FLOAT DEFAULT 0.0"),
                ("coverage_hours_per_day", "ALTER TABLE policies ADD COLUMN coverage_hours_per_day FLOAT DEFAULT 24.0"),
                ("pricing_breakdown", "ALTER TABLE policies ADD COLUMN pricing_breakdown JSON NULL"),
                ("risk_snapshot", "ALTER TABLE policies ADD COLUMN risk_snapshot JSON NULL"),
                ("total_claimed_this_week", "ALTER TABLE policies ADD COLUMN total_claimed_this_week FLOAT DEFAULT 0.0"),
                ("claim_count_this_week", "ALTER TABLE policies ADD COLUMN claim_count_this_week INT DEFAULT 0"),
                ("cooling_period_ends_at", "ALTER TABLE policies ADD COLUMN cooling_period_ends_at DATETIME NULL"),
            ]
            
            logger.info("Migrating policies table...")
            for column_name, alter_sql in policies_columns:
                result = conn.execute(
                    text(f"""
                        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME='policies' AND COLUMN_NAME='{column_name}' AND TABLE_SCHEMA=DATABASE()
                    """)
                )
                
                if not result.fetchone():
                    logger.info(f"  Adding {column_name}...")
                    try:
                        conn.execute(text(alter_sql))
                        conn.commit()
                        logger.info(f"  ✅ Added {column_name}")
                    except Exception as e:
                        logger.warning(f"  ⚠️  Could not add {column_name}: {str(e)[:100]}")
                        conn.rollback()
            
            # ──── Claims table columns ────
            claims_columns = [
                ("severity_band", "ALTER TABLE claims ADD COLUMN severity_band VARCHAR(50) DEFAULT 'partial'"),
                ("severity_multiplier", "ALTER TABLE claims ADD COLUMN severity_multiplier FLOAT DEFAULT 0.5"),
                ("trigger_measured_value", "ALTER TABLE claims ADD COLUMN trigger_measured_value FLOAT NULL"),
                ("trigger_type", "ALTER TABLE claims ADD COLUMN trigger_type VARCHAR(50) NULL"),
                ("payout_multiplier", "ALTER TABLE claims ADD COLUMN payout_multiplier FLOAT DEFAULT 1.0"),
                ("claim_latitude", "ALTER TABLE claims ADD COLUMN claim_latitude FLOAT NULL"),
                ("claim_longitude", "ALTER TABLE claims ADD COLUMN claim_longitude FLOAT NULL"),
                ("location_distance_km", "ALTER TABLE claims ADD COLUMN location_distance_km FLOAT NULL"),
                ("location_mismatch_flag", "ALTER TABLE claims ADD COLUMN location_mismatch_flag VARCHAR(50) NULL"),
            ]
            
            logger.info("Migrating claims table...")
            for column_name, alter_sql in claims_columns:
                result = conn.execute(
                    text(f"""
                        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME='claims' AND COLUMN_NAME='{column_name}' AND TABLE_SCHEMA=DATABASE()
                    """)
                )
                
                if not result.fetchone():
                    logger.info(f"  Adding {column_name}...")
                    try:
                        conn.execute(text(alter_sql))
                        conn.commit()
                        logger.info(f"  ✅ Added {column_name}")
                    except Exception as e:
                        logger.warning(f"  ⚠️  Could not add {column_name}: {str(e)[:100]}")
                        conn.rollback()
            
            logger.info("✅ All migrations completed")
                
    except Exception as e:
        logger.error(f"❌ Migration error: {e}")
        # Don't raise - let the app continue even if migrations fail


def seed_initial_data():
    """Seed admin and demo users if they don't exist"""
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.email == "admin@zylocover.com").first()
        
        if not admin:
            logger.info("Creating admin user...")
            admin_user = User(
                name="ZyloCover Admin",
                email="admin@zylocover.com",
                hashed_password=hash_password("Admin1234!"),
                phone="9999999999",
                platform=DeliveryPlatform.OTHER,
                work_zone=WorkZone.ZONE_D_RESIDENTIAL,
                avg_daily_income=0.0,
                avg_daily_hours=0.0,
                experience_months=0,
                base_latitude=17.3850,
                base_longitude=78.5169,
                base_address="Hyderabad Admin Center",
                is_active=True,
                is_admin=True,
            )
            db.add(admin_user)
            db.commit()
            logger.info("✅ Admin user created")
            logger.info("=" * 60)
            logger.info("ADMIN CREDENTIALS")
            logger.info("=" * 60)
            logger.info("Email: admin@zylocover.com")
            logger.info("Password: Admin1234!")
            logger.info("=" * 60)
        else:
            logger.info("✅ Admin user already exists")
        
        # Create demo users for testing
        demo_users = [
            {
                "name": "Rajesh Kumar",
                "email": "demo@zylocover.com",
                "password": "Demo1234!",
                "phone": "9876543210",
                "platform": DeliveryPlatform.ZOMATO,
                "work_zone": WorkZone.ZONE_A_FLOOD,
                "avg_daily_income": 35000.0,
                "avg_daily_hours": 10.0,
                "location": (17.3850, 78.5169),
            },
            {
                "name": "Priya Sharma",
                "email": "priya@demo.zylocover.com",
                "password": "Demo1234!",
                "phone": "9876543211",
                "platform": DeliveryPlatform.ZOMATO,
                "work_zone": WorkZone.ZONE_B_TRAFFIC,
                "avg_daily_income": 28000.0,
                "avg_daily_hours": 8.0,
                "location": (17.4000, 78.5200),
            },
            {
                "name": "Arjun Singh",
                "email": "arjun@demo.zylocover.com",
                "password": "Demo1234!",
                "phone": "9876543212",
                "platform": DeliveryPlatform.SWIGGY,
                "work_zone": WorkZone.ZONE_C_INDUSTRIAL,
                "avg_daily_income": 32000.0,
                "avg_daily_hours": 9.0,
                "location": (17.3700, 78.4800),
            },
            {
                "name": "Kavya Patel",
                "email": "kavya@demo.zylocover.com",
                "password": "Demo1234!",
                "phone": "9876543213",
                "platform": DeliveryPlatform.BLINKIT,
                "work_zone": WorkZone.ZONE_D_RESIDENTIAL,
                "avg_daily_income": 40000.0,
                "avg_daily_hours": 12.0,
                "location": (17.3900, 78.4900),
            },
        ]
        
        for demo_data in demo_users:
            existing_user = db.query(User).filter(User.email == demo_data["email"]).first()
            if not existing_user:
                logger.info(f"Creating demo user: {demo_data['email']}...")
                demo_user = User(
                    name=demo_data["name"],
                    email=demo_data["email"],
                    hashed_password=hash_password(demo_data["password"]),
                    phone=demo_data["phone"],
                    platform=demo_data["platform"],
                    work_zone=demo_data["work_zone"],
                    avg_daily_income=demo_data["avg_daily_income"],
                    avg_daily_hours=demo_data["avg_daily_hours"],
                    experience_months=12,
                    base_latitude=demo_data["location"][0],
                    base_longitude=demo_data["location"][1],
                    base_address=demo_data.get("address", "Hyderabad, India"),
                    is_active=True,
                    is_admin=False,
                )
                db.add(demo_user)
        
        db.commit()
        
        logger.info("")
        logger.info("=" * 60)
        logger.info("📝 DEMO USER CREDENTIALS (for testing)")
        logger.info("=" * 60)
        logger.info("")
        logger.info("Primary Demo User:")
        logger.info("  Email: demo@zylocover.com")
        logger.info("  Password: Demo1234!")
        logger.info("  Platform: Zomato")
        logger.info("  Zone: Flood Prone")
        logger.info("  Income: ₹35,000/day")
        logger.info("")
        logger.info("Additional Demo Users:")
        logger.info("  • priya@demo.zylocover.com | Demo1234! (Zomato, High Traffic, ₹28k/day)")
        logger.info("  • arjun@demo.zylocover.com | Demo1234! (Swiggy, Industrial, ₹32k/day)")
        logger.info("  • kavya@demo.zylocover.com | Demo1234! (Blinkit, Residential, ₹40k/day)")
        logger.info("")
        logger.info("=" * 60)
            
    except Exception as e:
        logger.error(f"❌ Seed error: {e}")
        db.rollback()
    finally:
        db.close()
