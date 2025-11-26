-- ========================================
-- COMPLETE DATABASE REBUILD - CLEAN START
-- ========================================
-- This script drops and recreates the entire database
-- with a clean schema that matches the application code.
-- 
-- WARNING: This will DELETE ALL existing data!
-- Only run this if you have no important data or have a backup.
-- ========================================

DROP DATABASE IF EXISTS dashboard;
CREATE DATABASE dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dashboard;

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255),
  `role` ENUM('admin', 'user') DEFAULT 'user',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PROPERTIES TABLE
-- ========================================
CREATE TABLE `properties` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(500) NOT NULL,
  `propertyType` ENUM('house', 'apartment', 'commercial', 'land', 'parking', 'other') NOT NULL,
  `subType` VARCHAR(100),
  `marketingType` ENUM('sale', 'rent', 'lease') NOT NULL,
  `status` ENUM('acquisition', 'preparation', 'marketing', 'reserved', 'notary', 'sold', 'completed') DEFAULT 'acquisition' NOT NULL,
  
  -- Address
  `street` VARCHAR(255),
  `houseNumber` VARCHAR(50),
  `zipCode` VARCHAR(20),
  `city` VARCHAR(255),
  `region` VARCHAR(255),
  `country` VARCHAR(255) DEFAULT 'Deutschland',
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  
  -- Description
  `description` TEXT,
  `headline` VARCHAR(500),
  `descriptionHighlights` TEXT,
  `descriptionLocation` TEXT,
  `descriptionFazit` TEXT,
  `descriptionCTA` TEXT,
  
  -- Dimensions
  `livingArea` DECIMAL(10, 2),
  `plotArea` DECIMAL(10, 2),
  `usableArea` DECIMAL(10, 2),
  `balconyTerraceArea` DECIMAL(10, 2),
  `gardenArea` DECIMAL(10, 2),
  `rooms` DECIMAL(4, 1),
  `bedrooms` INT,
  `bathrooms` INT,
  `floor` INT,
  `floors` INT,
  
  -- Condition & Features
  `condition` ENUM('first_time_use', 'first_time_use_after_refurbishment', 'mint_condition', 'refurbished', 'in_need_of_renovation', 'by_arrangement'),
  `yearBuilt` INT,
  `lastModernization` INT,
  `hasBalcony` BOOLEAN DEFAULT FALSE,
  `hasTerrace` BOOLEAN DEFAULT FALSE,
  `hasGarden` BOOLEAN DEFAULT FALSE,
  `hasElevator` BOOLEAN DEFAULT FALSE,
  `hasBasement` BOOLEAN DEFAULT FALSE,
  `hasGuestToilet` BOOLEAN DEFAULT FALSE,
  `hasBuiltInKitchen` BOOLEAN DEFAULT FALSE,
  `hasStorageRoom` BOOLEAN DEFAULT FALSE,
  
  -- Parking
  `parkingType` VARCHAR(100),
  `parkingSpaces` INT,
  `parkingPrice` DECIMAL(10, 2),
  
  -- Prices
  `purchasePrice` DECIMAL(12, 2),
  `baseRent` DECIMAL(10, 2),
  `totalRent` DECIMAL(10, 2),
  `deposit` DECIMAL(10, 2),
  `heatingCosts` DECIMAL(10, 2),
  `additionalCosts` DECIMAL(10, 2),
  `priceOnRequest` BOOLEAN DEFAULT FALSE,
  `priceByNegotiation` BOOLEAN DEFAULT FALSE,
  `isRented` BOOLEAN DEFAULT FALSE,
  
  -- Energy Certificate
  `energyCertificateAvailability` ENUM('vorhanden', 'nicht_vorhanden', 'nicht_benoetigt'),
  `energyCertificateCreationDate` VARCHAR(50),
  `energyCertificateType` ENUM('bedarfsausweis', 'verbrauchsausweis'),
  `energyConsumption` DECIMAL(10, 2),
  `energyConsumptionElectricity` DECIMAL(10, 2),
  `energyConsumptionHeat` DECIMAL(10, 2),
  `energyClass` VARCHAR(10),
  `energyCertificateIssueDate` DATE,
  `energyCertificateValidUntil` DATE,
  `includesWarmWater` BOOLEAN DEFAULT FALSE,
  `heatingType` VARCHAR(100),
  `mainEnergySource` VARCHAR(100),
  `co2Emissions` DECIMAL(10, 2),
  
  -- Land Register
  `landRegisterSheet` VARCHAR(100),
  `buildingYearUnknown` BOOLEAN DEFAULT FALSE,
  
  -- Assignment
  `assignmentType` ENUM('alleinauftrag', 'einfach', 'mehrfach'),
  `assignmentDuration` ENUM('befristet', 'unbefristet'),
  `assignmentFrom` DATE,
  `assignmentTo` DATE,
  
  -- Commission
  `internalCommissionPercent` VARCHAR(50),
  `externalCommissionInternalPercent` VARCHAR(50),
  `totalCommission` DECIMAL(10, 2),
  
  -- Travel Times
  `walkingTimeToPublicTransport` INT,
  `distanceToPublicTransport` DECIMAL(10, 2),
  `drivingTimeToHighway` INT,
  `distanceToHighway` DECIMAL(10, 2),
  `drivingTimeToMainStation` INT,
  `distanceToMainStation` DECIMAL(10, 2),
  `drivingTimeToAirport` INT,
  `distanceToAirport` DECIMAL(10, 2),
  
  -- Relationships
  `supervisorId` INT,
  `ownerId` INT,
  `buyerId` INT,
  `notaryId` INT,
  `propertyManagementId` INT,
  `tenantId` INT,
  
  -- Metadata
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_propertyType` (`propertyType`),
  INDEX `idx_marketingType` (`marketingType`),
  INDEX `idx_status` (`status`),
  INDEX `idx_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- CONTACTS TABLE
