# 🛵 zylocover Backend API

> **FastAPI-powered parametric insurance engine for India's gig workers**.

Production-grade backend providing **real actuarial math**, **transparent fraud detection**, **automated claims processing**, and **live trigger monitoring**.

---

## 📋 What's Inside

### 🏗️ Architecture
- ✅ **FastAPI** web framework (async/await native)
- ✅ **SQLAlchemy ORM** with MySQL database
- ✅ **Pydantic** validation for all APIs
- ✅ **APScheduler** for 24/7 automation
- ✅ **JWT Authentication** with role-based access
- ✅ **Comprehensive Error Handling** with logging

### 💼 Business Logic (3 Modular Engines)
1. **Actuarial Engine** (app/engine/actuarial.py)
   - Pure premium calculation (P(trigger) × severity × income)
   - Gross premium loading (25% expenses + 8% profit)
   - Experience rating (no-claims discount, fraud surcharge)
   - Final premium bounds (₹15-₹120/week)

2. **Fraud Detection Engine** (app/engine/fraud.py)
   - 5-layer architecture (duplicate → policy age → GPS → frequency → anomaly)
   - 0-100 scoring system with decision matrix
   - Explainable audit trail per claim
   - 3-strike blacklisting for repeat offenders

3. **Payout Calculation Engine** (app/engine/payout.py)
   - Severity band determination (partial 0.5× / full 1.0×)
   - Payout formula (income × IRR × severity)
   - Enforced bounds (₹50 min, ₹1500 max per event, weekly cap)
   - UPI gateway simulation (97% success)

### 📡 7 API Modules
| Module | Endpoints | Purpose |
|--------|-----------|---------|
| **Auth** | POST /auth/register, POST /auth/login | User authentication |
| **User** | GET /user/profile, PUT /user/profile | Profile management + location |
| **Policy** | POST /policy/create, GET /policy/active, GET /policy/{id} | Policy lifecycle |
| **Pricing** | POST /pricing/calculate, GET /pricing/coverage-tiers | Actuarial pricing |
| **Claims** | GET /claims/, POST /claims/trigger/{id}/process, GET /claims/{id}/audit | Claims management |
| **Triggers** | GET /triggers/active, GET /triggers/by-type | Environmental monitoring |
| **Admin** | GET /admin/analytics, GET /admin/dashboard | KPI dashboard |

### 🤖 Automation (24/7 Running)
- **Every 5 min:** Trigger detection → Find affected users → Auto-process claims
- **Every 1 hour:** Calculate loss ratios, expire policies
- **Every 24 hours:** Generate actuarial reports

### 📊 7 Database Models
```
User (with risk scoring)
├─ all_time_claim_count (for experience rating)
├─ fraud_flag_count (strike tracking)
├─ is_blacklisted (3-strike enforcement)
├─ user_risk_score (0-100 actuarial score)
└─ last_gps_update (stale location detection)

Policy (with coverage tiers)
├─ coverage_tier (basic/standard/premium)
├─ income_replacement_ratio (60%/75%/90%)
├─ cooling_period_ends_at (2-hour gap)
└─ pricing_breakdown (JSON with all factors)

Claim (with severity tracking)
├─ severity_band (partial/full)
├─ severity_multiplier (0.5/1.0)
├─ trigger_measured_value (mm/hr, °C, AQI)
├─ fraud_score (0-100 with audit trail)
└─ fraud_decision (approved/flagged/rejected)

+ 4 more: TriggerEvent, Payout, FinancialMetric, Report
```

---

## 🚀 Quick Start

### Prerequisites
```bash
Python 3.10+
MySQL 8.0+
```

### Step 1: Setup Environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### Step 2: Configure `.env`
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/zylocover
SECRET_KEY=your-secret-key-change-in-prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DEBUG=false
```

### Step 3: Database Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE zylocover CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
alembic upgrade head

# Seed demo data
python seed_demo_data.py
```

### Step 4: Run Server
```bash
python -m uvicorn app.main:app --reload --port 8000
```

✅ Visit **http://localhost:8000/docs** for interactive Swagger UI

---

## 📂 Project Structure

