#!/bin/bash
# Deployment script for field mapping fix
# This script deploys the fix for the property update persistence issue

set -e  # Exit on error

echo "========================================="
echo "DEPLOYING FIELD MAPPING FIX"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Running database migration...${NC}"
echo "This will add all missing fields to the properties table."
echo ""

# Check if MySQL connection is available
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable not set.${NC}"
    echo "Please set it in your .env file or environment."
    exit 1
fi

# Run the migration
echo "Applying migration: add_missing_property_fields.sql"
mysql -h 192.168.0.185 -u root -p < migrations/add_missing_property_fields.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration completed successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Installing dependencies (if needed)...${NC}"
npm install

echo ""
echo -e "${YELLOW}Step 3: Building the application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 4: Restarting the application...${NC}"

# Check if PM2 is being used
if command -v pm2 &> /dev/null; then
    echo "Restarting with PM2..."
    pm2 restart dashboard || pm2 start ecosystem.config.js
    echo -e "${GREEN}✓ Application restarted with PM2${NC}"
else
    echo -e "${YELLOW}PM2 not found. Please restart the application manually.${NC}"
    echo "Run: npm start"
fi

echo ""
echo "========================================="
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo "========================================="
echo ""
echo "What was fixed:"
echo "  ✓ Added field mapping function (router → schema)"
echo "  ✓ Added 40+ missing fields to database schema"
echo "  ✓ Added comprehensive logging for debugging"
echo "  ✓ Added field validation"
echo ""
echo "Critical field mappings:"
echo "  • price → purchasePrice (Kaufpreis)"
echo "  • coldRent → baseRent (Kaltmiete)"
echo "  • warmRent → totalRent (Warmmiete)"
echo "  • balconyArea → balconyTerraceArea"
echo "  • parkingCount → parkingSpaces"
echo "  • and more..."
echo ""
echo "Next steps:"
echo "  1. Test property updates in the UI"
echo "  2. Check server logs for field mapping messages"
echo "  3. Verify data persists after page reload (F5)"
echo ""
echo "Log location: Check PM2 logs with 'pm2 logs dashboard'"
echo ""
