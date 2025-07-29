/*
  # Add is_active column to lead_signals table

  1. Changes
    - Add `is_active` boolean column to `lead_signals` table
    - Set default value to true for existing records
    - Add index for performance on is_active queries

  2. Security
    - No RLS changes needed as existing policies will cover the new column
*/

-- Add is_active column to lead_signals table
ALTER TABLE lead_signals 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_lead_signals_is_active 
ON lead_signals (is_active);

-- Update any existing records to have is_active = true
UPDATE lead_signals 
SET is_active = true 
WHERE is_active IS NULL;