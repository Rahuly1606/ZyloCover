#!/bin/bash
# ══════════════════════════════════════════════════
# RaahPay Local Setup Script
# Usage: bash setup.sh
# ══════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ██████╗  █████╗  █████╗ ██╗  ██╗██████╗  █████╗ ██╗   ██╗"
echo "  ██╔══██╗██╔══██╗██╔══██╗██║  ██║██╔══██╗██╔══██╗╚██╗ ██╔╝"
echo "  ██████╔╝███████║███████║███████║██████╔╝███████║ ╚████╔╝ "
echo "  ██╔══██╗██╔══██║██╔══██║██╔══██║██╔═══╝ ██╔══██║  ╚██╔╝  "
echo "  ██║  ██║██║  ██║██║  ██║██║  ██║██║     ██║  ██║   ██║   "
echo "  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝   "
echo -e "${NC}"
echo -e "${GREEN}Parametric Income Insurance for India's Gig Workers${NC}"
echo "=================================================="
echo ""

# ── 1. Check Python ───────────────────────────────────────────────
echo -e "${YELLOW}[1/7] Checking Python version...${NC}"
python3 --version || { echo -e "${RED}Python 3 not found. Install Python 3.11+${NC}"; exit 1; }

# ── 2. Check MySQL ────────────────────────────────────────────────
echo -e "${YELLOW}[2/7] Checking MySQL connection...${NC}"
mysql -u root -p 2>/dev/null || echo -e "${YELLOW}  ⚠️  MySQL not found in PATH. Ensure it's installed.${NC}"

# ── 3. Virtual environment ─────────────────────────────────────────
echo -e "${YELLOW}[3/7] Creating virtual environment...${NC}"
python3 -m venv venv

# Detect OS for activation
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo -e "${GREEN}  ✅ Virtual environment created${NC}"

# ── 4. Install dependencies ───────────────────────────────────────
echo -e "${YELLOW}[4/7] Installing dependencies...${NC}"
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo -e "${GREEN}  ✅ Dependencies installed${NC}"

# ── 5. Environment file ───────────────────────────────────────────
echo -e "${YELLOW}[5/7] Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}  ✅ .env created${NC}"
    echo -e "${YELLOW}  ⚠️  IMPORTANT: Edit .env with your MySQL credentials${NC}"
    echo -e "${YELLOW}  Example: DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/raahpay${NC}"
else
    echo -e "${GREEN}  ✅ .env already exists${NC}"
fi

# ── 6. Initialize database ────────────────────────────────────────
echo -e "${YELLOW}[6/7] Initializing database...${NC}"
python3 -c "from app.db.init_db import init_db; init_db()" && echo -e "${GREEN}  ✅ Tables created${NC}" || echo -e "${YELLOW}  ⚠️  Database initialization skipped${NC}"

# ── 7. Seed demo data ────────────────────────────────────────────
echo -e "${YELLOW}[7/7] Seeding demo data...${NC}"
python3 -m seed_demo_data && echo -e "${GREEN}  ✅ Demo data seeded${NC}" || echo -e "${YELLOW}  ⚠️  Demo data seed skipped${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 RaahPay is ready to launch!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "  Start server:  ${CYAN}uvicorn app.main:app --reload --port 8000${NC}"
echo -e "  API Docs:      ${CYAN}http://localhost:8000/docs${NC}"
echo -e "  Health check:  ${CYAN}http://localhost:8000/health${NC}"
echo ""
echo -e "  Demo logins:"
echo -e "    ${CYAN}ravi@demo.com / Demo1234!${NC}"
echo -e "    ${CYAN}priya@demo.com / Demo1234!${NC}"
echo -e "    ${CYAN}amit@demo.com / Demo1234!${NC}"
echo ""
echo -e "  Admin key:     ${CYAN}raahpay-admin-2026${NC}"
echo ""