```
Backend/
├── app/
│   ├── main.py                    # FastAPI app + lifecycle
│   │
│   ├── engine/                    # ⭐ Core Business Logic (3 engines)
│   │   ├── actuarial.py          # Premium calculation (pure → gross → experience → final)
│   │   ├── fraud.py              # 5-layer fraud detection (0-100 scoring)
│   │   ├── payout.py             # Payout with anti-gaming bounds
│   │   └── scheduler.py          # APScheduler (5/1/24 hour automation)
│   │
│   ├── api/
│   │   ├── schemas.py            # 30+ Pydantic models
│   │   └── routes/               # 7 API modules
│   │       ├── auth.py           # Register, login
│   │       ├── user.py           # Profile + location
│   │       ├── policy.py         # 7-day policy lifecycle
│   │       ├── pricing.py        # Actuarial premium calculation
│   │       ├── claims.py         # Claims + fraud audit
│   │       ├── trigger.py        # Environmental triggers
│   │       └── admin.py          # Real-time KPI dashboard
│   │
│   ├── models/                   # SQLAlchemy ORM (7 models)
│   │   ├── user.py              # User + risk scoring fields
│   │   ├── policy.py            # Policy + coverage tier + cooling period
│   │   ├── claim.py             # Claim + severity + fraud score
│   │   ├── trigger.py           # Environmental triggers
│   │   ├── payout.py            # Settlement records
│   │   ├── financial_metric.py   # Actuarial KPIs
│   │   └── report.py            # Daily summaries
│   │
│   └── core/
│       ├── config.py            # Settings
│       ├── security.py          # JWT, password hashing
│       └── database.py          # SQLAlchemy setup
│
├── alembic/                      # Database migrations
├── tests/                        # Unit + integration tests
├── seed_demo_data.py            # Pre-load 4 demo users
├── requirements.txt
├── alembic.ini
├── pytest.ini
├── .env
└── README.md                    # This file
```

---

## ⭐ Core Engines (3 Modular Systems)

### 1. Actuarial Engine

**Real insurance formulas** (not guessing).

```
Step 1: Pure Premium = P(trigger) × Expected Severity × Income × IRR
Step 2: Gross Premium = Pure ÷ 0.67   (25% expense + 8% profit)
Step 3: Experience Rating = (1.0 - no_claims_discount) + (fraud_flags × surcharge)
Step 4: Final Premium = bounded to [₹15, ₹120]
```

**Example:** Ravi in Mumbai
```
Pure Premium:  700 × 0.28 × 0.70 × 0.75 × 1.75 = ₹8.20
Gross Premium: 8.20 ÷ 0.67 = ₹12.24
Experience Mult: 1.0 (no claims, no fraud)
Final Premium: 12.24 × 1.0 = ₹12.24 ✅
```

---

### 2. Fraud Detection Engine

**5 independent layers** scoring 0-100.

| Layer | Check | Score | Reason |
|-------|-------|-------|--------|
| 1 | Duplicate Claim | +100 | Hard block same user+trigger in 24h |
| 2 | Policy Age | +50 | Adverse selection if < 1 hour |
| 3 | GPS Zone | +35 | City mismatch or > 15km away |
| 4 | Frequency | +40 | ≥ 5 claims/week = pattern abuse |
| 5 | Anomaly | +15-50 | Fraud flags, velocity, new account |

**Decision Matrix:**
- 0-39: ✅ APPROVED (auto-pay)
- 40-69: ⚠️ FLAGGED (admin review)
- 70+: ❌ REJECTED (fraud flag +1)

**Blacklisting:** 3 flags → blacklisted (all claims rejected)

---

### 3. Payout Calculation Engine

**Payouts with anti-gaming bounds**.

```
Severity Band: PARTIAL (50%) or FULL (100%)
Base Payout: income × income_replacement_ratio × severity_multiplier
Bounds:
  - Min: ₹50
  - Max per event: ₹1,500
  - Max per week: Policy tier specific (₹2,625 for Standard)
```

**Example:** Ravi in heavy rain (68mm/h = FULL severity)
```
Base: 700 × 0.75 × 1.0 = ₹525
Check bounds: ₹50 ≤ 525 ≤ ₹1500 ✅
Weekly cap: 525 ≤ 2625 ✅
Final Payout: ₹525 → UPI (97% success)
```

---

### 4. Scheduler (24/7 Automation)

**Every 5 minutes:** Detect triggers → Find affected users → Auto-process claims
**Every 1 hour:** Calculate loss ratios, expire policies
**Every 24 hours:** Generate actuarial reports

---

## 🔌 10+ API Endpoints

### Auth
- `POST /auth/signup` - Register
- `POST /auth/login` - Login

### User
- `GET /user/profile` - Get profile (with location)
- `PUT /user/profile` - Update profile (with location)

### Policy
- `POST /policy/create` - Create 7-day policy
- `GET /policy/active` - Get active policies  
- `GET /policy/{id}` - Get policy details

### Pricing
- `POST /pricing/calculate` - Get premium with breakdown
- `GET /pricing/coverage-tiers` - Tier options

### Claims
- `GET /claims/` - Claims history
- `GET /claims/{id}/audit` - Fraud audit trail
- `POST /claims/trigger/{id}/process` - Manual processing

### Triggers
- `GET /triggers/active` - Active environmental triggers

### Admin
- `GET /admin/analytics` - Real-time KPI dashboard
- `GET /admin/dashboard` - Legacy dashboard

**Full API Docs:** http://localhost:8000/docs ↗

---

## 📊 Demo Data (4 Pre-Seeded Users)

```bash
python seed_demo_data.py  # Loads users with realistic policies & claims
```

