-- Fix Missing Database Fields
-- This script adds all missing fields that Drizzle failed to create

USE dashboard;

-- Add createdBy field to properties table (if not exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'dashboard' 
AND TABLE_NAME = 'properties' 
AND COLUMN_NAME = 'createdBy';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE properties ADD COLUMN createdBy INT NOT NULL DEFAULT 1',
    'SELECT "createdBy already exists in properties" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add createdBy field to contacts table (if not exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'dashboard' 
AND TABLE_NAME = 'contacts' 
AND COLUMN_NAME = 'createdBy';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE contacts ADD COLUMN createdBy INT NOT NULL DEFAULT 1',
    'SELECT "createdBy already exists in contacts" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add createdBy field to leads table (if not exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'dashboard' 
AND TABLE_NAME = 'leads' 
AND COLUMN_NAME = 'createdBy';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE leads ADD COLUMN createdBy INT NOT NULL DEFAULT 1',
    'SELECT "createdBy already exists in leads" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add createdBy field to appointments table (if not exists)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'dashboard' 
AND TABLE_NAME = 'appointments' 
AND COLUMN_NAME = 'createdBy';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE appointments ADD COLUMN createdBy INT NOT NULL DEFAULT 1',
    'SELECT "createdBy already exists in appointments" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify all fields exist
SELECT 
    'properties' AS table_name,
    COUNT(*) AS createdBy_exists
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'dashboard' 
AND TABLE_NAME = 'properties' 
AND COLUMN_NAME = 'createdBy'

UNION ALL

SELECT 
    'contacts' AS table_name,
    COUNT(*) AS createdBy_exists
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'dashboard' 
AND TABLE_NAME = 'contacts' 
AND COLUMN_NAME = 'createdBy'

UNION ALL

SELECT 
    'leads' AS table_name,
    COUNT(*) AS createdBy_exists
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'dashboard' 
AND TABLE_NAME = 'leads' 
AND COLUMN_NAME = 'createdBy'

UNION ALL

SELECT 
    'appointments' AS table_name,
    COUNT(*) AS createdBy_exists
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'dashboard' 
AND TABLE_NAME = 'appointments' 
AND COLUMN_NAME = 'createdBy';

SELECT '✅ All missing fields have been added!' AS status;
