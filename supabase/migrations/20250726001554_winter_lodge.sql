/*
  # Update ICP target_region to array type

  1. Schema Changes
    - Convert `target_region` column from text to text array
    - Migrate existing data to array format
    - Update any existing string values to single-item arrays

  2. Data Migration
    - Preserve existing target_region data
    - Convert single strings to arrays
    - Handle null values appropriately
*/

-- First, add a new column with array type
ALTER TABLE ideal_customer_profiles 
ADD COLUMN target_region_new text[] DEFAULT '{}';

-- Migrate existing data - convert single strings to arrays
UPDATE ideal_customer_profiles 
SET target_region_new = CASE 
  WHEN target_region IS NULL OR target_region = '' THEN '{}'::text[]
  ELSE ARRAY[target_region]
END;

-- Drop the old column
ALTER TABLE ideal_customer_profiles 
DROP COLUMN target_region;

-- Rename the new column
ALTER TABLE ideal_customer_profiles 
RENAME COLUMN target_region_new TO target_region;