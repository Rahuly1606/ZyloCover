# 🛵 ZyloCover — Parametric Income Insurance for India's Gig Workers

> **"Jab rasta ruka, ZyloCover ne diya sahara."**
> *(When the road stopped, ZyloCover was there.)*

ZyloCover is an **AI-powered parametric insurance platform** that protects Hyderabad's food and grocery delivery partners against loss of income caused by external disruptions — automatically, without claims forms, without phone calls, and within **seconds of a trigger event**.

**No forms. No waiting. Zero-touch automation.**

---

## 📊 Table of Contents

1. [What's the Problem?](#problem)
2. [How ZyloCover Works](#how-it-works)
3. [Insurance Calculation Formula](#insurance-formula)
4. [System Architecture](#architecture)
5. [Parametric Triggers](#triggers)
6. [Zone Risk Mapping](#zones)
7. [Fraud Detection](#fraud)
8. [Quick Start Guide](#quick-start)
9. [API Documentation](#api)
10. [Demo Credentials](#demo)

---

## 🎯 Problem

India's **15–20 million gig workers** operate day-to-day without a financial safety net. Research shows they lose **20–30% of monthly income** from uncontrollable external disruptions:

- 🌧️ **Monsoon rain** → Can't deliver food
- 😷 **Hazardous AQI** → Health risk, no income
- 🔥 **Extreme heat** → Physical exhaustion, no work
- 🚫 **Sudden curfew** → Forced lockdown
- ⛈️ **Flash floods** → Complete shutdown

**Why Traditional Insurance Fails:**
- ❌ Complex claim forms (takes 2-3 weeks to verify)
- ❌ Worker already lost income before claim pays out
- ❌ Subjective verification (did they "really" lose income?)
- ❌ Designed for B2B, not gig workers
- ❌ No smartphone accessibility

---

## <a name="how-it-works"></a>💡 How ZyloCover Works

### The Zero-Touch Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ENVIRONMENTAL MONITORING (Every 5 minutes)               │
│    ├─ Weather data (rain, temperature, wind)                │
│    ├─ Air Quality Index (AQI)                               │
│    └─ Geographic zone detection                             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. TRIGGER EVALUATION                                       │
│    ├─ Check against thresholds (e.g., rain > 50mm)         │
│    ├─ Calculate payout multiplier (graduated)              │
│    └─ Apply zone-specific risk factors                      │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. FRAUD VALIDATION (Automated)                             │
│    ├─ Check worker GPS trace (past 2 hours)                │
│    ├─ Verify platform activity (GPS + app logs)            │
│    ├─ Run Isolation Forest anomaly detection               │
│    └─ Flag suspicious patterns                             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. AUTOMATED CLAIM GENERATION                               │
│    ├─ Create claim record in database                      │
│    ├─ Calculate payout amount                              │
│    └─ Assign fraud risk score                              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. INSTANT PAYOUT (Via Razorpay/UPI)                        │
│    ├─ Transfer to worker's bank account                    │
│    ├─ Send SMS confirmation                                │
│    └─ Update claim status to "PAID"                        │
└─────────────────────────────────────────────────────────────┘

⏱️ TOTAL TIME: 30-120 seconds (No waiting, No forms)
```

---

## <a name="insurance-formula"></a>🔢 Insurance Calculation (Actuarial Pure Premium Method)

ZyloCover uses **real insurance principles**, not random formulas.

### The Formula

```
STEP 1: Base Loss Frequency
└─ P(income loss event) per week by zone
   zone_a_flood_prone:  28%/week
   zone_b_high_traffic: 18%/week
   zone_c_industrial:   22%/week
   zone_d_residential:  12%/week
   zone_e_outer_ring:   15%/week

STEP 2: Environmental Loading (Forecast-based)
├─ Rain forecast (next 7 days):  0% to +35% multiplier
├─ AQI forecast:                 0% to +20% multiplier
├─ Heat forecast:                0% to +15% multiplier
└─ Wind forecast:                0% to +30% multiplier

STEP 3: Adjusted Frequency
└─ Base × (1 + environmental loading)
   Capped at 65% to avoid extreme cases

STEP 4: Expected Loss Cost (Pure Premium)
└─ days_lost × daily_income × platform_risk_factor
   
   Platform Risk Factors:
   ├─ Zomato/Swiggy:  1.05x (more outdoor exposure)
   ├─ Blinkit/Zepto:  0.95x (shorter routes)
   └─ Amazon/Flipkart: 0.90x (vehicle-based)

STEP 5: Load Premium (Business Costs)
└─ Pure Premium / (1 - expense_ratio - profit - reinsurance)
   ├─ Operating expense ratio: 20%
   ├─ Profit loading: 5%
   ├─ Reinsurance/Catastrophe buffer: 10%
   └─ Divisor = 0.65

STEP 6: Adjustments
├─ Experience credit (months worked):
│  ├─ < 6 months:   1.0x (no discount)
│  ├─ 6-24 months:  0.95x (-5%)
│  ├─ 24-60 months: 0.90x (-10%)
│  └─ 60+ months:   0.85x (-15%)
│
├─ Frequency surcharge (past 12-month claims):
│  ├─ 0 claims:      +0%
│  ├─ 1 claim:       +10%
│  ├─ 2 claims:      +20%
│  └─ 3+ claims:     up to +50%
│
└─ Fraud penalty:
   └─ +15% per fraud flag detected

STEP 7: GST & Final Bounds
├─ Premium (before GST): loaded_premium from Step 6
├─ Add 18% GST (per India insurance law)
├─ Bound to [₹49 min, ₹299 max]
└─ Final weekly premium

RESULT: Transparent breakdown showing:
├─ Base loss frequency
├─ Environmental loading
├─ Experience credit applied
├─ Fraud penalty (if any)
├─ GST amount
└─ Final weekly premium
```

### Example Calculation

**Worker: Ravi Kumar**
- Zone: zone_a_flood_prone (28% base frequency)
- Platform: Zomato (1.05x risk)
- Daily income: ₹800
- Experience: 14 months (+0.95x credit)
- 7-day rain forecast: 65mm (+25% loading)
- Platform factor: 1.05x
- Claims in past year: 0 (+0% surcharge)

```
Expected Loss = 0.28 × (1 + 0.25) × 1.8 days × 800 × 1.05
             = 0.28 × 1.25 × 1.8 × 800 × 1.05
             = ₹529.44

Loaded Premium = ₹529.44 / 0.65
              = ₹814.53

After experience credit = ₹814.53 × 0.95
                        = ₹773.81

After GST (18%) = ₹773.81 × 1.18
               = ₹813.90

Final Weekly Premium: **₹813.90** (bounded to max ₹299)
                    = **₹299.00** (practical limit)
```

---

## <a name="triggers"></a>🚨 Parametric Triggers (Weather-Based Payouts)

ZyloCover monitors **6 parametric triggers**. When a threshold is breached, the system **automatically generates a claim with a graduated payout multiplier**.

| Trigger | Threshold | Multiplier Range | Use Case |
|---------|-----------|------------------|----------|
| **Heavy Rain** | > 50mm (24h forecast) | 1.0x → 1.5x | Bike slips, visibility hazard |
| **Extreme Heat** | > 42°C | 1.0x → 1.5x | Heat exhaustion, low orders |
| **High AQI** | > 300 (Hazardous) | 1.0x → 1.5x | Respiratory risk, activity ban |
| **Strong Winds** | > 60 km/h | 1.0x → 1.5x | Bike control hazard |
| **Flash Flood** | > 50mm + flood warning | 1.5x (max) | Complete work stoppage |
| **Curfew** | Admin-declared | 1.5x (max) | Forced lockdown |

### Graduated Payout Logic

Payout is **NOT binary**. It's graduated based on severity:

```
Heavy Rain 50mm  → 1.00x multiplier (just over threshold)
Heavy Rain 65mm  → 1.17x multiplier (moderate severity)
Heavy Rain 80mm  → 1.33x multiplier (high severity)
Heavy Rain 100mm → 1.50x multiplier (max: extreme severity)
```

**Payout Calculation:**
```
Payout = hours_lost × hourly_income × payout_multiplier

Example:
Worker lost 4 hours to heavy rain (65mm)
Hourly income: ₹115 (₹920/8 hours)
Multiplier: 1.17x

Payout = 4 × 115 × 1.17 = ₹538.20
```

---

## <a name="zones"></a>🗺️ Zone Risk Mapping (Hyderabad)

ZyloCover divides Hyderabad into **5 hyper-local risk zones** based on flood history, air quality, and platform density.

| Zone | Areas | Primary Hazard | Base Loss Frequency | Platform Density |
|------|-------|----------------|-------------------|------------------|
| **Zone A (Flood-Prone)** | Malkajgiri, LB Nagar, Badangpet | Heavy Rain | **28%/week** | Medium |
| **Zone B (High Traffic)** | Hitech City, Gachibowli, Kondapur | AQI/Traffic | **18%/week** | High |
| **Zone C (Industrial)** | Patancheru, Balanagar, Jeedimetla | AQI/Pollution | **22%/week** | Medium |
| **Zone D (Residential)** | Jubilee Hills, Banjara Hills, Koramangala | Heat | **12%/week** | High |
| **Zone E (Outer Ring)** | Shamshabad, Chevella, Rajendranagar | Winds/Monsoon | **15%/week** | Low |

**Loss frequency** = empirical probability a worker loses income in that zone during a given week due to environmental disruptions.

---

## <a name="fraud"></a>🕵️ Fraud Detection (Hybrid Rule + AI)

ZyloCover uses a **two-layer fraud detection system** to prevent false claims.

### Layer 1: Rule-Based Checks

```
✓ GPS Verification
  ├─ Past 2-hour GPS trace shows worker active in their zone
  ├─ Speed/location consistent with delivery pattern
  └─ ❌ Reject if: GPS shows stationary or outside zone

✓ Platform Activity
  ├─ App logs show active delivery attempts during trigger hour
  ├─ Order acceptance/rejection pattern normal
  └─ ❌ Reject if: No platform activity during trigger window

✓ Frequency Check
  ├─ Claims per month < threshold for zone
  └─ ❌ Reject if: Worker averaging 3+ claims/week (anomaly)

✓ Time-of-Day Check
  ├─ Claim time matches worker's typical work hours
  └─ ❌ Reject if: Claim at 3 AM (outside known work pattern)
```

### Layer 2: Machine Learning (Isolation Forest)

```
Features:
├─ Payout amount vs. historical average
├─ Hours lost (realistic vs. max hours)
├─ Claim frequency trend
├─ Zone-specific baseline comparison
├─ Time-of-year seasonality
├─ Device/app version consistency
└─ Payment method history

Model: Isolation Forest (unsupervised anomaly detection)
├─ Detects multivariate outliers
├─ No need for labeled fraud examples
└─ Scores 0.0 (normal) to 1.0 (highly anomalous)

Decision:
├─ Score < 0.3  → AUTO-APPROVED (claim + payout instant)
├─ 0.3-0.6      → SOFT REVIEW (payout pending, claim flagged)
└─ > 0.6        → REJECT (manual investigation required)
```

### Fraud Flag Examples

```
🚩 RED FLAG 1: Claim 4 times in 10 days (zone average: 1x/month)
🚩 RED FLAG 2: Claimed ₹5000 (3x normal income) in 2 hours
🚩 RED FLAG 3: Heavy rain in Zone D, but GPS shows in Zone B
🚩 RED FLAG 4: Claimed during known off-work hours (midnight)
🚩 RED FLAG 5: AQI trigger claimed, but user marked app as "break"
```

---

## <a name="architecture"></a>⚙️ System Architecture

### High-Level Flow

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND (React + TypeScript)                                │
│ ├─ Onboarding page (email/password signup)                  │
│ ├─ Dashboard (real-time stats from backend)                 │
│ ├─ Plans page (policy management)                           │
│ ├─ Claims page (claim history + fraud scores)               │
│ ├─ Monitor page (active environmental alerts)               │
│ └─ Admin page (system KPIs)                                 │
└────────────────────────┬─────────────────────────────────────┘
                         │ (HTTP + JWT)
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ BACKEND API (FastAPI)                                        │
│ ├─ /auth (signup, login)                                    │
│ ├─ /user (profile, statistics)                              │
│ ├─ /policy (create, getActive)                              │
│ ├─ /pricing (calculate premium)                             │
│ ├─ /claims (getAll, create)                                 │
│ ├─ /trigger (getActive environmental alerts)                │
│ └─ /admin (system dashboard)                                │
└────────────────────────┬─────────────────────────────────────┘
                         │ (ORM queries)
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC LAYER (Python Services)                       │
│ ├─ pricing_engine.py (actuarial formula)                    │
│ ├─ fraud_engine.py (Isolation Forest + rules)               │
│ ├─ claim_pipeline.py (automated claim generation)           │
│ └─ environmental.py (weather/AQI API calls)                 │
└────────────────────────┬─────────────────────────────────────┘
                         │ (Event-driven)
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ AUTOMATION ENGINE (APScheduler)                              │
│ ├─ Runs every 5 minutes                                     │
│ ├─ Queries weather/AQI APIs                                 │
│ ├─ Evaluates triggers globally                              │
│ ├─ Generates claims for all affected workers                │
│ └─ Runs fraud detection on each claim                       │
└────────────────────────┬─────────────────────────────────────┘
                         │ (DB operations)
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ DATABASE (MySQL + SQLAlchemy ORM)                            │
│ ├─ users (profiles)                                         │
│ ├─ policies (7-day contracts)                               │
│ ├─ trigger_events (weather alerts)                          │
│ ├─ claims (automatic records)                               │
│ └─ payouts (UPI transfers)                                  │
└──────────────────────────────────────────────────────────────┘
```

### Module Breakdown

| Module | File | Responsibility |
|--------|------|-----------------|
| **Auth** | `app/api/routes/auth.py` | JWT signup/login with bcrypt hashing |
| **User** | `app/api/routes/user.py` | Profile mgmt + aggregated statistics |
| **Policy** | `app/api/routes/policy.py` | 7-day policy CRUD operations |
| **Pricing** | `app/services/pricing_engine.py` | **Actuarial pure premium formula** |
| **Environmental** | `app/services/environmental.py` | Weather/AQI API integration + mocking |
| **Trigger Engine** | `app/engine/scheduler.py` | APScheduler background loop (every 5 min) |
| **Fraud Detection** | `app/services/fraud_engine.py` | Rule-based + Isolation Forest hybrid |
| **Claims Pipeline** | `app/services/claim_pipeline.py` | Automated claim generation for triggers |
| **Admin** | `app/api/routes/admin.py` | System-wide KPIs + loss ratio tracking |

---

## <a name="quick-start"></a>🚀 Quick Start Guide

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **MySQL 8.0+**
- **Git**

### Step 1: Clone & Setup Backend

```bash
git clone https://github.com/your-repo/zylocover.git
cd zylocover/Backend

# Create virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Create virtual environment (Mac/Linux)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment

Create `.env` file in `Backend/`:

```env
# Database
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/zylocover

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# API Limits
MIN_PREMIUM_INR=49
MAX_PREMIUM_INR=299

# Demo Mode
MOCK_MODE=false
```

### Step 3: Initialize Database

```bash
# The DB will auto-initialize on first run
# Tables and 4 demo users will be created

python -m uvicorn app.main:app --reload --port 8000
```

✅ Visit `http://localhost:8000/docs` to see Swagger UI

### Step 4: Setup Frontend

```bash
cd ../Frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

✅ Visit `http://localhost:5173/onboarding`

### Step 5: Test Login Flow

Use **demo credentials**:

```
Email:    ravi@demo.com
Password: Demo1234!
```

---

## <a name="api"></a>📚 API Documentation

### Authentication Endpoints

#### `POST /auth/signup`
**Register a new worker**

Request:
```json
{
  "email": "arjun@example.com",
  "password": "SecurePass123!",
  "name": "Arjun Singh",
  "phone": "9876543210",
  "platform": "swiggy",
  "work_zone": "zone_b_high_traffic",
  "avg_daily_income": 950.0,
  "avg_daily_hours": 10.0
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 2
}
```

#### `POST /auth/login`
**Login with email/password**

Request:
```json
{
  "email": "ravi@demo.com",
  "password": "Demo1234!"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1
}
```

### User Endpoints

#### `GET /user/profile`
**Get user profile**

Response:
```json
{
  "id": 1,
  "name": "Ravi Kumar",
  "email": "ravi@demo.com",
  "phone": "9876543210",
  "platform": "zomato",
  "work_zone": "zone_a_flood_prone",
  "avg_daily_income": 800.0,
  "avg_daily_hours": 8.0,
  "experience_months": 14,
  "is_active": true,
  "is_fraud_flagged": false,
  "created_at": "2026-04-04T11:40:39"
}
```

#### `GET /user/stats`
**Get aggregated statistics**

Response:
```json
{
  "user_id": 1,
  "active_policies": 1,
  "total_claims": 3,
  "total_payouts": 1245.50,
  "fraud_flags": 0,
  "last_claim_date": "2026-04-03T14:22:31"
}
```

### Policy Endpoints

#### `POST /policy/create`
**Create a new 7-day policy**

Request:
```json
{
  "weekly_premium": 299.0
}
```

Response:
```json
{
  "id": 5,
  "policy_number": "POL-A8F2K1X9",
  "user_id": 1,
  "weekly_premium": 299.0,
  "status": "active",
  "start_date": "2026-04-04T11:40:39",
  "end_date": "2026-04-11T11:40:39"
}
```

#### `GET /policy/active`
**Get active policies for user**

Response:
```json
[
  {
    "id": 5,
    "policy_number": "POL-A8F2K1X9",
    "user_id": 1,
    "weekly_premium": 299.0,
    "status": "active",
    "start_date": "2026-04-04T11:40:39",
    "end_date": "2026-04-11T11:40:39"
  }
]
```

### Pricing Endpoint

#### `POST /pricing/calculate`
**Calculate actuarial premium for current user**

Response:
```json
{
  "weekly_premium": 299.0,
  "base_premium": 200.0,
  "environmental_loading": 45.0,
  "experience_credit": -14.0,
  "fraud_penalty": 0.0,
  "gst": 54.0,
  "risk_score": 0.35,
  "risk_label": "high"
}
```

### Claims Endpoint

#### `GET /claims/`
**Get all claims for user**

Response:
```json
[
  {
    "id": 1,
    "claim_number": "CLM-2026-0001",
    "status": "approved",
    "hours_lost": 4.5,
    "gross_payout_inr": 540.0,
    "net_payout_inr": 486.0,
    "fraud_score": 0.12,
    "created_at": "2026-04-03T14:22:31"
  }
]
```

### Trigger Endpoint

#### `GET /trigger/active`
**Get active environmental triggers affecting user's zone**

Response:
```json
[
  {
    "id": 1,
    "trigger_type": "heavy_rain",
    "affected_zone": "zone_a_flood_prone",
    "measured_value": 65.5,
    "threshold_value": 50.0,
    "severity_pct": 31.0,
    "payout_multiplier": 1.25,
    "status": "active",
    "triggered_at": "2026-04-04T11:30:00"
  }
]
```

### Admin Endpoint

#### `GET /admin/dashboard`
**Get system-wide KPIs (admin only)**

Response:
```json
{
  "total_users": 4,
  "active_policies": 4,
  "total_payouts": 5240.0,
  "avg_claim_amount": 1310.0,
  "total_claims": 4,
  "claims_approved": 3,
  "claims_rejected": 1,
  "fraud_flags": 0
}
```

---

## <a name="demo"></a>👥 Demo Credentials

4 pre-seeded demo users with realistic profiles:

| Name | Email | Password | Platform | Zone |Daily Income | Experience |
|------|-------|----------|----------|------|-------------|------------|
| **Ravi Kumar** | ravi@demo.com | Demo1234! | Zomato | Flood-Prone | ₹800 | 14 months |
| **Priya Singh** | priya@demo.com | Demo1234! | Swiggy | High Traffic | ₹950 | 24 months |
| **Amit Patel** | amit@demo.com | Demo1234! | Blinkit | Residential | ₹600 | 6 months |
| **Sunita Devi** | sunita@demo.com | Demo1234! | Zepto | Industrial | ₹700 | 18 months |

**Recommended test user:** `ravi@demo.com` (balanced profile with good data)

---

## 📁 Project Structure

```
zylocover/
│
├── Backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/          # 7 API endpoint modules
│   │   │       ├── auth.py
│   │   │       ├── user.py
│   │   │       ├── policy.py
│   │   │       ├── pricing.py
│   │   │       ├── claims.py
│   │   │       ├── trigger.py
│   │   │       └── admin.py
│   │   ├── services/            # Business logic
│   │   │   ├── pricing_engine.py
│   │   │   ├── fraud_engine.py
│   │   │   ├── claim_pipeline.py
│   │   │   └── environmental.py
│   │   ├── models/              # ORM models
│   │   │   ├── user.py
│   │   │   ├── policy.py
│   │   │   ├── trigger.py
│   │   │   ├── claim.py
│   │   │   └── payout.py
│   │   ├── core/                # Security & config
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── session.py
│   │   │   └── init_db.py
│   │   ├── engine/
│   │   │   └── scheduler.py     # APScheduler automation loop
│   │   └── main.py              # FastAPI app entry
│   │
│   ├── seed_demo_data.py        # Create 4 demo users
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment config
│
├── Frontend/
│   ├── src/
│   │   ├── api/                 # 7 API client modules
│   │   │   ├── client.ts        # API client with JWT
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   ├── policies.ts
│   │   │   ├── claims.ts
│   │   │   ├── pricing.ts
│   │   │   ├── triggers.ts
│   │   │   └── admin.ts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # JWT state management
│   │   ├── hooks/
│   │   │   └── useApi.ts        # Generic data fetching hook
│   │   ├── pages/               # 6 pages (all real data)
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Plans.tsx
│   │   │   ├── Claims.tsx
│   │   │   ├── Monitor.tsx
│   │   │   └── Admin.tsx
│   │   ├── components/
│   │   │   └── ui/              # shadcn UI library
│   │   ├── types/
│   │   │   └── api.ts           # TypeScript interfaces
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md (this file)
```

---

## 🔧 Troubleshooting

### Backend won't start?

```bash
# Activate venv
venv\Scripts\activate

# Check Python version (needs 3.10+)
python --version

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check MySQL is running
mysql -u root -p

# Error: "No module named 'app'"?
cd Backend
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend won't start?

```bash
cd Frontend

# Check Node version (needs 18+)
node --version

# Clear cache & reinstall
rm -rf node_modules package-lock.json
npm install

# Start dev server
npm run dev
```

### API calls failing with 401?

```
❌ "Invalid token" error
→ Token likely expired or not stored correctly
→ Check localStorage in DevTools (Application tab)
→ Try logging out and logging back in
```

### 422 Unprocessable Entity on policy creation?

```
❌ "Validation error" on POST /policy/create
→ Missing required fields in Policy model
→ Restart backend (may need DB reset)
→ Ensure user profile has avg_daily_income & avg_daily_hours
```

---

## 📊 Key Features

✅ **Parametric Insurance** - Weather + AQI based payouts (not claim-based)
✅ **Zero-Touch Automation** - 30-120 second end-to-end claim→payout
✅ **Actuarial Pricing** - Real insurance formulas, not arbitrary
✅ **Fraud Detection** - Hybrid rule-based + ML (Isolation Forest)
✅ **Graduated Payouts** - Severity-based multipliers (not binary)
✅ **Zone-Based Risk** - 5 hyper-local Hyderabad zones
✅ **JWT Authentication** - Secure token-based auth
✅ **Real-Time Monitoring** - APScheduler background loop
✅ **Admin Dashboard** - System-wide KPIs + loss ratio tracking
✅ **Full TypeScript** - Complete type safety

---

## 🎯 System Specifications

| Aspect | Detail |
|--------|--------|
| **Frontend Framework** | React 18 + TypeScript |
| **Frontend Build** | Vite |
| **Backend Framework** | FastAPI |
| **Database** | MySQL 8.0+ with SQLAlchemy ORM |
| **Authentication** | JWT (python-jose) + bcrypt |
| **Automation** | APScheduler (runs every 5 min) |
| **ML Model** | Scikit-learn Isolation Forest |
| **API Client** | Fetch with error handling |
| **UI Components** | shadcn/ui + Tailwind CSS |
| **Animations** | Framer Motion |
| **Status** | **100% Complete - Production Ready** |

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review backend logs: `python -m uvicorn app.main:app --reload`
3. Check frontend console: Open DevTools → Console tab
4. Verify database connection: `mysql -u root -p`

---

## 📜 License

Proprietary. All rights reserved © 2026 ZyloCover Team.

---

**🚀 Ready to test?** Start with the [Quick Start Guide](#quick-start)!

Last Updated: April 4, 2026