-- ========================================
CREATE TABLE `contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contactType` ENUM('person', 'company') DEFAULT 'person' NOT NULL,
  `type` ENUM('kunde', 'partner', 'dienstleister', 'sonstiges') DEFAULT 'kunde',
  `category` VARCHAR(100),
  
  -- Person fields
  `salutation` VARCHAR(50),
  `title` VARCHAR(100),
  `firstName` VARCHAR(255),
  `lastName` VARCHAR(255),
  `birthDate` DATE,
  
  -- Company fields
  `companyName` VARCHAR(500),
  `legalForm` VARCHAR(100),
  `taxId` VARCHAR(100),
  `commercialRegister` VARCHAR(100),
  
  -- Contact info
  `email` VARCHAR(255),
  `phone` VARCHAR(100),
  `mobile` VARCHAR(100),
  `fax` VARCHAR(100),
  `website` VARCHAR(500),
  
  -- Address
  `street` VARCHAR(255),
  `houseNumber` VARCHAR(50),
  `zipCode` VARCHAR(20),
  `city` VARCHAR(255),
  `country` VARCHAR(255) DEFAULT 'Deutschland',
  
  -- Modules
  `moduleRealEstate` BOOLEAN DEFAULT FALSE,
  `moduleInsurance` BOOLEAN DEFAULT FALSE,
  `modulePropertyManagement` BOOLEAN DEFAULT FALSE,
  
  -- Notes
  `notes` TEXT,
  
  -- Metadata
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_contactType` (`contactType`),
  INDEX `idx_type` (`type`),
  INDEX `idx_lastName` (`lastName`),
  INDEX `idx_companyName` (`companyName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- LEADS TABLE
-- ========================================
CREATE TABLE `leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `source` VARCHAR(255),
  `status` ENUM('new', 'contacted', 'qualified', 'converted', 'lost') DEFAULT 'new',
  `contactId` INT,
  `propertyId` INT,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- DEALS TABLE (Kanban/Pipeline)
-- ========================================
CREATE TABLE `deals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT,
  `value` DECIMAL(12, 2),
  `stage` ENUM('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost') DEFAULT 'lead' NOT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `probability` INT DEFAULT 50,
  `expectedCloseDate` DATE,
  `actualCloseDate` DATE,
  
  -- Relationships
  `contactId` INT,
  `propertyId` INT,
  `assignedTo` INT,
  
  -- Kanban position
  `position` INT DEFAULT 0,
  
  -- Metadata
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  INDEX `idx_stage` (`stage`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_assignedTo` (`assignedTo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- ACTIVITIES TABLE (Tasks, Notes, Calls)
-- ========================================
CREATE TABLE `activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('task', 'note', 'call', 'email', 'meeting') NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT,
  `status` ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  `dueDate` DATETIME,
  `completedAt` DATETIME,
  
  -- Relationships
  `contactId` INT,
  `propertyId` INT,
  `dealId` INT,
  `assignedTo` INT,
  
  -- Metadata
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_dueDate` (`dueDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- INSERT DEFAULT ADMIN USER
-- ========================================
-- Password: admin (hashed with bcrypt)
INSERT INTO `users` (`username`, `password`, `email`, `role`) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@example.com', 'admin');

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT 'Database rebuilt successfully!' as status;
SELECT 'Default admin user created: username=admin, password=admin' as info;
