from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.payout import Payout, PayoutStatus
from app.models.claim import Claim, ClaimStatus

router = APIRouter(prefix="/payouts", tags=["Payouts"])


@router.get("")
def list_payouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """All payouts for the authenticated user."""
    payouts = (
        db.query(Payout)
        .filter(Payout.user_id == current_user.id)
        .order_by(Payout.initiated_at.desc())
        .all()
    )
    total_received = sum(p.amount for p in payouts if p.status == PayoutStatus.SUCCESS)

    return {
        "total_payouts": len(payouts),
        "total_received_inr": round(total_received, 2),
        "payouts": [
            {
                "id": p.id,
                "claim_id": p.claim_id,
                "amount_inr": p.amount,
                "currency": p.currency,
                "status": p.status,
                "gateway": p.gateway,
                "gateway_reference": p.gateway_reference,
                "upi_id": p.upi_id,
                "initiated_at": p.initiated_at.isoformat(),
                "completed_at": p.completed_at.isoformat() if p.completed_at else None,
                "failure_reason": p.failure_reason,
            }
            for p in payouts
        ]
    }


@router.get("/{payout_id}")
def get_payout(
    payout_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payout = (
        db.query(Payout)
        .filter(Payout.id == payout_id, Payout.user_id == current_user.id)
        .first()
    )
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")

    return {
        "id": payout.id,
        "claim_id": payout.claim_id,
        "amount_inr": payout.amount,
        "status": payout.status,
        "gateway": payout.gateway,
        "gateway_reference": payout.gateway_reference,
        "upi_id": payout.upi_id,
        "initiated_at": payout.initiated_at.isoformat(),
        "completed_at": payout.completed_at.isoformat() if payout.completed_at else None,
        "linked_claim": {
            "claim_number": payout.claim.claim_number if payout.claim else None,
            "status": payout.claim.status if payout.claim else None,
        }
    }


@router.get("/summary/monthly")
def monthly_payout_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Monthly breakdown of payouts received — for worker's earnings dashboard."""
    from collections import defaultdict
    payouts = (
        db.query(Payout)
        .filter(Payout.user_id == current_user.id, Payout.status == PayoutStatus.SUCCESS)
        .all()
    )

    monthly = defaultdict(float)
    for p in payouts:
        key = p.initiated_at.strftime("%Y-%m")
        monthly[key] += p.amount

    return {
        "monthly_summary": [
            {"month": k, "total_inr": round(v, 2)}
            for k, v in sorted(monthly.items(), reverse=True)
        ],
        "all_time_total_inr": round(sum(monthly.values()), 2),
        "total_payouts": len(payouts),
    }
