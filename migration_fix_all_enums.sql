-- ============================================
-- DASHBOARD ENUM FIX MIGRATION
-- ============================================
-- This migration fixes all ENUM mismatches between
-- Database (English) and Frontend (German)
-- ============================================

USE dashboard;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. FIX CONTACTS TABLE
-- ============================================

-- Fix contactType ENUM (buyer/seller -> kunde/partner)
ALTER TABLE `contacts` 
MODIFY COLUMN `contactType` ENUM(
  'kunde',
  'partner', 
  'dienstleister',
  'sonstiges',
  -- Keep old values for backward compatibility during migration
  'buyer',
  'seller',
  'tenant',
  'landlord',
  'interested',
  'other'
) NOT NULL;

-- Migrate existing data
UPDATE `contacts` SET `contactType` = 'kunde' WHERE `contactType` = 'buyer';
UPDATE `contacts` SET `contactType` = 'partner' WHERE `contactType` = 'seller';
UPDATE `contacts` SET `contactType` = 'sonstiges' WHERE `contactType` = 'other';
UPDATE `contacts` SET `contactType` = 'kunde' WHERE `contactType` = 'interested';
UPDATE `contacts` SET `contactType` = 'kunde' WHERE `contactType` = 'tenant';
UPDATE `contacts` SET `contactType` = 'partner' WHERE `contactType` = 'landlord';

-- Remove old English values
ALTER TABLE `contacts` 
MODIFY COLUMN `contactType` ENUM(
  'kunde',
  'partner',
  'dienstleister',
  'sonstiges'
) NOT NULL;

-- Fix salutation ENUM (mr/ms -> herr/frau)
ALTER TABLE `contacts`
MODIFY COLUMN `salutation` ENUM(
  'herr',
  'frau',
  'divers',
  -- Keep old values for migration
  'mr',
  'ms',
  'diverse'
);

-- Migrate existing salutation data
UPDATE `contacts` SET `salutation` = 'herr' WHERE `salutation` = 'mr';
UPDATE `contacts` SET `salutation` = 'frau' WHERE `salutation` = 'ms';
UPDATE `contacts` SET `salutation` = 'divers' WHERE `salutation` = 'diverse';

-- Remove old English values
ALTER TABLE `contacts`
MODIFY COLUMN `salutation` ENUM(
  'herr',
  'frau',
  'divers'
);

-- Fix type ENUM (person/company -> person/firma)
ALTER TABLE `contacts`
MODIFY COLUMN `type` ENUM(
  'person',
  'firma',
  'company'
);

-- Migrate type data
UPDATE `contacts` SET `type` = 'firma' WHERE `type` = 'company';

-- Remove old value
ALTER TABLE `contacts`
MODIFY COLUMN `type` ENUM(
  'person',
  'firma'
);

-- ============================================
-- 2. FIX PROPERTIES TABLE
-- ============================================

-- Fix propertyType ENUM
ALTER TABLE `properties`
MODIFY COLUMN `propertyType` ENUM(
  'wohnung',
  'haus',
  'gewerbe',
  'grundstueck',
  'stellplatz',
  'sonstiges',
  -- Old values
  'apartment',
  'house',
  'commercial',
  'land',
  'parking',
  'other'
) NOT NULL;

-- Migrate property types
UPDATE `properties` SET `propertyType` = 'wohnung' WHERE `propertyType` = 'apartment';
UPDATE `properties` SET `propertyType` = 'haus' WHERE `propertyType` = 'house';
UPDATE `properties` SET `propertyType` = 'gewerbe' WHERE `propertyType` = 'commercial';
UPDATE `properties` SET `propertyType` = 'grundstueck' WHERE `propertyType` = 'land';
UPDATE `properties` SET `propertyType` = 'stellplatz' WHERE `propertyType` = 'parking';
UPDATE `properties` SET `propertyType` = 'sonstiges' WHERE `propertyType` = 'other';

-- Remove old values
ALTER TABLE `properties`
MODIFY COLUMN `propertyType` ENUM(
  'wohnung',
  'haus',
  'gewerbe',
  'grundstueck',
  'stellplatz',
  'sonstiges'
) NOT NULL;

-- Fix marketingType ENUM
ALTER TABLE `properties`
MODIFY COLUMN `marketingType` ENUM(
  'kauf',
  'miete',
  'pacht',
  -- Old values
  'sale',
  'rent',
  'lease'
) NOT NULL;

-- Migrate marketing types
UPDATE `properties` SET `marketingType` = 'kauf' WHERE `marketingType` = 'sale';
UPDATE `properties` SET `marketingType` = 'miete' WHERE `marketingType` = 'rent';
UPDATE `properties` SET `marketingType` = 'pacht' WHERE `marketingType` = 'lease';

-- Remove old values
ALTER TABLE `properties`
MODIFY COLUMN `marketingType` ENUM(
  'kauf',
  'miete',
  'pacht'
) NOT NULL;

-- Fix status ENUM
ALTER TABLE `properties`
MODIFY COLUMN `status` ENUM(
  'akquise',
  'vorbereitung',
  'vermarktung',
  'reserviert',
  'verkauft',
  'vermietet',
  'inaktiv',
  -- Old values
  'acquisition',
  'preparation',
  'marketing',
  'reserved',
  'sold',
  'rented',
  'inactive'
) NOT NULL DEFAULT 'akquise';

