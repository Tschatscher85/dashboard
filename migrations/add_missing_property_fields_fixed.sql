-- Migration: Add missing property fields (FIXED VERSION)
-- Date: 2024-11-26
-- Description: Adds all missing fields from the tRPC router to the properties table
-- Note: Uses proper MySQL syntax without IF NOT EXISTS for ALTER TABLE ADD COLUMN

-- Add category field
ALTER TABLE properties ADD COLUMN category VARCHAR(100) NULL COMMENT 'Property category';

-- Add portal settings
ALTER TABLE properties ADD COLUMN hideStreetOnPortals BOOLEAN DEFAULT FALSE COMMENT 'Hide street address on portals';

-- Add floor details
ALTER TABLE properties ADD COLUMN floorLevel VARCHAR(50) NULL COMMENT 'Floor level (text description)';
ALTER TABLE properties ADD COLUMN totalFloors INT NULL COMMENT 'Total number of floors in building';

-- Add financial fields
ALTER TABLE properties ADD COLUMN nonRecoverableCosts DECIMAL(10,2) NULL COMMENT 'Non-recoverable costs';
ALTER TABLE properties ADD COLUMN houseMoney DECIMAL(10,2) NULL COMMENT 'House money (Hausgeld)';
ALTER TABLE properties ADD COLUMN maintenanceReserve DECIMAL(10,2) NULL COMMENT 'Maintenance reserve';

-- Add feature flags
ALTER TABLE properties ADD COLUMN isBarrierFree BOOLEAN DEFAULT FALSE COMMENT 'Barrier-free accessibility';
ALTER TABLE properties ADD COLUMN hasLoggia BOOLEAN DEFAULT FALSE COMMENT 'Has loggia';
ALTER TABLE properties ADD COLUMN isMonument BOOLEAN DEFAULT FALSE COMMENT 'Monument protected';
ALTER TABLE properties ADD COLUMN suitableAsHoliday BOOLEAN DEFAULT FALSE COMMENT 'Suitable as holiday home';
ALTER TABLE properties ADD COLUMN hasFireplace BOOLEAN DEFAULT FALSE COMMENT 'Has fireplace';
ALTER TABLE properties ADD COLUMN hasPool BOOLEAN DEFAULT FALSE COMMENT 'Has swimming pool';
ALTER TABLE properties ADD COLUMN hasSauna BOOLEAN DEFAULT FALSE COMMENT 'Has sauna';
ALTER TABLE properties ADD COLUMN hasAlarm BOOLEAN DEFAULT FALSE COMMENT 'Has alarm system';
ALTER TABLE properties ADD COLUMN hasWinterGarden BOOLEAN DEFAULT FALSE COMMENT 'Has winter garden';
ALTER TABLE properties ADD COLUMN hasAirConditioning BOOLEAN DEFAULT FALSE COMMENT 'Has air conditioning';
ALTER TABLE properties ADD COLUMN hasParking BOOLEAN DEFAULT FALSE COMMENT 'Has parking';

-- Add description fields
ALTER TABLE properties ADD COLUMN bathroomFeatures TEXT NULL COMMENT 'Bathroom features description';

-- Add energy/building fields
ALTER TABLE properties ADD COLUMN heatingSystemYear INT NULL COMMENT 'Year heating system was installed';
ALTER TABLE properties ADD COLUMN buildingPhase VARCHAR(100) NULL COMMENT 'Building phase';
ALTER TABLE properties ADD COLUMN equipmentQuality VARCHAR(100) NULL COMMENT 'Equipment quality';

-- Add availability
ALTER TABLE properties ADD COLUMN availableFrom DATE NULL COMMENT 'Available from date';

-- Add owner details
ALTER TABLE properties ADD COLUMN ownerType VARCHAR(100) NULL COMMENT 'Type of owner';

-- Add transportation/location details
ALTER TABLE properties ADD COLUMN walkingTimeToPublicTransport INT NULL COMMENT 'Walking time to public transport (minutes)';
ALTER TABLE properties ADD COLUMN distanceToPublicTransport DECIMAL(10,2) NULL COMMENT 'Distance to public transport (km)';
ALTER TABLE properties ADD COLUMN drivingTimeToHighway INT NULL COMMENT 'Driving time to highway (minutes)';
ALTER TABLE properties ADD COLUMN distanceToHighway DECIMAL(10,2) NULL COMMENT 'Distance to highway (km)';
ALTER TABLE properties ADD COLUMN drivingTimeToMainStation INT NULL COMMENT 'Driving time to main station (minutes)';
ALTER TABLE properties ADD COLUMN distanceToMainStation DECIMAL(10,2) NULL COMMENT 'Distance to main station (km)';
ALTER TABLE properties ADD COLUMN drivingTimeToAirport INT NULL COMMENT 'Driving time to airport (minutes)';
ALTER TABLE properties ADD COLUMN distanceToAirport DECIMAL(10,2) NULL COMMENT 'Distance to airport (km)';

-- Add landing page fields
ALTER TABLE properties ADD COLUMN landingPageSlug VARCHAR(255) NULL UNIQUE COMMENT 'URL slug for landing page';
ALTER TABLE properties ADD COLUMN landingPagePublished BOOLEAN DEFAULT FALSE COMMENT 'Landing page published status';

-- Create index on landingPageSlug for faster lookups
CREATE INDEX idx_properties_landing_page_slug ON properties(landingPageSlug);

-- Create index on availableFrom for filtering
CREATE INDEX idx_properties_available_from ON properties(availableFrom);
