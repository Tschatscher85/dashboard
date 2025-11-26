-- ============================================
-- DATABASE EXTENSIONS FOR CRM ENHANCEMENTS
-- ============================================

USE dashboard;

-- ============================================
-- INSURANCES TABLE (Versicherungen)
-- ============================================
CREATE TABLE IF NOT EXISTS insurances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Contact association
  contactId INT NOT NULL,
  
  -- Insurance details
  policyNumber VARCHAR(100),
  insuranceCompany VARCHAR(255),
  insuranceType VARCHAR(100), -- e.g., "Hausrat", "Rechtsschutz", "Haftpflicht", "KFZ", "Leben"
  
  -- Dates
  yearlyMeeting DATE, -- Jahresgespräch
  startDate DATE,
  endDate DATE,
  
  -- Premium
  premium DECIMAL(10, 2),
  paymentInterval ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'yearly',
  
  -- Status
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_contactId (contactId),
  INDEX idx_status (status),
  INDEX idx_insuranceType (insuranceType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- WEBHOOK SETTINGS (in appConfig table)
-- ============================================
-- Webhook configuration will be stored in appConfig table
-- Keys: webhook_url, webhook_enabled, webhook_events (JSON)

-- ============================================
-- KANBAN BOARDS
-- ============================================
CREATE TABLE IF NOT EXISTS kanban_boards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Board details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  module ENUM('immobilienmakler', 'versicherungen', 'hausverwaltung', 'general') DEFAULT 'general',
  
  -- Settings
  isActive BOOLEAN DEFAULT TRUE,
  sortOrder INT DEFAULT 0,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- KANBAN COLUMNS
-- ============================================
CREATE TABLE IF NOT EXISTS kanban_columns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Board association
  boardId INT NOT NULL,
  
  -- Column details
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50) DEFAULT '#3b82f6', -- Hex color code
  
  -- Settings
  sortOrder INT DEFAULT 0,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_boardId (boardId),
  FOREIGN KEY (boardId) REFERENCES kanban_boards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- KANBAN CARDS (Deals/Tasks)
-- ============================================
CREATE TABLE IF NOT EXISTS kanban_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Board and column association
  boardId INT NOT NULL,
  columnId INT NOT NULL,
  
  -- Card details
  title VARCHAR(255) NOT NULL, -- Kundenname
  description TEXT, -- z.B. "Anfrage für Wohnung XY"
  
  -- Associations
  contactId INT, -- Link to contact
  propertyId INT, -- Link to property
  
  -- Settings
  sortOrder INT DEFAULT 0,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  movedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Track when card was moved
  
  INDEX idx_boardId (boardId),
  INDEX idx_columnId (columnId),
  INDEX idx_contactId (contactId),
  INDEX idx_propertyId (propertyId),
  FOREIGN KEY (boardId) REFERENCES kanban_boards(id) ON DELETE CASCADE,
  FOREIGN KEY (columnId) REFERENCES kanban_columns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CUSTOMER USERS (Kunden-Portal)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Contact association
  contactId INT NOT NULL UNIQUE,
  
  -- Login credentials
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- Hashed password
  
  -- Settings
  isActive BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastLogin TIMESTAMP NULL,
  
  INDEX idx_email (email),
  INDEX idx_contactId (contactId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DOCUMENT TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS document_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Template details
  name VARCHAR(255) NOT NULL, -- e.g., "Maklervertrag", "Rechnung Käufer"
  description TEXT,
  category ENUM('contract', 'invoice', 'letter', 'other') DEFAULT 'other',
  
  -- Template content
  templateContent TEXT NOT NULL, -- HTML or Markdown with placeholders
  templateType ENUM('html', 'markdown', 'docx') DEFAULT 'html',
  
  -- Placeholders (JSON array of available placeholders)
  availablePlaceholders TEXT, -- JSON: ["kunde_name", "strasse", "preis", ...]
  
  -- Settings
  isActive BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONTACT TAGS (for internal filtering)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Tag details
  name VARCHAR(100) NOT NULL UNIQUE, -- e.g., "Offene Rechnung", "Offene Mahnung", "Offener Schaden"
  color VARCHAR(50) DEFAULT '#6b7280', -- Hex color code
  module ENUM('immobilienmakler', 'versicherungen', 'hausverwaltung', 'general') DEFAULT 'general',
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  INDEX idx_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONTACT TAG ASSIGNMENTS (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  contactId INT NOT NULL,
  tagId INT NOT NULL,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY unique_contact_tag (contactId, tagId),
  INDEX idx_contactId (contactId),
  INDEX idx_tagId (tagId),
  FOREIGN KEY (tagId) REFERENCES contact_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Default contact tags
INSERT IGNORE INTO contact_tags (name, color, module) VALUES
('Offene Rechnung', '#ef4444', 'general'),
('Offene Mahnung', '#dc2626', 'general'),
('Offener Schaden', '#f59e0b', 'versicherungen'),
('VIP Kunde', '#10b981', 'general'),
('Interessent', '#3b82f6', 'immobilienmakler');

-- Default Kanban board for Immobilien-Leads
INSERT INTO kanban_boards (name, description, module, sortOrder) VALUES
('Immobilien-Leads', 'Lead-Management für Immobilienmakler', 'immobilienmakler', 1);

-- Get the board ID
SET @board_id = LAST_INSERT_ID();

-- Default columns for Immobilien-Leads board
INSERT INTO kanban_columns (boardId, name, color, sortOrder) VALUES
(@board_id, 'Neuer Lead', '#3b82f6', 1),
(@board_id, 'Angebot gesendet', '#f59e0b', 2),
(@board_id, 'Angebot nachfassen', '#ef4444', 3),
(@board_id, 'Gewonnen', '#10b981', 4),
(@board_id, 'Verloren', '#6b7280', 5);

-- ============================================
-- WEBHOOK CONFIGURATION (in appConfig)
-- ============================================
INSERT INTO appConfig (configKey, configValue) VALUES
('webhook_url', ''),
('webhook_enabled', 'false'),
('webhook_events', '{"contact_created":false,"contact_updated":false,"lead_created":false,"deal_status_changed":true,"property_created":false}')
ON DUPLICATE KEY UPDATE configKey=configKey;

-- ============================================
-- DONE
-- ============================================
SELECT 'Database extensions complete!' AS status;
