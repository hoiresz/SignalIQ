/*
  # Update ICP profiles for open-ended information

  1. Schema Changes
    - Replace finite selection arrays with open-ended text fields
    - Add company_info and intent_signals fields
    - Keep backward compatibility

  2. New Fields
    - company_info: What products/services they sell
    - target_customers: Who they sell to (open text)
    - intent_signals: How they identify buying intent
    - Remove old finite selection fields
*/

-- Add new open-ended fields to ideal_customer_profiles
ALTER TABLE ideal_customer_profiles 
ADD COLUMN IF NOT EXISTS company_info text DEFAULT '',
ADD COLUMN IF NOT EXISTS target_customers text DEFAULT '',
ADD COLUMN IF NOT EXISTS intent_signals text DEFAULT '';

-- Remove old finite selection fields (optional - can keep for backward compatibility)
-- ALTER TABLE ideal_customer_profiles 
-- DROP COLUMN IF EXISTS company_sizes,
-- DROP COLUMN IF EXISTS funding_stages,
-- DROP COLUMN IF EXISTS locations;

-- Update the titles field to be more descriptive
ALTER TABLE ideal_customer_profiles 
RENAME COLUMN titles TO target_titles;

-- Update the name field default
ALTER TABLE ideal_customer_profiles 
ALTER COLUMN name SET DEFAULT 'My ICP Profile';