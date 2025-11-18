-- ============================================
-- COMPREHENSIVE DATABASE SCHEMA FIX
-- Adds ALL missing fields from schema.ts
-- ============================================

USE dashboard;

-- ============================================
-- PROPERTIES TABLE - Add all missing fields
-- ============================================

-- Add createdBy field if missing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS createdBy INT DEFAULT NULL;

-- Basic info fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS headline VARCHAR(255) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS descriptionObject TEXT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS descriptionHighlights TEXT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS descriptionLocation TEXT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS descriptionFazit TEXT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS descriptionCTA TEXT DEFAULT NULL;

-- Property type fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS subType VARCHAR(100) DEFAULT NULL;

-- Address fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS houseNumber VARCHAR(50) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS region VARCHAR(100) DEFAULT NULL;

-- Property details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS usableArea DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plotArea DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floors INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor INT DEFAULT NULL;

-- Condition & features
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lastModernization INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hasGuestToilet TINYINT(1) DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hasBuiltInKitchen TINYINT(1) DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS balconyTerraceArea DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gardenArea DECIMAL(10,2) DEFAULT NULL;

-- Parking
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parkingSpaces INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parkingType VARCHAR(255) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parkingPrice DECIMAL(10,2) DEFAULT NULL;

-- Furnishing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS furnishingQuality ENUM('simple', 'normal', 'upscale', 'luxurious') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS flooring VARCHAR(255) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hasStorageRoom TINYINT(1) DEFAULT 0;

-- Rental details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS baseRent DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS additionalCosts DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS heatingCosts DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS totalRent DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS heatingCostsInServiceCharge TINYINT(1) DEFAULT 0;

-- Purchase details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS priceOnRequest TINYINT(1) DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS priceByNegotiation TINYINT(1) DEFAULT 0;

-- Commission
ALTER TABLE properties ADD COLUMN IF NOT EXISTS buyerCommission VARCHAR(50) DEFAULT NULL;

-- Investment
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rentalIncome DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS isRented TINYINT(1) DEFAULT 0;

-- Energy certificate
ALTER TABLE properties ADD COLUMN IF NOT EXISTS energyCertificateAvailability ENUM('available', 'not_available', 'not_required') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS energyCertificateCreationDate DATE DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS energyCertificateType ENUM('bedarfsausweis', 'verbrauchsausweis') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS energyConsumption INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS energyConsumptionElectricity INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS energyConsumptionHeat INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS co2Emissions INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS energyClass ENUM('a_plus', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS energyCertificateIssueDate DATE DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS energyCertificateValidUntil DATE DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS includesWarmWater TINYINT(1) DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS heatingType ENUM('zentralheizung', 'etagenheizung', 'fernwaerme', 'ofenheizung', 'fussboden') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mainEnergySource ENUM('gas', 'oel', 'strom', 'solar', 'erdwaerme', 'pellets', 'holz', 'fernwaerme') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS buildingYearUnknown TINYINT(1) DEFAULT 0;

-- Contacts & Partners
ALTER TABLE properties ADD COLUMN IF NOT EXISTS supervisorId INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownerId INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS buyerId INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS notaryId INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS propertyManagementId INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tenantId INT DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS linkedContactIds TEXT DEFAULT NULL;

-- Court & Land Registry
ALTER TABLE properties ADD COLUMN IF NOT EXISTS courtName VARCHAR(255) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS courtCity VARCHAR(100) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS landRegisterNumber VARCHAR(100) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS landRegisterSheet VARCHAR(100) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parcelNumber VARCHAR(100) DEFAULT NULL;

-- Plot details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plotNumber VARCHAR(100) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS developmentStatus ENUM('fully_developed', 'partially_developed', 'undeveloped', 'raw_building_land') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS siteArea DECIMAL(10,2) DEFAULT NULL;

-- Assignment
ALTER TABLE properties ADD COLUMN IF NOT EXISTS assignmentType ENUM('alleinauftrag', 'qualifizierter_alleinauftrag', 'einfacher_auftrag') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS assignmentDuration ENUM('unbefristet', 'befristet') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS assignmentFrom DATE DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS assignmentTo DATE DEFAULT NULL;

-- Commission (Internal)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS internalCommissionPercent VARCHAR(50) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS internalCommissionType ENUM('percent', 'euro') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS externalCommissionInternalPercent VARCHAR(50) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS externalCommissionInternalType ENUM('percent', 'euro') DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS totalCommission DECIMAL(10,2) DEFAULT NULL;

-- Commission (External/Expose)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS externalCommissionForExpose VARCHAR(255) DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS commissionNote TEXT DEFAULT NULL;

-- Portal settings
ALTER TABLE properties ADD COLUMN IF NOT EXISTS autoSendToPortals TINYINT(1) DEFAULT 0;

-- Warning/Notes
ALTER TABLE properties ADD COLUMN IF NOT EXISTS warningNote TEXT DEFAULT NULL;

-- Archive
ALTER TABLE properties ADD COLUMN IF NOT EXISTS isArchived TINYINT(1) DEFAULT 0;

-- Internal notes
ALTER TABLE properties ADD COLUMN IF NOT EXISTS internalNotes TEXT DEFAULT NULL;

-- ============================================
-- CONTACTS TABLE - Add all missing fields
-- ============================================

-- Add createdBy field if missing
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS createdBy INT DEFAULT NULL;

-- Module assignment
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS moduleImmobilienmakler TINYINT(1) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS moduleVersicherungen TINYINT(1) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS moduleHausverwaltung TINYINT(1) DEFAULT 0;

-- Contact type & category
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contactCategory VARCHAR(100) DEFAULT NULL;

-- Personal info
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS age INT DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthDate DATE DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthPlace VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthCountry VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS idType VARCHAR(50) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS idNumber VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS issuingAuthority VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS taxId VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT NULL;

-- Contact details
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS alternativeEmail VARCHAR(255) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS fax VARCHAR(50) DEFAULT NULL;

-- Address
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS houseNumber VARCHAR(50) DEFAULT NULL;

-- Company info
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS position VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS companyHouseNumber VARCHAR(50) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS companyMobile VARCHAR(50) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS companyFax VARCHAR(50) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS isBusinessContact TINYINT(1) DEFAULT 0;

-- Merkmale & Co.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS advisor VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS coAdvisor VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS followUpDate DATE DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS archived TINYINT(1) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS availability VARCHAR(255) DEFAULT NULL;

-- Verrechnung - Billing
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS blockContact TINYINT(1) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sharedWithTeams TEXT DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sharedWithUsers TEXT DEFAULT NULL;

-- DSGVO
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dsgvoStatus VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dsgvoConsentGranted TINYINT(1) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dsgvoDeleteBy DATE DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dsgvoDeleteReason VARCHAR(255) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS newsletterConsent TINYINT(1) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS propertyMailingConsent TINYINT(1) DEFAULT 0;

-- Sync with external systems
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS googleContactId VARCHAR(255) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS googleSyncStatus ENUM('not_synced', 'synced', 'error') DEFAULT 'not_synced';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS googleLastSyncAt TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS brevoContactId VARCHAR(100) DEFAULT NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS brevoSyncStatus ENUM('not_synced', 'synced', 'error') DEFAULT 'not_synced';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS brevoLastSyncAt TIMESTAMP NULL DEFAULT NULL;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Properties table updated successfully' AS status;
SELECT 'Contacts table updated successfully' AS status;
SELECT 'All missing fields have been added' AS status;
