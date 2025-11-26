-- Revert condition ENUM to English values to match schema.ts
-- This fixes the property saving issue caused by ENUM mismatch

USE dashboard;

-- Modify the condition column to use English ENUM values
ALTER TABLE properties 
MODIFY COLUMN `condition` ENUM(
  'first_time_use',
  'first_time_use_after_refurbishment',
  'mint_condition',
  'refurbished',
  'in_need_of_renovation',
  'by_arrangement'
);

SELECT 'Condition ENUM reverted to English successfully!' as status;
