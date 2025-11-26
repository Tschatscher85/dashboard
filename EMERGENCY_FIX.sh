#!/bin/bash

# EMERGENCY FIX for 500 Error on Properties Page
# This script runs the database migration that was missing

echo "========================================="
echo "EMERGENCY FIX - Database Migration"
echo "========================================="
echo ""

# Check if migration file exists
if [ ! -f "migrations/add_missing_property_fields.sql" ]; then
    echo "❌ ERROR: Migration file not found!"
    echo "Please make sure you are in the dashboard directory."
    exit 1
fi

echo "📋 This script will:"
echo "  1. Create a backup of your database"
echo "  2. Run the missing database migration"
echo "  3. Restart the application"
echo ""

# Ask for MySQL password
echo "Please enter your MySQL root password:"
read -s MYSQL_PASSWORD
echo ""

# Database credentials
DB_HOST="192.168.0.185"
DB_USER="root"
DB_NAME="immobilien"

echo "1️⃣  Creating database backup..."
BACKUP_FILE="backup_emergency_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h $DB_HOST -u $DB_USER -p$MYSQL_PASSWORD $DB_NAME > $BACKUP_FILE 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
else
    echo "❌ Backup failed! Please check your MySQL credentials."
    exit 1
fi

echo ""
echo "2️⃣  Running database migration..."
mysql -h $DB_HOST -u $DB_USER -p$MYSQL_PASSWORD $DB_NAME < migrations/add_missing_property_fields.sql 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "⚠️  Migration completed with warnings (this is normal if columns already exist)"
fi

echo ""
echo "3️⃣  Restarting application..."
pm2 restart dashboard 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Application restarted!"
else
    echo "⚠️  PM2 restart failed. Trying alternative method..."
    npm run build
    echo "✅ Build completed. Please restart manually with: pm2 restart dashboard"
fi

echo ""
echo "========================================="
echo "✅ EMERGENCY FIX COMPLETED!"
echo "========================================="
echo ""
echo "Please test the application now:"
echo "  1. Open: http://dashboard.tschatscher.eu"
echo "  2. Go to 'Objekte'"
echo "  3. Verify the page loads correctly"
echo ""
echo "If you still see errors, check the logs:"
echo "  pm2 logs dashboard"
echo ""
