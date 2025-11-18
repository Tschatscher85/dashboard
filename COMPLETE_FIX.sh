#!/bin/bash

# Complete Dashboard Fix Script
# This script fixes ALL known issues in the dashboard

set -e  # Exit on error

echo "🔧 Starting Complete Dashboard Fix..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the dashboard directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Fixing missing database fields...${NC}"
echo "This will add createdBy fields to all tables."
echo ""

# Ask for MySQL password
read -sp "Enter MySQL root password: " MYSQL_PASSWORD
echo ""

# Run the fix script
mysql -u root -p"$MYSQL_PASSWORD" dashboard < fix_missing_fields.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database fields fixed!${NC}"
else
    echo -e "${RED}❌ Database fix failed!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 2: Installing dependencies...${NC}"
pnpm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed!${NC}"
else
    echo -e "${RED}❌ Dependency installation failed!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 3: Building project...${NC}"
pnpm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 4: Restarting PM2...${NC}"
pm2 restart dashboard --update-env

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PM2 restarted!${NC}"
else
    echo -e "${RED}❌ PM2 restart failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Complete fix finished successfully!${NC}"
echo ""
echo "✅ All issues fixed:"
echo "  - Missing createdBy fields added"
echo "  - Frontend price field fixed (price → purchasePrice)"
echo "  - Number parsing fixed (parseInt → parseFloat)"
echo "  - Dependencies updated"
echo "  - Project rebuilt"
echo "  - PM2 restarted"
echo ""
echo "🧪 Test your dashboard now:"
echo "  1. Create a new property"
echo "  2. Create a new contact"
echo "  3. Check if everything saves correctly"
echo ""
echo "If you still have issues, check the logs:"
echo "  pm2 logs dashboard --lines 50"
echo ""
