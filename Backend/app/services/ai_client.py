# app/services/ai_client.py
"""
AI Service Client — Calls the AI microservice with graceful fallbacks.
Integrates ML predictions into the main FastAPI backend.
"""

import httpx
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
import json

logger = logging.getLogger("ai_client")

# Configuration
AI_SERVICE_URL = "http://localhost:8000/ai"  # Updated to use mounted path
TIMEOUT = 5.0  # seconds
FALLBACK_ENABLED = True


class AIServiceClient:
    """Client for calling AI microservice with fallback logic."""
    
    def __init__(self, base_url: str = AI_SERVICE_URL, timeout: float = TIMEOUT):
        self.base_url = base_url
        self.timeout = timeout
        self._health_cache = None
        self._health_cache_time = None
    
    async def is_available(self) -> bool:
        """Check if AI service is healthy."""
        try:
            # Cache health check for 30 seconds
            if self._health_cache is not None:
                if (datetime.now() - self._health_cache_time).total_seconds() < 30:
                    return self._health_cache
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{self.base_url}/health")
                available = resp.status_code == 200
            
            self._health_cache = available
            self._health_cache_time = datetime.now()
            return available
        except Exception as e:
            logger.warning(f"AI service health check failed: {e}")
            return False
    
    async def predict_fraud(self, claim_features: Dict) -> Dict:
        """
        Predict fraud probability for a claim.
        
        Args:
            claim_features: Dict with 12 fraud detection features
        
        Returns:
            {
                'fraud_probability': 0-1,
                'decision': 'approved' | 'flagged' | 'rejected',
                'top_risk_factors': [...],
                'explainability': {...},
                'status': 'success' | 'fallback'
            }
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/predict/fraud",
                    json=claim_features
                )
                resp.raise_for_status()
                result = resp.json()
                logger.info(f"Fraud prediction success: {result['data']['decision']}")
                return result['data']
        except Exception as e:
            logger.error(f"Fraud prediction failed: {e}")
            if FALLBACK_ENABLED:
                return self._fraud_fallback(claim_features)
            raise
    
    async def predict_premium(self, user_features: Dict, coverage_tier: str) -> Dict:
        """
        Predict dynamic premium for a user.
        
        Args:
            user_features: Dict with 8 pricing features
            coverage_tier: 'basic' | 'standard' | 'premium'
        
        Returns:
            {
                'base_premium': float,
                'final_premium': float,
                'tier_multiplier': float,
                'top_pricing_factors': [...],
                'explainability': {...},
                'status': 'success' | 'fallback'
            }
        """
        try:
            payload = {**user_features, 'coverage_tier': coverage_tier}
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/predict/premium",
                    json=payload
                )
                resp.raise_for_status()
                result = resp.json()
                logger.info(f"Premium prediction success: ₹{result['data']['final_premium']}")
                return result['data']
        except Exception as e:
            logger.error(f"Premium prediction failed: {e}")
            if FALLBACK_ENABLED:
                return self._pricing_fallback(coverage_tier)
            raise
    
    async def predict_risk_score(self, user_features: Dict) -> Dict:
        """
        Predict user risk score (0-100).
        
        Returns: {'risk_score': 0-100, 'risk_tier': str, ...}
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/predict/risk",
                    json=user_features
                )
                resp.raise_for_status()
                result = resp.json()
                return result['data']
        except Exception as e:
            logger.error(f"Risk prediction failed: {e}")
            if FALLBACK_ENABLED:
                return {'risk_score': 50, 'risk_tier': 'medium', 'risk_probability': 0.5}
            raise
    
    async def detect_weather_anomaly(self, weather_features: Dict) -> Dict:
        """
        Detect weather anomalies using IsolationForest.
        
        Returns: {'anomaly_score': 0-1, 'is_anomaly': bool, 'interpretation': str}
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.base_url}/predict/anomaly",
                    json=weather_features
                )
                resp.raise_for_status()
                result = resp.json()
                return result['data']
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
            if FALLBACK_ENABLED:
                return {'anomaly_score': 0.0, 'is_anomaly': False, 'interpretation': 'Fallback: no anomaly'}
            raise
    
    async def forecast_risk(self, city: str, days: int = 7) -> Optional[list]:
        """
        Get 7-day risk forecast for a city.
        
        Returns: List of daily forecasts with risk levels
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    f"{self.base_url}/forecast/{city}",
                    params={'days': days}
                )
                resp.raise_for_status()
                result = resp.json()
                
                if result.get('status') == 'success':
                    return result.get('forecast', [])
                return None
        except Exception as e:
            logger.error(f"Forecast failed for {city}: {e}")
            return None
    
    # ========================================================================
    # FALLBACK IMPLEMENTATIONS (Rules Engine)
    # ========================================================================
    
    @staticmethod
    def _fraud_fallback(features: Dict) -> Dict:
        """Fallback fraud detection using hardcoded rules."""
        score = 0.0
        flags = []
        
        if features.get('policy_age_hours', 24) < 1:
            score += 0.25
            flags.append('policy_too_new')
        
        if features.get('claims_7d', 0) > 4:
            score += 0.20
            flags.append('claim_frequency_exceeded')
        
        if features.get('gps_distance_km', 0) > 15:
            score += 0.15
            flags.append('gps_zone_mismatch')
        
        if features.get('account_age_days', 7) < 7:
            score += 0.10
            flags.append('new_account')
        
        if features.get('prior_fraud_flags', 0) > 0:
            score += min(features.get('prior_fraud_flags', 0) * 0.15, 0.45)
            flags.append('prior_fraud_history')
        
        decision = (
            'rejected' if score >= 0.70
            else 'flagged' if score >= 0.40
            else 'approved'
        )
        
        return {
            'fraud_probability': round(score, 4),
            'decision': decision,
            'top_risk_factors': [{'feature': f, 'impact': 0.0} for f in flags],
            'fallback_reason': 'Rules engine fallback',
            'status': 'fallback'
        }
    
    @staticmethod
    def _pricing_fallback(coverage_tier: str) -> Dict:
        """Fallback pricing using hardcoded multipliers."""
        tier_premiums = {
            'basic': 22.50,
            'standard': 32.50,
            'premium': 55.00
        }
        premium = tier_premiums.get(coverage_tier, 32.50)
        
        return {
            'base_premium': premium / 1.35,
            'final_premium': premium,
            'tier_multiplier': 1.0 if coverage_tier == 'basic' else 1.35 if coverage_tier == 'standard' else 1.75,
            'top_pricing_factors': [],
            'model_mae': '±₹7.50',
            'fallback_reason': 'Hardcoded default pricing',
            'status': 'fallback'
        }


# Singleton instance
_ai_client = None


def get_ai_client() -> AIServiceClient:
    """Get or create AI service client."""
    global _ai_client
    if _ai_client is None:
        _ai_client = AIServiceClient()
    return _ai_client


# ============================================================================
# INTEGRATION EXAMPLES
# ============================================================================
# Use in your endpoint like this:
#
# @router.post("/claims")
# async def create_claim(data: ClaimRequest, db: AsyncSession = Depends(get_db)):
#     ai_client = get_ai_client()
#     
#     # Get fraud prediction
#     fraud_result = await ai_client.predict_fraud(claim_features)
#     
#     claim.fraud_score = fraud_result['fraud_probability']
#     claim.fraud_decision = fraud_result['decision']
#     claim.fraud_explanation = fraud_result.get('explainability', {})
#
#     # Status updates
#     if fraud_result['decision'] == 'rejected':
#         claim.status = ClaimStatus.REJECTED
#     elif fraud_result['decision'] == 'flagged':
#         claim.status = ClaimStatus.FLAGGED
#     else:
#         claim.status = ClaimStatus.APPROVED
#
#     db.add(claim)
#     await db.commit()
