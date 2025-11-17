-- ============================================
-- MIGRATION: Fix ENUM Mismatches
-- ============================================
-- This script fixes all ENUM fields that have English values
-- but the application sends German values.
--
-- Run this AFTER deploying the new code!
-- ============================================

USE dashboard;

-- Fix contactType ENUM (kunde, partner, dienstleister, sonstiges)
ALTER TABLE contacts 
MODIFY contactType ENUM('kunde','partner','dienstleister','sonstiges') 
DEFAULT 'kunde';

-- Fix salutation ENUM (herr, frau, divers)
ALTER TABLE contacts 
MODIFY salutation ENUM('herr','frau','divers') 
DEFAULT NULL;

-- Fix type ENUM (person, firma)
ALTER TABLE contacts 
MODIFY type ENUM('person','firma') 
DEFAULT 'person';

-- Verify changes
SELECT 
  COLUMN_NAME, 
  COLUMN_TYPE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'dashboard' 
  AND TABLE_NAME = 'contacts' 
  AND COLUMN_NAME IN ('contactType', 'salutation', 'type');

-- Show sample data
SELECT id, lastName, contactType, salutation, type 
FROM contacts 
ORDER BY id DESC 
LIMIT 5;

SELECT '✅ Migration completed successfully!' AS status;
