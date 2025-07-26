/*
  # Remove unnecessary signal fields

  1. Changes
    - Remove `is_active` column from lead_signals table
    - Remove `signal_type` column from lead_signals table
    - Update any indexes that reference these columns

  2. Security
    - No security changes needed as we're just removing columns
*/

-- Remove the is_active column
ALTER TABLE lead_signals DROP COLUMN IF EXISTS is_active;

-- Remove the signal_type column  
ALTER TABLE lead_signals DROP COLUMN IF EXISTS signal_type;

-- Drop any indexes that might reference these columns
DROP INDEX IF EXISTS idx_lead_signals_active;
DROP INDEX IF EXISTS idx_lead_signals_type;