-- Fix condition ENUM mismatch (English -> German)
-- This fixes the validation error when saving properties

USE dashboard;

-- Modify the condition column to use German ENUM values
ALTER TABLE properties 
MODIFY COLUMN `condition` ENUM(
  'erstbezug',
  'erstbezug_nach_sanierung',
  'neuwertig',
  'saniert',
  'teilsaniert',
  'sanierungsbedürftig',
  'baufällig',
  'modernisiert',
  'vollständig_renoviert',
  'teilweise_renoviert',
  'gepflegt',
  'renovierungsbedürftig',
  'nach_vereinbarung',
  'abbruchreif'
);

SELECT 'Condition ENUM updated successfully!' as status;
