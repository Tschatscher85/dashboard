-- ============================================
-- COMPLETE DATABASE REBUILD SCRIPT
-- Generated from Drizzle Schema
-- ============================================

DROP DATABASE IF EXISTS dashboard;
CREATE DATABASE dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dashboard;

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Basic info
  title VARCHAR(255) NOT NULL,
  headline VARCHAR(255),
  description TEXT,
  descriptionObject TEXT,
  descriptionHighlights TEXT,
  descriptionLocation TEXT,
  descriptionFazit TEXT,
  descriptionCTA TEXT,
  
  -- Property type
  propertyType ENUM('apartment', 'house', 'commercial', 'land', 'parking', 'other') NOT NULL,
  subType VARCHAR(100),
  marketingType ENUM('sale', 'rent', 'lease') NOT NULL,
  status ENUM('acquisition', 'preparation', 'marketing', 'reserved', 'notary', 'sold', 'completed') NOT NULL DEFAULT 'acquisition',
  
  -- Address
  street VARCHAR(255),
  houseNumber VARCHAR(50),
  zipCode VARCHAR(20),
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Deutschland',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Property details
  livingArea DECIMAL(10, 2),
  usableArea DECIMAL(10, 2),
  plotArea DECIMAL(10, 2),
  rooms DECIMAL(4, 1),
  bedrooms INT,
  bathrooms INT,
  floors INT,
  floor INT,
  
  -- Condition & features
  `condition` ENUM('first_time_use', 'first_time_use_after_refurbishment', 'mint_condition', 'refurbished', 'in_need_of_renovation', 'by_arrangement'),
  yearBuilt INT,
  lastModernization INT,
  
  hasBalcony BOOLEAN DEFAULT FALSE,
  hasTerrace BOOLEAN DEFAULT FALSE,
  hasGarden BOOLEAN DEFAULT FALSE,
  hasElevator BOOLEAN DEFAULT FALSE,
  hasBasement BOOLEAN DEFAULT FALSE,
  hasGarage BOOLEAN DEFAULT FALSE,
  hasGuestToilet BOOLEAN DEFAULT FALSE,
  hasBuiltInKitchen BOOLEAN DEFAULT FALSE,
  
  balconyTerraceArea DECIMAL(10, 2),
  gardenArea DECIMAL(10, 2),
  
  -- Parking
  parkingSpaces INT,
  parkingType VARCHAR(255),
  parkingPrice DECIMAL(10, 2),
  
  -- Furnishing
  furnishingQuality ENUM('simple', 'normal', 'upscale', 'luxurious'),
  flooring VARCHAR(255),
  hasStorageRoom BOOLEAN DEFAULT FALSE,
  
  -- Rental details
  baseRent DECIMAL(10, 2),
  additionalCosts DECIMAL(10, 2),
  heatingCosts DECIMAL(10, 2),
  totalRent DECIMAL(10, 2),
  deposit DECIMAL(10, 2),
  heatingCostsInServiceCharge BOOLEAN DEFAULT FALSE,
  
  -- Purchase details
  purchasePrice DECIMAL(12, 2),
  priceOnRequest BOOLEAN DEFAULT FALSE,
  priceByNegotiation BOOLEAN DEFAULT FALSE,
  
  -- Commission
  buyerCommission VARCHAR(50),
  
  -- Investment
  rentalIncome DECIMAL(10, 2),
  isRented BOOLEAN DEFAULT FALSE,
  
  -- Energy certificate
  energyCertificateAvailability ENUM('available', 'not_available', 'not_required'),
  energyCertificateCreationDate DATE,
  energyCertificateType ENUM('bedarfsausweis', 'verbrauchsausweis'),
  energyConsumption INT,
  energyConsumptionElectricity INT,
  energyConsumptionHeat INT,
  co2Emissions INT,
  energyClass ENUM('a_plus', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'),
  energyCertificateIssueDate DATE,
  energyCertificateValidUntil DATE,
  includesWarmWater BOOLEAN DEFAULT FALSE,
  heatingType ENUM('zentralheizung', 'etagenheizung', 'fernwaerme', 'ofenheizung', 'fussboden'),
  mainEnergySource ENUM('gas', 'oel', 'strom', 'solar', 'erdwaerme', 'pellets', 'holz', 'fernwaerme'),
  buildingYearUnknown BOOLEAN DEFAULT FALSE,
  
  -- Contacts & Partners
  supervisorId INT,
  ownerId INT,
  buyerId INT,
  notaryId INT,
  propertyManagementId INT,
  tenantId INT,
  linkedContactIds TEXT,
  
  -- Court & Land Registry
  courtName VARCHAR(255),
  courtCity VARCHAR(100),
  landRegisterNumber VARCHAR(100),
  landRegisterSheet VARCHAR(100),
  parcelNumber VARCHAR(100),
  
  -- Plot details
  plotNumber VARCHAR(100),
  developmentStatus ENUM('fully_developed', 'partially_developed', 'undeveloped', 'raw_building_land'),
  siteArea DECIMAL(10, 2),
  
  -- Assignment
  assignmentType ENUM('alleinauftrag', 'qualifizierter_alleinauftrag', 'einfacher_auftrag'),
  assignmentDuration ENUM('unbefristet', 'befristet'),
  assignmentFrom DATE,
  assignmentTo DATE,
  
  -- Commission (Internal)
  internalCommissionPercent VARCHAR(50),
  internalCommissionType ENUM('percent', 'euro'),
  externalCommissionInternalPercent VARCHAR(50),
  externalCommissionInternalType ENUM('percent', 'euro'),
  totalCommission DECIMAL(10, 2),
  
  -- Commission (External/Expose)
  externalCommissionForExpose VARCHAR(255),
  commissionNote TEXT,
  
  -- Portal settings
  autoSendToPortals BOOLEAN DEFAULT FALSE,
  
  -- Warning/Notes
  warningNote TEXT,
  
  -- Archive
  isArchived BOOLEAN DEFAULT FALSE,
  
  -- Internal notes
  internalNotes TEXT,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyType (propertyType),
  INDEX idx_marketingType (marketingType),
  INDEX idx_status (status),
  INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROPERTY IMAGES TABLE
-- ============================================
CREATE TABLE propertyImages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  propertyId INT NOT NULL,
  imageUrl VARCHAR(500) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyId (propertyId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROPERTY LINKS TABLE
-- ============================================
CREATE TABLE propertyLinks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  propertyId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  showOnLandingPage BOOLEAN DEFAULT TRUE,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyId (propertyId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Module assignment
  moduleImmobilienmakler BOOLEAN DEFAULT FALSE,
  moduleVersicherungen BOOLEAN DEFAULT FALSE,
  moduleHausverwaltung BOOLEAN DEFAULT FALSE,
  
  -- Contact type & category
  contactType ENUM('kunde', 'partner', 'dienstleister', 'sonstiges') DEFAULT 'kunde',
  contactCategory VARCHAR(100),
  
  -- Type (Person or Company)
  type ENUM('person', 'company') NOT NULL DEFAULT 'person',
  
  -- Stammdaten - Basic info (Person)
  salutation ENUM('herr', 'frau', 'divers'),
  title VARCHAR(50),
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  language VARCHAR(50),
  age INT,
  birthDate DATE,
  birthPlace VARCHAR(100),
  birthCountry VARCHAR(100),
  idType VARCHAR(50),
  idNumber VARCHAR(100),
  issuingAuthority VARCHAR(100),
  taxId VARCHAR(100),
  nationality VARCHAR(100),
  
  -- Contact details
  email VARCHAR(255),
  alternativeEmail VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  fax VARCHAR(50),
  website VARCHAR(255),
  
  -- Address (Private)
  street VARCHAR(255),
  houseNumber VARCHAR(50),
  zipCode VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Deutschland',
  
  -- Firma - Company info
  companyName VARCHAR(255),
  position VARCHAR(100),
  companyStreet VARCHAR(255),
  companyHouseNumber VARCHAR(50),
  companyZipCode VARCHAR(20),
  companyCity VARCHAR(100),
  companyCountry VARCHAR(100),
  companyWebsite VARCHAR(255),
  companyPhone VARCHAR(50),
  companyMobile VARCHAR(50),
  companyFax VARCHAR(50),
  isBusinessContact BOOLEAN DEFAULT FALSE,
  
  -- Merkmale & Co.
  advisor VARCHAR(100),
  coAdvisor VARCHAR(100),
  followUpDate DATE,
  source VARCHAR(100),
  status VARCHAR(100),
  tags TEXT,
  archived BOOLEAN DEFAULT FALSE,
  notes TEXT,
  availability VARCHAR(255),
  
  -- Verrechnung - Billing
  blockContact BOOLEAN DEFAULT FALSE,
  sharedWithTeams TEXT,
  sharedWithUsers TEXT,
  
  -- DSGVO
  dsgvoStatus VARCHAR(100),
  dsgvoConsentGranted BOOLEAN DEFAULT FALSE,
  dsgvoDeleteBy DATE,
  dsgvoDeleteReason VARCHAR(255),
  newsletterConsent BOOLEAN DEFAULT FALSE,
  propertyMailingConsent BOOLEAN DEFAULT FALSE,
  
  -- Sync with external systems
  googleContactId VARCHAR(255),
  googleSyncStatus ENUM('not_synced', 'synced', 'error') DEFAULT 'not_synced',
  googleLastSyncAt TIMESTAMP NULL,
  brevoContactId VARCHAR(100),
  brevoSyncStatus ENUM('not_synced', 'synced', 'error') DEFAULT 'not_synced',
  brevoLastSyncAt TIMESTAMP NULL,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_email (email),
  INDEX idx_lastName (lastName),
  INDEX idx_companyName (companyName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  propertyId INT NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileUrl VARCHAR(500) NOT NULL,
  fileType VARCHAR(50),
  fileSize INT,
  category VARCHAR(100),
  description TEXT,
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyId (propertyId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role ENUM('admin', 'agent', 'viewer') NOT NULL DEFAULT 'agent',
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  phone VARCHAR(50),
  isActive BOOLEAN DEFAULT TRUE,
  lastLogin TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Company branding
  companyName VARCHAR(255),
  companyLogo VARCHAR(500),
  companyAddress TEXT,
  companyPhone VARCHAR(50),
  companyEmail VARCHAR(255),
  companyWebsite VARCHAR(255),
  
  -- Legal texts
  imprintText TEXT,
  privacyPolicyText TEXT,
  termsText TEXT,
  
  -- Portal credentials
  immoscout24ApiKey TEXT,
  immobilienscout24Username VARCHAR(255),
  immobilienscout24Password TEXT,
  
  -- Other settings
  defaultCommission VARCHAR(50),
  
  -- E-Mail settings (Brevo)
  brevoApiKey TEXT,
  
  -- E-Mail settings - Immobilienmakler
  realestateEmailFrom VARCHAR(255),
  realestateEmailFromName VARCHAR(255),
  realestateEmailNotificationTo VARCHAR(255),
  
  -- E-Mail settings - Versicherungen
  insuranceEmailFrom VARCHAR(255),
  insuranceEmailFromName VARCHAR(255),
  insuranceEmailNotificationTo VARCHAR(255),
  
  -- E-Mail settings - Hausverwaltung
  propertyMgmtEmailFrom VARCHAR(255),
  propertyMgmtEmailFromName VARCHAR(255),
  propertyMgmtEmailNotificationTo VARCHAR(255),
  
  -- Legacy E-Mail settings
  emailFrom VARCHAR(255),
  emailFromName VARCHAR(255),
  emailNotificationTo VARCHAR(255),
  
  -- Landing Page Settings
  landingPageTemplate VARCHAR(50) DEFAULT 'modern',
  
  -- Document Templates
  exposeTemplate TEXT,
  onePagerTemplate TEXT,
  invoiceTemplate TEXT,
  maklervertragTemplate TEXT,
  
  -- Google Contacts Sync Settings
  googleSyncEnabled BOOLEAN DEFAULT FALSE,
  googleSyncBidirectional BOOLEAN DEFAULT TRUE,
  googleLabelRealEstateBuyer VARCHAR(100) DEFAULT 'Immobilienanfrage',
  googleLabelRealEstateSeller VARCHAR(100) DEFAULT 'Eigentümeranfragen',
  googleLabelInsurance VARCHAR(100) DEFAULT 'Allianz Privat',
  googleLabelPropertyMgmt VARCHAR(100) DEFAULT 'Hausverwaltung',
  
  -- Brevo CRM Sync Settings
  brevoSyncEnabled BOOLEAN DEFAULT FALSE,
  brevoListRealestate VARCHAR(100) DEFAULT '18',
  brevoListInsurance VARCHAR(100),
  brevoListPropertyMgmt VARCHAR(100),
  
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Basic info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Timing
  startTime TIMESTAMP NOT NULL,
  endTime TIMESTAMP NOT NULL,
  
  -- Associations
  propertyId INT,
  contactId INT,
  
  -- Status
  status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
  
  -- Notes
  notes TEXT,
  
  -- Google Calendar integration
  googleCalendarEventId VARCHAR(255),
  googleCalendarSyncStatus ENUM('not_synced', 'synced', 'error') DEFAULT 'not_synced',
  googleCalendarLastSyncAt TIMESTAMP NULL,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyId (propertyId),
  INDEX idx_contactId (contactId),
  INDEX idx_startTime (startTime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Contact info
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  
  -- Lead details
  source VARCHAR(255),
  propertyId INT,
  message TEXT,
  
  -- Status
  status ENUM('new', 'contacted', 'qualified', 'converted', 'rejected') DEFAULT 'new',
  convertedToContactId INT,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_propertyId (propertyId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROPERTY MANAGEMENT CONTRACTS TABLE
-- ============================================
CREATE TABLE propertyManagementContracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Associations
  propertyId INT NOT NULL,
  ownerId INT,
  
  -- Contract details
  contractNumber VARCHAR(100),
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NULL,
  
  -- Status
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyId (propertyId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RENTAL CONTRACTS TABLE
-- ============================================
CREATE TABLE rentalContracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Associations
  propertyId INT NOT NULL,
  tenantId INT NOT NULL,
  
  -- Contract details
  contractNumber VARCHAR(100),
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NULL,
  
  -- Status
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyId (propertyId),
  INDEX idx_tenantId (tenantId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSURANCE POLICIES TABLE
-- ============================================
CREATE TABLE insurancePolicies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Associations
  propertyId INT NOT NULL,
  insuranceCompanyId INT,
  
  -- Policy details
  policyNumber VARCHAR(100),
  policyType VARCHAR(100),
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NULL,
  
  -- Status
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyId (propertyId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MAINTENANCE RECORDS TABLE
-- ============================================
CREATE TABLE maintenanceRecords (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Associations
  propertyId INT NOT NULL,
  
  -- Maintenance details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduledDate TIMESTAMP NULL,
  completedDate TIMESTAMP NULL,
  cost DECIMAL(10, 2),
  vendor VARCHAR(255),
  
  -- Status
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyId (propertyId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- UTILITY BILLS TABLE
-- ============================================
CREATE TABLE utilityBills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Associations
  propertyId INT NOT NULL,
  
  -- Bill details
  utilityType VARCHAR(100),
  billDate TIMESTAMP NOT NULL,
  dueDate TIMESTAMP NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paidBy ENUM('owner', 'tenant', 'management'),
  
  -- Status
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyId (propertyId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PORTAL INQUIRIES TABLE
-- ============================================
CREATE TABLE portalInquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Portal info
  portalName VARCHAR(100),
  portalInquiryId VARCHAR(255),
  
  -- Inquiry details
  propertyId INT,
  inquirerName VARCHAR(255),
  inquirerEmail VARCHAR(255),
  inquirerPhone VARCHAR(50),
  messageText TEXT,
  
  -- Status and assignment
  status ENUM('new', 'in_progress', 'replied', 'closed') DEFAULT 'new',
  assignedTo INT,
  
  -- Response tracking
  firstResponseAt TIMESTAMP NULL,
  lastResponseAt TIMESTAMP NULL,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_propertyId (propertyId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- APP CONFIG TABLE
-- ============================================
CREATE TABLE appConfig (
  configKey VARCHAR(255) PRIMARY KEY,
  configValue TEXT,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONTACT DOCUMENTS TABLE
-- ============================================
CREATE TABLE contactDocuments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contactId INT NOT NULL,
  
  -- Module assignment
  module ENUM('immobilienmakler', 'versicherungen', 'hausverwaltung') NOT NULL,
  
  -- Document info
  fileName VARCHAR(255) NOT NULL,
  fileUrl VARCHAR(500) NOT NULL,
  fileType VARCHAR(50),
  fileSize INT,
  
  -- Categorization
  category VARCHAR(100),
  subcategory VARCHAR(100),
  
  -- Metadata
  description TEXT,
  tags TEXT,
  
  -- Timestamps
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  uploadedBy INT,
  
  INDEX idx_contactId (contactId),
  INDEX idx_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT SETTINGS
-- ============================================
INSERT INTO settings (id, companyName) VALUES (1, 'ImmoJaeger');

-- ============================================
-- DONE
-- ============================================
SELECT 'Database rebuild complete!' AS status;
