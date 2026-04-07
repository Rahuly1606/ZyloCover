#!/usr/bin/env python
from app.db.session import SessionLocal
from app.models.claim import Claim
from app.models.user import User

db = SessionLocal()

# Get demo user
demo_user = db.query(User).filter(User.email == 'demo@zylocover.com').first()
print(f'Demo User: {demo_user.name} (ID: {demo_user.id})')
print(f'Seed Data - all_time_claim_count: {demo_user.all_time_claim_count}')

# Get actual claims for this user
actual_claims = db.query(Claim).filter(Claim.user_id == demo_user.id).all()
print(f'\nActual Claims in DB: {len(actual_claims)}')
for claim in actual_claims[:5]:
    print(f'  - Claim #{claim.id}: Status={claim.status}, fraud_score={claim.fraud_score}')

db.close()
