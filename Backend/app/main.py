"""
RaahPay — AI-Powered Parametric Income Insurance for Gig Workers
================================================================
FastAPI application entry point.
"""

import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, user, policy, pricing, trigger, claims, admin, payout
from app.engine.scheduler import automation_engine
from app.db.init_db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s - %(message)s"
)
logger = logging.getLogger("raahpay")

app = FastAPI(
    title="RaahPay API",
    description="""
## RaahPay — Parametric Income Insurance for India's Gig Workforce

**Zero-touch, AI-powered insurance for delivery partners.**

### How it works:
1. Worker buys a **weekly policy** — premium calculated actuarially per zone/platform/risk
2. Environmental sensors + scheduler **continuously monitor** triggers (rain, AQI, heat)
3. When a threshold is breached, the **claim pipeline fires automatically**
4. **Fraud engine** validates (GPS, frequency, platform activity)
5. **Payout hits UPI** within seconds — no forms, no calls, no waiting

### Coverage: Loss of Income ONLY
Covers hours of work lost due to external disruptions — NOT health, accidents, or vehicle damage.

### Weekly Model:
All policies run for exactly 7 days. Premium and coverage reset each week.

### Demo Credentials:
- Email: ravi@demo.com | Password: Demo1234!
- Email: priya@demo.com | Password: Demo1234!
- Email: amit@demo.com | Password: Demo1234!
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request timing middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.time() - start)*1000:.1f}ms"
    return response


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "message": "Something went wrong. Our team has been notified."}
    )


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(policy.router)
app.include_router(pricing.router)
app.include_router(trigger.router)
app.include_router(claims.router)
app.include_router(payout.router)
app.include_router(admin.router)


# ── Lifecycle ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("🚀 RaahPay starting up...")
    try:
        init_db()
        automation_engine.start()
        logger.info("✅ RaahPay is live — automation engine running")
    except Exception as e:
        logger.warning(f"⚠️  Startup warning: {e}")


@app.on_event("shutdown")
async def shutdown():
    automation_engine.shutdown()
    logger.info("👋 RaahPay shutting down gracefully")


# ── Health & Root ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "service": "RaahPay",
        "tagline": "Parametric Income Insurance for India's Gig Workers",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs",
        "pipeline": "Auth → User → Policy → Pricing → Trigger → Fraud → Claim → Payout",
        "coverage": "Loss of Income ONLY — Hyderabad Gig Workers",
        "policy_model": "Weekly (7 days)",
    }


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "automation_engine": "running",
        "database": "connected",
        "timestamp": __import__('datetime').datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
