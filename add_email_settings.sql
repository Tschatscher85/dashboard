-- Add email settings columns to settings table
ALTER TABLE settings
ADD COLUMN brevoApiKey TEXT,
ADD COLUMN emailFrom VARCHAR(255),
ADD COLUMN emailFromName VARCHAR(255),
ADD COLUMN emailNotificationTo VARCHAR(255);
