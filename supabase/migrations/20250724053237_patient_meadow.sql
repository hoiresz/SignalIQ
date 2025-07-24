/*
  # Update Ideal Customer Profiles Schema

  1. Schema Changes
    - Add `solution_products` column (text)
    - Add `target_region` column (text) 
    - Add `company_sizes` column (text array)
    - Add `funding_stages` column (text array)
    - Add `locations` column (text array)
    - Rename `target_titles` to `titles` for consistency

  2. Data Migration
    - Preserve existing data where possible
    - Set sensible defaults for new columns

  3. Security
    - Maintain existing RLS policies
*/

-- Add missing columns to ideal_customer_profiles table
DO $$
BEGIN
  -- Add solution_products column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideal_customer_profiles' AND column_name = 'solution_products'
  ) THEN
    ALTER TABLE ideal_customer_profiles ADD COLUMN solution_products text DEFAULT '';
  END IF;

  -- Add target_region column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideal_customer_profiles' AND column_name = 'target_region'
  ) THEN
    ALTER TABLE ideal_customer_profiles ADD COLUMN target_region text DEFAULT '';
  END IF;

  -- Add company_sizes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideal_customer_profiles' AND column_name = 'company_sizes'
  ) THEN
    ALTER TABLE ideal_customer_profiles ADD COLUMN company_sizes text[] DEFAULT '{}';
  END IF;

  -- Add funding_stages column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideal_customer_profiles' AND column_name = 'funding_stages'
  ) THEN
    ALTER TABLE ideal_customer_profiles ADD COLUMN funding_stages text[] DEFAULT '{}';
  END IF;

  -- Add locations column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideal_customer_profiles' AND column_name = 'locations'
  ) THEN
    ALTER TABLE ideal_customer_profiles ADD COLUMN locations text[] DEFAULT '{}';
  END IF;

  -- Rename target_titles to titles if target_titles exists and titles doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideal_customer_profiles' AND column_name = 'target_titles'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideal_customer_profiles' AND column_name = 'titles'
  ) THEN
    ALTER TABLE ideal_customer_profiles RENAME COLUMN target_titles TO titles;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ideal_customer_profiles' AND column_name = 'titles'
  ) THEN
    ALTER TABLE ideal_customer_profiles ADD COLUMN titles text DEFAULT '';
  END IF;
END $$;