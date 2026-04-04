"""
RaahPay Mock Demo Data Seed
=============================
Creates realistic demo users, policies, and history for testing.
"""

import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User, DeliveryPlatform, WorkZone
from app.models.policy import Policy, PolicyStatus
from app.models.trigger import TriggerEvent, TriggerType, TriggerStatus
from app.models.claim import Claim, ClaimStatus
from app.models.payout import Payout, PayoutStatus
from app.core.security import hash_password

logger = logging.getLogger("raahpay.seed")


DEMO_USERS = [
    {
        "name": "Ravi Kumar",
        "email": "ravi@demo.com",
        "password": "Demo1234!",
        "phone": "9876543210",
        "platform": "zomato",
        "work_zone": "zone_a_flood_prone",
        "avg_daily_income": 800.0,
        "avg_daily_hours": 8.0,
        "experience_months": 14,
        "base_latitude": 17.3850,
        "base_longitude": 78.5169,
    },
    {
        "name": "Priya Singh",
        "email": "priya@demo.com",
        "password": "Demo1234!",
        "phone": "9876543211",
        "platform": "swiggy",
        "work_zone": "zone_b_high_traffic",
        "avg_daily_income": 950.0,
        "avg_daily_hours": 10.0,
        "experience_months": 24,
        "base_latitude": 17.4608,
        "base_longitude": 78.5671,
    },
    {
        "name": "Amit Patel",
        "email": "amit@demo.com",
        "password": "Demo1234!",
        "phone": "9876543212",
        "platform": "blinkit",
        "work_zone": "zone_d_residential",
        "avg_daily_income": 600.0,
        "avg_daily_hours": 6.0,
        "experience_months": 6,
        "base_latitude": 17.3808,
        "base_longitude": 78.4381,
    },
    {
        "name": "Sunita Devi",
        "email": "sunita@demo.com",
        "password": "Demo1234!",
        "phone": "9876543213",
        "platform": "zepto",
        "work_zone": "zone_c_industrial",
        "avg_daily_income": 700.0,
        "avg_daily_hours": 8.0,
        "experience_months": 18,
        "base_latitude": 17.4578,
        "base_longitude": 78.7307,
    },
]

# Admin user with special privileges
ADMIN_USER = {
    "name": "ZyloCover Admin",
    "email": "admin@zylocover.com",
    "password": "Admin1234!",
    "phone": "9999999999",
    "platform": "other",
    "work_zone": "zone_d_residential",
    "avg_daily_income": 0.0,
    "avg_daily_hours": 0.0,
    "experience_months": 0,
    "base_latitude": 17.3850,
    "base_longitude": 78.5169,
    "is_admin": True,
}


def seed_demo_data():
    """Create demo users and sample data"""
    db = SessionLocal()
    
    try:
        # Clear existing demo data
        db.query(Payout).delete()
        db.query(Claim).delete()
        db.query(Policy).delete()
        db.query(TriggerEvent).delete()
        db.query(User).delete()
        db.commit()
        logger.info("Cleared existing demo data")
        
        # Create demo users
        users = []
        for user_data in DEMO_USERS:
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                phone=user_data["phone"],
                platform=DeliveryPlatform(user_data["platform"]),
                work_zone=WorkZone(user_data["work_zone"]),
                avg_daily_income=user_data["avg_daily_income"],
                avg_daily_hours=user_data["avg_daily_hours"],
                experience_months=user_data["experience_months"],
                base_latitude=user_data["base_latitude"],
                base_longitude=user_data["base_longitude"],
                is_active=True,
            )
            db.add(user)
            users.append(user)
        
        db.commit()
        logger.info(f"✅ Created {len(users)} demo users")
        
        # Create admin user
        admin_user = User(
            name=ADMIN_USER["name"],
            email=ADMIN_USER["email"],
            hashed_password=hash_password(ADMIN_USER["password"]),
            phone=ADMIN_USER["phone"],
            platform=DeliveryPlatform(ADMIN_USER["platform"]),
            work_zone=WorkZone(ADMIN_USER["work_zone"]),
            avg_daily_income=ADMIN_USER["avg_daily_income"],
            avg_daily_hours=ADMIN_USER["avg_daily_hours"],
            experience_months=ADMIN_USER["experience_months"],
            base_latitude=ADMIN_USER["base_latitude"],
            base_longitude=ADMIN_USER["base_longitude"],
            is_active=True,
            is_admin=True,
        )
        db.add(admin_user)
        db.commit()
        logger.info("✅ Created admin user")
        
        # Create sample active policies
        now = datetime.utcnow()
        for i, user in enumerate(users):
            policy = Policy(
                policy_number=f"RP-POL-20260404-{i+1:04d}",
                user_id=user.id,
                weekly_premium=149.0 + (i * 10),
                max_weekly_payout=500.0 + (i * 100),
                daily_income_insured=user.avg_daily_income,
                coverage_hours_per_day=user.avg_daily_hours * 7,
                start_date=now - timedelta(days=2),
                end_date=now + timedelta(days=5),
                status=PolicyStatus.ACTIVE,
                total_claimed_this_week=0.0,
                claim_count_this_week=0,
            )
            db.add(policy)
        
        db.commit()
        logger.info(f"✅ Created {len(users)} sample policies")
        
        # Create sample trigger event
        trigger = TriggerEvent(
            trigger_type=TriggerType.HEAVY_RAIN,
            status=TriggerStatus.ACTIVE,
            affected_zone="zone_a_flood_prone",
            affected_city="Hyderabad",
            measured_value=65.5,
            threshold_value=50.0,
            severity_pct=31.0,
            payout_multiplier=1.25,
            data_source="mock_weather_api",
        )
        db.add(trigger)
        db.commit()
        logger.info("✅ Created sample trigger event")
        
        logger.info("✅ Demo data seed complete!")
        logger.info("\n" + "="*60)
        logger.info("ADMIN LOGIN CREDENTIALS")
        logger.info("="*60)
        logger.info(f"Email: {ADMIN_USER['email']} | Password: {ADMIN_USER['password']}")
        logger.info("="*60)
        logger.info("\n" + "="*60)
        logger.info("DEMO WORKER LOGIN CREDENTIALS")
        logger.info("="*60)
        for user_data in DEMO_USERS:
            logger.info(f"Email: {user_data['email']} | Password: {user_data['password']}")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"❌ Error seeding demo data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_demo_data()
