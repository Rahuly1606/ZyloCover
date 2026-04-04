// ============================================================================
// API Response Types - Matches Backend Pydantic Schemas
// ============================================================================

// Auth
export interface AuthResponse {
    access_token: string
    token_type: string
    user_id: number
}

// User Profile (including location)
export interface User {
    id: number
    name: string
    email: string
    phone: string
    platform: "swiggy" | "zomato" | "uber"
    work_zone: string
    avg_daily_income: number
    avg_daily_hours: number
    experience_months: number
    latitude?: number       // NEW: GPS coordinates
    longitude?: number      // NEW: GPS coordinates
    address?: string        // NEW: Reverse geocoded address
    all_time_claim_count: number    // NEW: For experience rating
    fraud_flag_count: number         // NEW: 3-strike blacklisting
    is_blacklisted: boolean          // NEW: All claims rejected if true
    user_risk_score: number          // NEW: 0-100 actuarial score
    last_gps_update?: string         // NEW: Stale location detection
    is_active: boolean
    created_at: string
}

export interface UserStats {
    user_id: number
    active_policies: number
    total_claims: number
    total_payouts: number
    fraud_flags: number
    last_claim_date: string | null
}

// Premium Calculation with Actuarial Breakdown
export interface PremiumBreakdown {
    pure_premium: number            // P(trigger) × severity × income × IRR
    gross_premium: number           // pure_premium ÷ 0.67 (add 25% expense + 8% profit)
    experience_multiplier: number   // Discount/surcharge based on history
    final_premium: number           // Final bounded [₹15, ₹120]
}

export interface PricingResponse {
    final_premium: number
    breakdown: PremiumBreakdown
    city_risk: number
    zone_multiplier: number
    platform_multiplier: number
    recommended_tier: "basic" | "standard" | "premium"
}

export interface CoverageTier {
    tier: "basic" | "standard" | "premium"
    income_replacement_ratio: number  // 0.60, 0.75, or 0.90
    premium_multiplier: number        // 1.0, 1.35, or 1.75
    monthly_premium_range: string
    annual_coverage: string
}

// Policy (with coverage tiers & cooling period)
export interface Policy {
    id: number
    policy_number: string
    user_id: number
    coverage_tier: "basic" | "standard" | "premium"
    income_replacement_ratio: number
    premium_per_week: number
    max_payout_per_week: number
    pricing_breakdown: PremiumBreakdown
    status: "active" | "expired" | "cancelled"
    cooling_period_ends_at: string  // 2-hour gap enforcement
    created_at: string
    end_at: string
    days_remaining?: number
    amount_claimed?: number
    claim_count_this_week?: number
}

// Trigger Event (environmental)
export interface TriggerEvent {
    id: number
    trigger_type: "rain" | "heat" | "aqi" | "wind" | "flood" | "blackout"
    city: string
    measured_value: number          // mm/h, °C, AQI, km/h, meters
    threshold_value: number
    status: string
    created_at: string
}

// Claim with Fraud Scoring
export interface Claim {
    id: number
    claim_number: string
    user_id: number
    policy_id: number
    trigger_type: string
    severity_band: "partial" | "full"
    severity_multiplier: number     // 0.5 or 1.0
    trigger_measured_value: number
    amount: number
    status: "approved" | "flagged" | "rejected" | "paid"
    fraud_score: number             // 0-100
    fraud_decision: "approved" | "flagged" | "rejected"
    created_at: string
    settled_at?: string
}

// Fraud Audit Trail (5 layers shown to user)
export interface FraudLayer {
    layer: number                   // 1-5
    name: string                    // "Duplicate Check", "Policy Age", etc.
    score: number                   // Points added by this layer
    status: "passed" | "warning" | "failed"
    reason: string
}

export interface FraudAudit {
    claim_id: number
    fraud_score: number
    decision: "approved" | "flagged" | "rejected"
    layers: FraudLayer[]
}

// Payout Settlement
export interface PayoutResponse {
    payout_id: number
    claim_id: number
    amount: number
    status: "pending" | "processing" | "settled" | "failed"
    settlement_method: string
    created_at: string
    settled_at?: string
}

// Admin Analytics Dashboard
export interface FinancialMetrics {
    loss_ratio: number              // Payouts / Premiums (target: 72%)
    combined_ratio: number          // loss_ratio + 25% (must be < 100%)
    gwp_this_week: number           // Gross written premium
    payouts_this_week: number
    retention_rate: number
}

export interface OperationalMetrics {
    active_policies: number
    claims_today: number
    auto_approved_today: number
    auto_flagged_today: number
    auto_rejected_today: number
    approval_rate: number           // % approved
}

export interface AdminDashboardResponse {
    financial_metrics: FinancialMetrics
    operational_metrics: OperationalMetrics
    geographic_analysis: {
        loss_ratio_by_city: Record<string, number>
        fraud_rate_by_zone: Record<string, number>
    }
    risk_analysis: {
        top_10_highest_risk_users: Array<{
            user_id: number
            name: string
            fraud_flags: number
            all_time_claims: number
            risk_score: number
        }>
        blacklisted_users_count: number
        fraud_alert_count: number
    }
}
