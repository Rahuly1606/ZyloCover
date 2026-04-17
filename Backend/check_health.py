#!/usr/bin/env python3
"""
ZyloCover Service Health Check
Verifies that all backend services are running correctly
"""

import httpx
import sys
import time
from typing import Dict, Tuple

# ANSI color codes
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

BASE_URL = "http://localhost:8000"
TIMEOUT = 5.0


def check_endpoint(url: str, name: str) -> Tuple[bool, str]:
    """Check if an endpoint is responding."""
    try:
        response = httpx.get(url, timeout=TIMEOUT)
        if response.status_code == 200:
            return True, f"{GREEN}✓{RESET} {name}: Healthy"
        else:
            return False, f"{RED}✗{RESET} {name}: HTTP {response.status_code}"
    except httpx.ConnectError:
        return False, f"{RED}✗{RESET} {name}: Connection refused"
    except httpx.TimeoutException:
        return False, f"{RED}✗{RESET} {name}: Timeout"
    except Exception as e:
        return False, f"{RED}✗{RESET} {name}: {str(e)}"


def check_ai_models() -> Tuple[bool, str]:
    """Check if AI models are loaded."""
    try:
        response = httpx.get(f"{BASE_URL}/ai/health", timeout=TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            models = data.get("models", {})
            return True, f"{GREEN}✓{RESET} AI Models: {len(models)} loaded"
        return False, f"{RED}✗{RESET} AI Models: Service unhealthy"
    except Exception as e:
        return False, f"{RED}✗{RESET} AI Models: {str(e)}"


def main():
    """Run comprehensive health checks."""
    print("\n" + "=" * 60)
    print(f"{BLUE}ZyloCover Service Health Check{RESET}")
    print("=" * 60 + "\n")
    
    checks = [
        (f"{BASE_URL}/", "Main Backend"),
        (f"{BASE_URL}/health", "Health Endpoint"),
        (f"{BASE_URL}/ready", "Readiness Check"),
        (f"{BASE_URL}/ai/health", "AI Service"),
        (f"{BASE_URL}/docs", "API Documentation"),
    ]
    
    results = []
    all_healthy = True
    
    print("Checking endpoints...\n")
    
    for url, name in checks:
        success, message = check_endpoint(url, name)
        results.append((success, message))
        print(f"  {message}")
        if not success:
            all_healthy = False
        time.sleep(0.1)  # Small delay between checks
    
    # Check AI models separately
    print()
    success, message = check_ai_models()
    results.append((success, message))
    print(f"  {message}")
    if not success:
        all_healthy = False
    
    # Summary
    print("\n" + "=" * 60)
    if all_healthy:
        print(f"{GREEN}✓ All services are healthy!{RESET}")
        print("=" * 60 + "\n")
        print("Available endpoints:")
        print(f"  • API Docs: {BASE_URL}/docs")
        print(f"  • Health: {BASE_URL}/health")
        print(f"  • AI Service: {BASE_URL}/ai/health")
        print()
        return 0
    else:
        print(f"{RED}✗ Some services are unhealthy{RESET}")
        print("=" * 60 + "\n")
        print("Troubleshooting:")
        print("  1. Ensure the backend is running: python start.py")
        print("  2. Check logs for errors")
        print("  3. Verify database connection")
        print("  4. Ensure AI models are trained: python train_all_models.py")
        print()
        return 1


if __name__ == "__main__":
    sys.exit(main())