| Name | Email | Status | Platform | Risk Score |
|------|-------|--------|----------|------------|
| Ravi Kumar | ravi@demo.com | Active | Swiggy | 35 (Low) |
| Priya Singh | priya@demo.com | Good | Zomato | 55 (Medium) |
| Arjun Patel | arjun@demo.com | Active | Uber | 42 (Low-Med) |
| Meera Sharma | meera@demo.com | Good | Swiggy | 28 (Low) |

---

## 🧪 Testing

```bash
# Run all tests
pytest

# Run specific module
pytest tests/test_core.py -v

# Coverage report
pytest --cov=app
```

---

## 🔐 Security

- ✅ JWT authentication (HS256)
- ✅ Password hashing (bcrypt)
- ✅ CORS middleware
- ✅ Role-based access (user vs admin)
- ✅ Blacklist enforcement

---

## 📈 Key Metrics (Admin Dashboard)

```
Loss Ratio:     72% ✅ (Target: 70-75%)
Combined Ratio: 97% ✅ (Must be < 100%)
Active Policies: 1,250
Claims Today:   127  (118 approved, 7 flagged, 2 rejected)
Fraud Rate:     2%   (Excellent)
Top Risk User:  Risk Score 92 (Monitored)
```

---

## 📞 Support

- **API Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Issues:** Create GitHub issue or email support@zylocover.in

---

**Built with FastAPI, SQLAlchemy, and CA-level actuarial rigor.** ✨
  "gross_payout_inr": 540.0,
  "fraud_score": 0.12,
  "created_at": "2026-04-03T14:22:31"
}]
```

**`GET /trigger/active`** - Get active environmental triggers
```json
Response:
[{
  "trigger_type": "heavy_rain",
  "affected_zone": "zone_a_flood_prone",
  "measured_value": 65.5,
  "payout_multiplier": 1.25,
  "status": "active"
}]
```

### Admin Dashboard

**`GET /admin/dashboard`** - System KPIs (admin only)
```json
Response:
{
  "total_users": 4,
  "active_policies": 4,
  "total_payouts": 5240.0,
  "total_claims": 4,
  "claims_approved": 3,
  "fraud_flags": 0
}
```

---

## 🔐 Demo Credentials

4 pre-seeded users with realistic profiles:

| Name | Email | Password | Platform | Zone | Income |
|------|-------|----------|----------|------|--------|
| Ravi Kumar | ravi@demo.com | Demo1234! | Zomato | Flood-Prone | ₹800/day |
| Priya Singh | priya@demo.com | Demo1234! | Swiggy | High Traffic | ₹950/day |
| Amit Patel | amit@demo.com | Demo1234! | Blinkit | Residential | ₹600/day |
| Sunita Devi | sunita@demo.com | Demo1234! | Zepto | Industrial | ₹700/day |

---

## 🧠 Core Business Logic

### Actuarial Pricing Formula
See [../README.md#insurance-formula](../README.md#insurance-formula) for complete breakdown

### Fraud Detection
See [../README.md#fraud](../README.md#fraud) for hybrid rule + ML approach

### Zone Risk Mapping
See [../README.md#zones](../README.md#zones) for all 5 Hyderabad zones

### Parametric Triggers
See [../README.md#triggers](../README.md#triggers) for all 6 trigger types

---

## 🔧 Troubleshooting

**MySQL connection error?**
```bash
# Verify MySQL is running
mysql -u root -p

# Check DATABASE_URL in .env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/zylocover
```

**Port 8000 already in use?**
```bash
python -m uvicorn app.main:app --reload --port 8001
```

**Module import errors?**
```bash
# Ensure you're in the virtual environment
venv\Scripts\activate
pip install -r requirements.txt
```

**Database needs reset?**
```bash
# Tables auto-initialize on first run
# If needed, drop and recreate:
mysql -u root -p
DROP DATABASE zylocover;
# Then restart backend to auto-initialize
```

---

## 🎯 Key Features

✅ **Pure Premium Actuarial Pricing** - Not arbitrary
✅ **Graduated Payout Multipliers** - Not binary on/off
✅ **Hybrid Fraud Detection** - Rules + Isolation Forest ML
✅ **Zero-Touch Automation** - APScheduler every 5 minutes
✅ **Real-Time Monitoring** - Active trigger tracking
✅ **Zone-Based Risk** - 5 hyper-local Hyderabad zones
✅ **Demo Data Pre-Loaded** - 4 workers with realistic profiles
✅ **Production Ready** - JWT, bcrypt, transactions, error logging

---

## 📊 Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | FastAPI |
| Database | MySQL 8.0+ |
| ORM | SQLAlchemy |
| Auth | JWT (python-jose) + bcrypt |
| Task Scheduling | APScheduler |
| ML | Scikit-learn (Isolation Forest) |
| Validation | Pydantic v2 |

---

**For complete documentation, see [../README.md](../README.md)**

**API Docs:** http://localhost:8000/docs (when running)

