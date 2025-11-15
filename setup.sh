#!/bin/bash

# ============================================
# Immobilien-Verwaltung - Setup Script
# ============================================
# This script sets up the application on a fresh Ubuntu installation

set -e  # Exit on error

echo "🚀 Immobilien-Verwaltung Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# Step 1: Check Prerequisites
# ============================================
echo "📋 Step 1: Checking prerequisites..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Please do not run this script as root${NC}"
   exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found. Installing...${NC}"
    npm install -g pnpm
else
    echo -e "${GREEN}✓ pnpm found: $(pnpm --version)${NC}"
fi

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL not found. Installing...${NC}"
    sudo apt-get update
    sudo apt-get install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
else
    echo -e "${GREEN}✓ MySQL found${NC}"
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing...${NC}"
    npm install -g pm2
else
    echo -e "${GREEN}✓ PM2 found: $(pm2 --version)${NC}"
fi

echo ""

# ============================================
# Step 2: Install Dependencies
# ============================================
echo "📦 Step 2: Installing dependencies..."
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# ============================================
# Step 3: Configure Environment
# ============================================
echo "⚙️  Step 3: Configuring environment..."

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env file with your configuration!${NC}"
    echo "Required settings:"
    echo "  - DATABASE_URL (MySQL connection string)"
    echo "  - JWT_SECRET (generate with: openssl rand -base64 32)"
    echo "  - NAS credentials (if different from defaults)"
    echo ""
    read -p "Press Enter after you've edited .env file..."
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo ""

# ============================================
# Step 4: Setup Database
# ============================================
echo "🗄️  Step 4: Setting up database..."

# Extract database credentials from .env
DB_USER=$(grep DATABASE_URL .env | cut -d'/' -f3 | cut -d':' -f1)
DB_PASS=$(grep DATABASE_URL .env | cut -d':' -f3 | cut -d'@' -f1)
DB_NAME=$(grep DATABASE_URL .env | cut -d'/' -f4)

echo "Database configuration:"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

read -p "Create database and user? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating database..."
    sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
    sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
    sudo mysql -e "FLUSH PRIVILEGES;"
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo "Skipping database creation"
fi

echo ""

# ============================================
# Step 5: Run Database Migrations
# ============================================
echo "🔄 Step 5: Running database migrations..."
pnpm db:push
echo -e "${GREEN}✓ Database schema created${NC}"
echo ""

# ============================================
# Step 6: Build Application
# ============================================
echo "🏗️  Step 6: Building application..."
pnpm build
echo -e "${GREEN}✓ Application built${NC}"
echo ""

# ============================================
# Step 7: Create Logs Directory
# ============================================
echo "📁 Step 7: Creating logs directory..."
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"
echo ""

# ============================================
# Step 8: Setup PM2
# ============================================
echo "🔧 Step 8: Setting up PM2..."

# Stop existing processes
pm2 delete immobilien-verwaltung 2>/dev/null || true

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup | grep "sudo" | bash || true

echo -e "${GREEN}✓ PM2 configured${NC}"
echo ""

# ============================================
# Step 9: Display Status
# ============================================
echo "📊 Step 9: Application status"
pm2 list
echo ""

# ============================================
# Completion
# ============================================
echo "================================"
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo "Application is running on: http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  pm2 list              - Show running processes"
echo "  pm2 logs              - Show application logs"
echo "  pm2 restart all       - Restart application"
echo "  pm2 stop all          - Stop application"
echo "  pm2 monit             - Monitor application"
echo ""
echo "Next steps:"
echo "  1. Configure Nginx reverse proxy (see nginx.conf.example)"
echo "  2. Setup SSL certificate with Let's Encrypt"
echo "  3. Configure API keys in Settings UI"
echo "  4. Test NAS connection"
echo ""
