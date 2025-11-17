#!/bin/bash

# ============================================
# DASHBOARD DEPLOYMENT SCRIPT
# ============================================
# Automated deployment with safety checks
# ============================================

set -e  # Exit on error

echo "🚀 Starting Dashboard Deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 1. PRE-FLIGHT CHECKS
# ============================================

echo "📋 Running pre-flight checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the dashboard directory?${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo -e "${YELLOW}💡 Copy .env.template to .env and fill in your values:${NC}"
    echo "   cp .env.template .env"
    echo "   nano .env"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=mysql://" .env; then
    echo -e "${RED}❌ Error: DATABASE_URL not configured in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-flight checks passed${NC}"
echo ""

# ============================================
# 2. BACKUP CURRENT VERSION
# ============================================

echo "💾 Creating backup..."

if [ -d "dist" ]; then
    BACKUP_DIR="backups/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r dist "$BACKUP_DIR/"
    echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}⚠️  No existing dist directory to backup${NC}"
fi

echo ""

# ============================================
# 3. GIT PULL
# ============================================

echo "📥 Pulling latest code from GitHub..."

git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# ============================================
# 4. INSTALL DEPENDENCIES
# ============================================

echo "📦 Installing dependencies..."

pnpm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ pnpm install failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# ============================================
# 5. DATABASE MIGRATION
# ============================================

echo "🗄️  Checking for database migrations..."

if [ -f "migration_fix_all_enums.sql" ]; then
    echo -e "${YELLOW}⚠️  Migration file found: migration_fix_all_enums.sql${NC}"
    echo ""
    read -p "Do you want to run the database migration? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Running migration..."
        
        # Extract database credentials from .env
        DB_URL=$(grep "DATABASE_URL=" .env | cut -d '=' -f2)
        
        # Parse connection string
        # Format: mysql://user:password@host:port/database
        DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
        DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
        DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        # URL decode password (handle %23 -> #)
        DB_PASS=$(echo "$DB_PASS" | sed 's/%23/#/g')
        
        echo "Connecting to database: $DB_NAME@$DB_HOST:$DB_PORT as $DB_USER"
        
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < migration_fix_all_enums.sql
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migration completed successfully${NC}"
            
            # Rename migration file to prevent re-running
            mv migration_fix_all_enums.sql "migration_fix_all_enums.sql.done-$(date +%Y%m%d-%H%M%S)"
        else
            echo -e "${RED}❌ Migration failed!${NC}"
            echo -e "${YELLOW}💡 You can run it manually:${NC}"
            echo "   mysql -u $DB_USER -p $DB_NAME < migration_fix_all_enums.sql"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping migration${NC}"
    fi
else
    echo -e "${GREEN}✅ No pending migrations${NC}"
fi

echo ""

# ============================================
# 6. BUILD
# ============================================

echo "🔨 Building application..."

pnpm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# ============================================
# 7. PM2 RESTART
# ============================================

echo "🔄 Restarting PM2 process..."

# Check if PM2 process exists
if pm2 list | grep -q "dashboard"; then
    echo "Restarting existing PM2 process..."
    pm2 restart dashboard --update-env
else
    echo "Starting new PM2 process..."
    pm2 start dist/index.js --name dashboard
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ PM2 restart failed!${NC}"
    exit 1
fi

# Save PM2 process list
pm2 save

echo -e "${GREEN}✅ PM2 restarted${NC}"
echo ""

# ============================================
# 8. VERIFY DEPLOYMENT
# ============================================

echo "🔍 Verifying deployment..."

sleep 3  # Wait for PM2 to start

# Check PM2 status
PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="dashboard") | .pm2_env.status')

if [ "$PM2_STATUS" = "online" ]; then
    echo -e "${GREEN}✅ Dashboard is running${NC}"
else
    echo -e "${RED}❌ Dashboard is not running! Status: $PM2_STATUS${NC}"
    echo ""
    echo "Showing logs:"
    pm2 logs dashboard --lines 20 --nostream
    exit 1
fi

echo ""

# ============================================
# 9. SUMMARY
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Status:"
pm2 status dashboard
echo ""
echo "🌐 Application should be available at:"
echo "   http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📝 Useful commands:"
echo "   pm2 logs dashboard          - View logs"
echo "   pm2 restart dashboard       - Restart application"
echo "   pm2 stop dashboard          - Stop application"
echo "   pm2 monit                   - Monitor resources"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
