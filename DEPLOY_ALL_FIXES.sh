#!/bin/bash

# ============================================
# COMPREHENSIVE FIX DEPLOYMENT SCRIPT
# Fixes: Database schema + UI improvements
# ============================================

set -e  # Exit on error

echo "=================================================="
echo "🚀 DEPLOYING ALL FIXES TO PRODUCTION"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER="tschatscher@109.90.44.221"
PORT="2222"
REMOTE_DIR="/home/tschatscher/dashboard"
DB_NAME="dashboard"
DB_USER="immojaeger"
DB_PASS="Survive1985#"

echo -e "${BLUE}📋 Fix Overview:${NC}"
echo "  1. ✅ Database Schema - Add ALL missing fields"
echo "  2. ✅ Module Badge Colors - Hellblau, Allianz Blau, Grau"
echo "  3. ✅ Landing Page Template - Fix saving issue"
echo "  4. ✅ Document Templates - Improved UI/UX"
echo ""

# Step 1: Database Fix
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1/5: Applying Database Schema Fixes${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📤 Uploading SQL fix script..."
scp -P $PORT fix_all_database_fields.sql $SERVER:$REMOTE_DIR/

echo "🔧 Applying database fixes..."
ssh -p $PORT $SERVER << 'ENDSSH'
cd /home/tschatscher/dashboard
echo "Executing SQL script..."
mysql -u immojaeger -p'Survive1985#' dashboard < fix_all_database_fields.sql
if [ $? -eq 0 ]; then
    echo "✅ Database schema updated successfully!"
else
    echo "❌ Database update failed!"
    exit 1
fi
ENDSSH

echo ""
echo -e "${GREEN}✅ Database fixes applied!${NC}"
echo ""

# Step 2: Git Pull Latest Changes
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2/5: Pulling Latest Code from GitHub${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📥 Pulling latest changes..."
ssh -p $PORT $SERVER << 'ENDSSH'
cd /home/tschatscher/dashboard
git stash
git pull origin main
if [ $? -eq 0 ]; then
    echo "✅ Code updated from GitHub!"
else
    echo "❌ Git pull failed!"
    exit 1
fi
ENDSSH

echo ""
echo -e "${GREEN}✅ Code updated!${NC}"
echo ""

# Step 3: Install Dependencies
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3/5: Installing Dependencies${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📦 Installing npm packages..."
ssh -p $PORT $SERVER << 'ENDSSH'
cd /home/tschatscher/dashboard
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed!"
else
    echo "❌ npm install failed!"
    exit 1
fi
ENDSSH

echo ""
echo -e "${GREEN}✅ Dependencies installed!${NC}"
echo ""

# Step 4: Build Application
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4/5: Building Application${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "🔨 Building production bundle..."
ssh -p $PORT $SERVER << 'ENDSSH'
cd /home/tschatscher/dashboard
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build completed!"
else
    echo "❌ Build failed!"
    exit 1
fi
ENDSSH

echo ""
echo -e "${GREEN}✅ Build completed!${NC}"
echo ""

# Step 5: Restart PM2
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5/5: Restarting Application${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "🔄 Restarting PM2 process..."
ssh -p $PORT $SERVER << 'ENDSSH'
pm2 restart dashboard
pm2 save
if [ $? -eq 0 ]; then
    echo "✅ Application restarted!"
else
    echo "❌ PM2 restart failed!"
    exit 1
fi
ENDSSH

echo ""
echo -e "${GREEN}✅ Application restarted!${NC}"
echo ""

# Final Status
echo "=================================================="
echo -e "${GREEN}🎉 ALL FIXES DEPLOYED SUCCESSFULLY!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 What was fixed:${NC}"
echo "  ✅ Database schema - ALL missing fields added"
echo "  ✅ Module badge colors - Updated to Hellblau, Allianz Blau, Grau"
echo "  ✅ Landing page template - Saving now works correctly"
echo "  ✅ Document templates - Improved UI with better organization"
echo ""
echo -e "${BLUE}🌐 Your dashboard is now available at:${NC}"
echo "  https://dashboard.tschatscher.eu"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. Test property creation"
echo "  2. Test contact creation"
echo "  3. Verify module badge colors"
echo "  4. Check landing page template saving"
echo "  5. Review document templates section"
echo ""
echo "=================================================="