-- Migrate status
UPDATE `properties` SET `status` = 'akquise' WHERE `status` = 'acquisition';
UPDATE `properties` SET `status` = 'vorbereitung' WHERE `status` = 'preparation';
UPDATE `properties` SET `status` = 'vermarktung' WHERE `status` = 'marketing';
UPDATE `properties` SET `status` = 'reserviert' WHERE `status` = 'reserved';
UPDATE `properties` SET `status` = 'verkauft' WHERE `status` = 'sold';
UPDATE `properties` SET `status` = 'vermietet' WHERE `status` = 'rented';
UPDATE `properties` SET `status` = 'inaktiv' WHERE `status` = 'inactive';

-- Remove old values
ALTER TABLE `properties`
MODIFY COLUMN `status` ENUM(
  'akquise',
  'vorbereitung',
  'vermarktung',
  'reserviert',
  'verkauft',
  'vermietet',
  'inaktiv'
) NOT NULL DEFAULT 'akquise';

-- Fix condition ENUM
ALTER TABLE `properties`
MODIFY COLUMN `condition` ENUM(
  'neubau',
  'saniert',
  'gepflegt',
  'renovierungsbeduerftig',
  'abbruchreif',
  -- Old values
  'new',
  'renovated',
  'good',
  'needs_renovation',
  'demolished'
);

-- Migrate condition
UPDATE `properties` SET `condition` = 'neubau' WHERE `condition` = 'new';
UPDATE `properties` SET `condition` = 'saniert' WHERE `condition` = 'renovated';
UPDATE `properties` SET `condition` = 'gepflegt' WHERE `condition` = 'good';
UPDATE `properties` SET `condition` = 'renovierungsbeduerftig' WHERE `condition` = 'needs_renovation';
UPDATE `properties` SET `condition` = 'abbruchreif' WHERE `condition` = 'demolished';

-- Remove old values
ALTER TABLE `properties`
MODIFY COLUMN `condition` ENUM(
  'neubau',
  'saniert',
  'gepflegt',
  'renovierungsbeduerftig',
  'abbruchreif'
);

-- ============================================
-- 3. FIX LEADS TABLE
-- ============================================

ALTER TABLE `leads`
MODIFY COLUMN `status` ENUM(
  'neu',
  'kontaktiert',
  'qualifiziert',
  'konvertiert',
  'abgelehnt',
  -- Old values
  'new',
  'contacted',
  'qualified',
  'converted',
  'rejected'
) DEFAULT 'neu';

-- Migrate leads status
UPDATE `leads` SET `status` = 'neu' WHERE `status` = 'new';
UPDATE `leads` SET `status` = 'kontaktiert' WHERE `status` = 'contacted';
UPDATE `leads` SET `status` = 'qualifiziert' WHERE `status` = 'qualified';
UPDATE `leads` SET `status` = 'konvertiert' WHERE `status` = 'converted';
UPDATE `leads` SET `status` = 'abgelehnt' WHERE `status` = 'rejected';

-- Remove old values
ALTER TABLE `leads`
MODIFY COLUMN `status` ENUM(
  'neu',
  'kontaktiert',
  'qualifiziert',
  'konvertiert',
  'abgelehnt'
) DEFAULT 'neu';

-- ============================================
-- 4. FIX APPOINTMENTS TABLE
-- ============================================

ALTER TABLE `appointments`
MODIFY COLUMN `appointmentType` ENUM(
  'besichtigung',
  'termin',
  'telefonat',
  'sonstiges',
  -- Old values
  'viewing',
  'meeting',
  'phone_call',
  'other'
) DEFAULT 'besichtigung';

-- Migrate appointment types
UPDATE `appointments` SET `appointmentType` = 'besichtigung' WHERE `appointmentType` = 'viewing';
UPDATE `appointments` SET `appointmentType` = 'termin' WHERE `appointmentType` = 'meeting';
UPDATE `appointments` SET `appointmentType` = 'telefonat' WHERE `appointmentType` = 'phone_call';
UPDATE `appointments` SET `appointmentType` = 'sonstiges' WHERE `appointmentType` = 'other';

-- Remove old values
ALTER TABLE `appointments`
MODIFY COLUMN `appointmentType` ENUM(
  'besichtigung',
  'termin',
  'telefonat',
  'sonstiges'
) DEFAULT 'besichtigung';

-- Fix appointment status
ALTER TABLE `appointments`
MODIFY COLUMN `status` ENUM(
  'geplant',
  'abgeschlossen',
  'abgesagt',
  'nicht_erschienen',
  -- Old values
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
) DEFAULT 'geplant';

-- Migrate appointment status
UPDATE `appointments` SET `status` = 'geplant' WHERE `status` = 'scheduled';
UPDATE `appointments` SET `status` = 'abgeschlossen' WHERE `status` = 'completed';
UPDATE `appointments` SET `status` = 'abgesagt' WHERE `status` = 'cancelled';
UPDATE `appointments` SET `status` = 'nicht_erschienen' WHERE `status` = 'no_show';

-- Remove old values
ALTER TABLE `appointments`
MODIFY COLUMN `status` ENUM(
  'geplant',
  'abgeschlossen',
  'abgesagt',
  'nicht_erschienen'
) DEFAULT 'geplant';

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Migration completed successfully!' AS Status;

-- Show sample data to verify
SELECT 'Contacts Sample:' AS Info;
SELECT id, contactType, salutation, type FROM contacts LIMIT 5;

SELECT 'Properties Sample:' AS Info;
SELECT id, propertyType, marketingType, status FROM properties LIMIT 5;

SELECT 'Leads Sample:' AS Info;
SELECT id, status FROM leads LIMIT 5;

SELECT 'Appointments Sample:' AS Info;
SELECT id, appointmentType, status FROM appointments LIMIT 5;
