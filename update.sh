#!/bin/bash

# ============================================
# Immobilien-Verwaltung - Update Script
# ============================================
# This script updates the application from GitHub

set -e  # Exit on error

echo "🔄 Immobilien-Verwaltung Update"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# Step 1: Pull Latest Changes
# ============================================
echo "📥 Step 1: Pulling latest changes from GitHub..."
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# ============================================
# Step 2: Install Dependencies
# ============================================
echo "📦 Step 2: Installing/updating dependencies..."
pnpm install
echo -e "${GREEN}✓ Dependencies updated${NC}"
echo ""

# ============================================
# Step 3: Run Database Migrations
# ============================================
echo "🔄 Step 3: Running database migrations..."
pnpm db:push
echo -e "${GREEN}✓ Database updated${NC}"
echo ""

# ============================================
# Step 4: Build Application
# ============================================
echo "🏗️  Step 4: Building application..."
pnpm build
echo -e "${GREEN}✓ Application built${NC}"
echo ""

# ============================================
# Step 5: Restart PM2
# ============================================
echo "🔄 Step 5: Restarting application..."
pm2 restart immobilien-verwaltung
echo -e "${GREEN}✓ Application restarted${NC}"
echo ""

# ============================================
# Step 6: Display Status
# ============================================
echo "📊 Step 6: Application status"
pm2 list
echo ""
pm2 logs immobilien-verwaltung --lines 20 --nostream
echo ""

# ============================================
# Completion
# ============================================
echo "================================"
echo -e "${GREEN}✅ Update completed successfully!${NC}"
echo ""
echo "Application is running on: http://localhost:3000"
echo ""
echo "Monitor logs with: pm2 logs immobilien-verwaltung"
echo ""
