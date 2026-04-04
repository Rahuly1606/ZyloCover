"""
RaahPay — AI-Powered Parametric Income Insurance for Gig Workers
================================================================
FastAPI application entry point - Optimized for Render deployment
"""

import logging
import time
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import datetime

from app.api.routes import auth, user, policy, pricing, trigger, claims, admin, payout
from app.engine.scheduler import automation_engine
from app.db.init_db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s - %(message)s"
)
logger = logging.getLogger("raahpay")

# ── Global startup state ──────────────────────────────────────────────────
startup_complete = False
initialization_task = None


# ── Async lifespan for non-blocking startup ──────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan - non-blocking startup"""
    global startup_complete, initialization_task
    
    logger.info("🚀 RaahPay starting up...")
    
    # Background initialization (non-blocking)
    async def background_init():
        global startup_complete
        try:
            # Initialize database
            logger.info("Initializing database...")
            init_db()
            logger.info("✅ Database initialization complete")
            
            # Start scheduler
            logger.info("Starting automation engine...")
            automation_engine.start()
            logger.info("✅ RaahPay Automation Engine started")
            logger.info("✅ RaahPay is live — automation engine running")
            
        except Exception as e:
            logger.warning(f"⚠️  Startup warning: {e}")
        finally:
            startup_complete = True
    
    # Start background task
    initialization_task = asyncio.create_task(background_init())
    
    yield
    
    # Shutdown
    try:
        automation_engine.shutdown()
        logger.info("👋 RaahPay shutting down gracefully")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


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
- Email: demo@zylocover.com | Password: Demo1234!
- Email: priya@demo.zylocover.com | Password: Demo1234!
- Email: arjun@demo.zylocover.com | Password: Demo1234!
- Email: kavya@demo.zylocover.com | Password: Demo1234!
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request timing middleware ─────────────────────────────────────────────
@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.time() - start)*1000:.1f}ms"
    return response


# ── Global exception handler ──────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "message": "Something went wrong. Our team has been notified."}
    )


# ── Routers ───────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(policy.router)
app.include_router(pricing.router)
app.include_router(trigger.router)
app.include_router(claims.router)
app.include_router(payout.router)
app.include_router(admin.router)


# ── Health & Root ─────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """Root health check - returns immediately for Render health probe"""
    return {
        "service": "RaahPay",
        "status": "operational",
        "version": "2.0.0",
    }


@app.get("/health", tags=["Health"])
async def health():
    """Health check - returns startup progress"""
    return {
        "status": "healthy",
        "startup_complete": startup_complete,
        "automation_engine": "running" if startup_complete else "initializing",
        "database": "connected",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }


@app.get("/ready", tags=["Health"])
async def ready():
    """Readiness probe - returns 503 until fully initialized"""
    global startup_complete
    if not startup_complete:
        return JSONResponse(
            status_code=503,
            content={
                "status": "initializing",
                "message": "Application is starting up, please retry in a moment"
            }
        )
    return {
        "status": "ready",
        "service": "RaahPay",
        "version": "2.0.0",
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
