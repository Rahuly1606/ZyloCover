"""
RaahPay — AI-Powered Parametric Income Insurance for Gig Workers
FastAPI application entry point - Production Ready (Render Compatible)
"""

import sys
import os
from pathlib import Path
import logging
import time
import asyncio
from contextlib import asynccontextmanager
import datetime
from dotenv import load_dotenv

# ── Load environment variables ─────────────────────────────────────────────
# Always resolve .env relative to Backend directory so startup works from any cwd.
backend_root = Path(__file__).resolve().parents[1]
load_dotenv(backend_root / ".env")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Fix import path ────────────────────────────────────────────────────────
current_dir = Path(__file__).parent.parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

# ── Internal imports ──────────────────────────────────────────────────────
from app.api.routes import auth, user, policy, pricing, trigger, claims, admin, payout
from app.api.routes.admin_extended import router as admin_extended_router
from app.api.routes.admin_approval import router as admin_approval_router
from app.engine.scheduler import automation_engine
from app.db.init_db import init_db

# ── Import AI Service ─────────────────────────────────────────────────────
from app.ai.service import app as ai_app

# ── Logging ───────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s - %(message)s"
)
logger = logging.getLogger("raahpay")

# ── Global state ──────────────────────────────────────────────────────────
startup_complete = False


# ── Lifespan (non-blocking startup) ───────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global startup_complete

    logger.info("🚀 RaahPay starting up...")

    async def background_init():
        global startup_complete
        try:
            logger.info("Initializing database...")
            init_db()
            logger.info("✅ Database initialized")

            logger.info("Starting automation engine...")
            automation_engine.start()
            logger.info("✅ Automation engine started")

        except Exception as e:
            logger.error(f"Startup error: {e}", exc_info=True)
        finally:
            startup_complete = True

    task = asyncio.create_task(background_init())

    yield

    # Shutdown
    try:
        automation_engine.shutdown()
        logger.info("👋 Shutdown complete")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


# ── FastAPI app ───────────────────────────────────────────────────────────
app = FastAPI(
    title="RaahPay API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────
# CRITICAL: Configure CORS for production deployment
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "https://zylo-cover.vercel.app")

logger.info(f"CORS Configuration: {allowed_origins_str}")

# Parse origins
if allowed_origins_str == "*":
    logger.warning("⚠️ CORS: Allowing ALL origins (credentials disabled)")
    allowed_origins = ["*"]
    allow_credentials = False
else:
    allowed_origins = [url.strip() for url in allowed_origins_str.split(",")]
    allow_credentials = True
    logger.info(f"CORS: Specific origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Middleware ────────────────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.time() - start)*1000:.1f}ms"
    return response


# ── Exception handler ─────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    is_dev = os.getenv("ENV", "development").lower() == "development"
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "Something went wrong",
            **({"exception_type": type(exc).__name__, "detail": str(exc)} if is_dev else {})
        }
    )


# ── Routes ────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(policy.router)
app.include_router(pricing.router)
app.include_router(trigger.router)
app.include_router(claims.router)
app.include_router(payout.router)
app.include_router(admin.router)
app.include_router(admin_extended_router)
app.include_router(admin_approval_router)

# ── Mount AI Service as Sub-Application ──────────────────────────────────
app.mount("/ai", ai_app)


# ── Health endpoints (Render-safe) ────────────────────────────────────────
@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "service": "RaahPay",
        "status": "operational",
        "version": "2.0.0",
    }


@app.get("/health")
async def health():
    """Comprehensive health check including AI service."""
    ai_status = "unknown"
    try:
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get("http://localhost:8000/ai/health")
            ai_status = "healthy" if resp.status_code == 200 else "unhealthy"
    except:
        ai_status = "unavailable"
    
    return {
        "status": "healthy",
        "startup_complete": startup_complete,
        "ai_service": ai_status,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }


@app.get("/ready")
async def ready():
    if not startup_complete:
        return JSONResponse(
            status_code=503,
            content={"status": "initializing"}
        )
    return {"status": "ready"}


# ── Local development only ────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
