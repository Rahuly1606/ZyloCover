#!/bin/bash
# ══════════════════════════════════════════════════════════════════
# RaahPay MySQL Database Setup
# Run this BEFORE running setup.sh
# ══════════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗"
echo -e "║  RaahPay MySQL Database Setup                                      ║"
echo -e "╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Check MySQL ────────────────────────────────────────────────
echo -e "${YELLOW}[1/4] Checking MySQL server...${NC}"
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    echo -e "${GREEN}  ✅ MySQL found: $MYSQL_VERSION${NC}"
else
    echo -e "${RED}  ❌ MySQL not found!${NC}"
    echo -e "${YELLOW}  Install MySQL 8.0+ from: https://dev.mysql.com/downloads/mysql/${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[2/4] Enter MySQL root password:${NC}"
read -s ROOT_PASSWORD

# ── 2. Create Database ────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/4] Creating database 'raahpay'...${NC}"
mysql -u root -p"$ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS raahpay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✅ Database 'raahpay' created${NC}"
else
    echo -e "${RED}  ❌ Failed to create database${NC}"
    echo -e "${YELLOW}  Tip: Ensure MySQL is running and password is correct${NC}"
    exit 1
fi

# ── 3. Create User (Optional) ─────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/4] Create dedicated MySQL user? (y/n)${NC}"
read -p "  Choice: " CREATE_USER

if [[ $CREATE_USER == "y" || $CREATE_USER == "Y" ]]; then
    echo -e "${YELLOW}  Enter username for RaahPay:${NC}"
    read DB_USER
    
    echo -e "${YELLOW}  Enter password for $DB_USER:${NC}"
    read -s DB_PASSWORD
    
    mysql -u root -p"$ROOT_PASSWORD" -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';" 2>/dev/null
    mysql -u root -p"$ROOT_PASSWORD" -e "GRANT ALL PRIVILEGES ON raahpay.* TO '$DB_USER'@'localhost';" 2>/dev/null
    mysql -u root -p"$ROOT_PASSWORD" -e "FLUSH PRIVILEGES;" 2>/dev/null
    
    echo -e "${GREEN}  ✅ User '$DB_USER' created${NC}"
    echo ""
    echo -e "${CYAN}  Add this to your .env file:${NC}"
    echo -e "${CYAN}  DATABASE_URL=mysql+pymysql://$DB_USER:$DB_PASSWORD@localhost:3306/raahpay${NC}"
else
    echo ""
    echo -e "${CYAN}  Add this to your .env file:${NC}"
    echo -e "${CYAN}  DATABASE_URL=mysql+pymysql://root:$ROOT_PASSWORD@localhost:3306/raahpay${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ MySQL Setup Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Next: Edit .env with the DATABASE_URL above"
echo -e "  Then: Run ${CYAN}bash setup.sh${NC}"
echo ""
