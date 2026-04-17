#!/usr/bin/env python3
"""
ZyloCover Unified Backend Startup
Runs both main backend and AI services in a single process
"""

import os
import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s - %(message)s"
)
logger = logging.getLogger("startup")

def main():
    """Start unified backend service."""
    
    # Ensure we're in the Backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Get port from environment or default
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info("=" * 60)
    logger.info("🚀 Starting ZyloCover Unified Backend")
    logger.info("=" * 60)
    logger.info(f"Host: {host}")
    logger.info(f"Port: {port}")
    logger.info(f"Environment: {os.getenv('ENV', 'development')}")
    logger.info("=" * 60)
    logger.info("")
    logger.info("Services included:")
    logger.info("  ✓ Main Backend API (FastAPI)")
    logger.info("  ✓ AI/ML Service (mounted at /ai)")
    logger.info("  ✓ Automation Engine (scheduler)")
    logger.info("  ✓ Database (MySQL)")
    logger.info("")
    logger.info("Endpoints:")
    logger.info(f"  • API Docs: http://{host}:{port}/docs")
    logger.info(f"  • Health Check: http://{host}:{port}/health")
    logger.info(f"  • AI Health: http://{host}:{port}/ai/health")
    logger.info("=" * 60)
    
    # Import and run uvicorn
    import uvicorn
    
    # Production settings
    if os.getenv("ENV", "development").lower() == "production":
        uvicorn.run(
            "app.main:app",
            host=host,
            port=port,
            workers=4,  # Multiple workers for production
            log_level="info",
            access_log=True,
        )
    else:
        # Development settings with hot reload
        uvicorn.run(
            "app.main:app",
            host=host,
            port=port,
            reload=True,
            log_level="debug",
        )

if __name__ == "__main__":
    main()
