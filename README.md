<div align="center">

# ParametricGuard
**AI-Powered Parametric Insurance & "Gig-OS" for Delivery Workers**

![Status](https://img.shields.io/badge/Status-Hackathon_Ready-success?style=for-the-badge) ![Guidewire DEVTrails](https://img.shields.io/badge/Guidewire-DEVTrails_2026-blue?style=for-the-badge) ![Focus](https://img.shields.io/badge/Focus-Parametric_Insurance-orange?style=for-the-badge)

*Protecting the gig workforce with zero-touch, instant income protection driven by objective data telemetry.*

</div>

---

## Team: ImpactForge
| Name | Role |
| :--- | :--- |
| **Rahul Kumar** | Team Leader |
| **Munna Kumar** | Member |
| **V Rishitha Reddy** | Member |
| **Durgesh Kumar chaudhari**| Member |

---

## 1. Problem Overview
India’s platform-based delivery ecosystem involves **15–20+ million gig workers** who operate on day-to-day wages without a financial safety net. Our research indicates these workers can lose up to **20–30% of their income** from uncontrollable micro-disruptions such as monsoon rains, hazardous pollution alerts, and sudden curfews.

**The Failure of Traditional Insurance:**
Traditional policies are ill-suited for this demographic. Gig workers lack the time or literacy to navigate complex claim filing procedures. They live week-to-week; by the time a traditional insurance claim is verified and a check arrives, the worker's family has already suffered from the immediate income wipeout. 

## 2. Persona Definition
**Primary Persona: Urban Food Delivery Partner**
*Example: Ankit, a 23-year-old delivery rider in Bangalore.*

We chose this persona because they have high exposure to external elements and operate in dense urban areas where data collection (weather, AQI) is highly accurate.
* **Workstyle:** Works 6-7 days a week, relies exclusively on an Android smartphone.
* **Platform Hopping:** Rapidly switches between Swiggy, Zomato, and Dunzo to maximize orders.
* **Financial Position:** Earns <₹15,000/month. A single lost day (₹400–500) represents an immediate threat to rent and grocery stability.

---

## 3. Proposed Solution: ParametricGuard
ParametricGuard is an interconnected app and backend platform that offers **weekly parametric micro-insurance** against income loss, coupled with daily utility tools.

Instead of paying out based on subjective claims and manual verification, ParametricGuard relies entirely on **independently verified third-party data**. If a trigger event occurs in the worker's GPS-verified zone, the system automatically compensates their lost income within hours. No forms, no wait times.

### The "Gig-OS" Differentiator (Daily Utility)
Insurance apps are rarely opened unless there is an emergency. To drive daily engagement, ParametricGuard operates as a **Gig-OS**:
* Features a unified earnings dashboard that aggregates weekly payouts across platforms (Swiggy, Zomato).
* Uses historical data to push daily work suggestions (e.g., *"Zone A has high expected demand and only a 30% rain chance—safe to ride!"*).

---

## 4. End-to-End Automated Workflow
ParametricGuard is modeled to be zero-touch post-onboarding. 

1. **User Onboarding:** Rider downloads the app, inputs basic info (city, shift earnings), and verifies via OTP.
2. **AI Risk Profiling & Pricing:** An ML model calculates the upcoming week's premium by analyzing the rider's home zone (e.g., flood history) and the 7-day weather forecast.
3. **Weekly Activation:** Rider pays the micro-premium (via UPI QR/Razorpay) on Sunday night. The policy is instantly active for the week.
4. **Continuous Telemetry Polling:** A background event engine polls APIs (IMD/OpenWeatherMap/WAQI) constantly for real-time conditions in the worker's zone.
5. **Parametric Trigger Detection:** If an agreed-upon threshold is breached, the system raises an alert.
6. **Robust Fraud Validation (Automated):** System verifies the rider's operational GPS trace from the past 2 hours.
7. **Automated Claim & Instant Payout:** A logical claim record is created autonomously. Using Razorpay/UPI APIs, the payout is pushed immediately to the rider's bank account.
8. **Feedback Loop:** Rider receives an SMS: *"Your income is protected: ₹X credited."*

### ⚙️ Automation & AI Pipeline

ZyloCover (ParametricGuard) follows a fully event-driven automated pipeline, powered by specialized agents that constantly operate in the background:

1. **Data Ingestion Agent**  
   *Collects and normalized real-time weather, AQI, and structured external APIs (IMD/OpenWeatherMap/WAQI).*
   
2. **Risk Evaluation Agent**  
   *Evaluates incoming telemetry against the dynamic thresholds and the worker's geographical risk zone.*
   
3. **Decision Agent**  
   *Acts as a truth engine—it cross-references data to determine whether a qualified trigger event has officially occurred while parsing for any anomalies or simulated GPS spoofing.*
   
4. **Payout Execution Agent**  
   *Instantly initiates the automated logical claim and processes the payout directly into the rider's wallet or bank account.*

> *This autonomous pipeline ensures zero manual intervention, guaranteeing a virtually real-time proactive response to disruptions without human adjudication.*

---

## 5. Multi-Layer Fraud Detection & Prevention
**Core Philosophy:** Make fraud economically irrational. We assume bad actors will attempt GPS spoofing. Therefore, our validation utilizes a 4-layer verification stack:

* **Layer 1: GPS & Movement Consistency:** We log the rider's GPS path during shifts. If a payout triggers, the system ensures the rider was truly in the affected zone immediately *before* the event. Claims are flagged if the rider's GPS never left their registered home address or if their location jumps impossibly fast (e.g., 5km in 5 minutes).
* **Layer 2: Device & Network Telemetry:** The app captures device fingerprints (OS version, model) and network cell tower data. Two simultaneous claims from the same Device ID in different cities trigger immediate systemic lockdown of that account.
* **Layer 3: Temporal Machine Learning Models:** Using Unsupervised Anomaly Detection (Isolation Forest), the system learns normal claim timing patterns. If 10 riders submit identical claims at the exact same millisecond from adjacent zones, the model flags it as coordinated fraud.
* **Layer 4: Intelligent Soft Review:** High-confidence legitimate claims bypass all friction. Borderline flagged claims implement a "soft review" where the app asks a simple context question (*"Did it rain in your zone today? Y/N"*). This introduces enough friction to deter automated bot-nets without frustrating legitimate human users.

---

## 6. Financial & Actuarial Model

### The Sachet Pricing Model
Premiums operate on a weekly gig cycle. The baseline premium is **₹20/week**.
* **Dynamic Adjustments:** Safe zones receive a ₹2 discount; severe forecast warnings add ₹10.
* **Subsidies:** Using current Indian labor law mandates (platforms must contribute 1-2% of turnover to welfare), the ₹20 premium is split: 
  * Worker: ₹12
  * Platform (e.g., Swiggy CSR): ₹5
  * Govt e-Shram / NGO Subsidy: ₹3

### Payout Logic & Caps
To guarantee total platform solvency (preventing bank runs), payouts strictly adhere to:
* **Formula:** 50% replacement of the expected daily income for each day lost.
* **Maximum Cap:** Hard capped at ₹500 per week. 
* **Example:** Rider earns ₹400/day. Rain disrupts 2 days. System pays 50% × 2 days × ₹400 = ₹400.

### Fund Architecture
* **60% Claims Reserve:** Held explicitly for payouts (Maintains a secure 60:40 reserve-to-payout ratio).
* **25% Operations:** Servers, APIs, team scaling.
* **15% Investment:** Liquid instruments to grow the mutual pool.

---

## 7. Parametric Triggers Configuration

| Condition | Verified Threshold | Third-Party Source |
| :--- | :--- | :--- |
| **Heavy Rainfall** | Accumulated >50mm in 24 hours | IMD / OpenWeatherMap |
| **Hazardous AQI** | AQI > 400 for a sustained block | WAQI (CPCB Data) |
| **Extreme Heat** | Forecast Temp > 42°C for 2 consecutive days | IMD Forecasts |
| **Curfew / Strike** | Section 144 / Blockades | Google Maps Traffic / NDMA Bulletins |

---

## 8. User Trust & Retention Strategy
We combat historical insurance skepticism through extreme transparency:
* **Zero Paperwork:** Automation is our greatest trust-builder.
* **Radical Transparency:** The UI simply states: *"Rain >50mm → ₹200/day."* No hidden clauses.
* **No-Claim Bonus:** A loyalty program where 4 claim-free weeks earn the rider a ₹20 premium credit for the following week.
* **Social Proof & Identity:** Integration with the government's e-Shram registry via Aadhaar offers the platform institutional credibility. We also implement a P2P referral framework mimicking network-effect gig growth.

---

## 9. Technology Stack

* **Frontend:** React Native (Expo) for Android-first workers; React/Next.js for the administrative web dashboard.
* **Backend Microservices:** Node.js (NestJS / Express) containerized via Docker.
* **Database & Queues:** PostgreSQL (Relational policies/transactions) and Redis (BullMQ for background polling jobs).
* **AI / ML Layer:** Python/FastAPI endpoints utilizing `scikit-learn` and `XGBoost`. Hosted serverlessly via AWS Lambda.
* **Payments:** Razorpay API for premium collection and UPI automated disbursement (NPCI).
* **Notifications:** Twilio (SMS/WhatsApp) and Firebase Cloud Messaging for instant real-time payout alerts.
* **Enterprise Integration Path:** Production pipelines can wrap into **Guidewire PolicyCenter** and **ClaimCenter** APIs.

### AI / ML Specifics
We explicitly avoid vague AI claims. Our models run on 3 specific pipelines:
1. **Pricing (Supervised Learning - XGBoost):** Predicts weekly premium adjustments based on geolocation risk arrays and weather vectors.
2. **Fraud (Unsupervised Learning - Isolation Forest):** Flags spatio-temporal claim anomalies.
3. **Demand Forecasting (Time-Series):** Powering the Gig-OS safe-route advisor.

---

## 10. Scalability & Future State
The microservice, event-driven (BullMQ + Lambda) architecture natively supports horizontal scaling. Deployed via Kubernetes (EKS), ParametricGuard can handle spikes during massive weather events without throttling. 

Eventually, this architecture is designed to operate as a *Headless API*, allowing delivery giants (Zomato/Swiggy) to natively embed ParametricGuard inside their own delivery partner applications.