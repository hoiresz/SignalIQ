/*
  # Update ICP system for multiple profiles per user

  1. Changes
    - Remove unique constraint on user_id in ideal_customer_profiles
    - Add name field to ideal_customer_profiles for profile naming
    - Add indexes for better performance
    - Update RLS policies

  2. New Structure
    - Users can have multiple ICP profiles
    - Each profile has a name for identification
    - Maintains existing data structure for backward compatibility
*/

-- Remove the unique constraint on user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ideal_customer_profiles_user_id_key' 
    AND table_name = 'ideal_customer_profiles'
  ) THEN
    ALTER TABLE ideal_customer_profiles DROP CONSTRAINT ideal_customer_profiles_user_id_key;
  END IF;
END $$;

-- Add name field to ideal_customer_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideal_customer_profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE ideal_customer_profiles ADD COLUMN name text DEFAULT 'Default Profile';
  END IF;
END $$;

-- Add index for better performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_ideal_customer_profiles_user_name'
  ) THEN
    CREATE INDEX idx_ideal_customer_profiles_user_name ON ideal_customer_profiles(user_id, name);
  END IF;
END $$;

-- Update existing records to have a default name if they don't have one
UPDATE ideal_customer_profiles 
SET name = 'Default Profile' 
WHERE name IS NULL OR name = '';

-- Make name field required
ALTER TABLE ideal_customer_profiles ALTER COLUMN name SET NOT NULL;