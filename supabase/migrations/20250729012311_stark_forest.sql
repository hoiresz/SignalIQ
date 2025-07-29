/*
  # Add signal_type column to lead_signals table

  1. Changes
    - Add signal_type enum type with 'AI_GENERATED' and 'CUSTOM' values
    - Add signal_type column to lead_signals table with default 'AI_GENERATED'
    - Add index on signal_type column for performance

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

-- Create the signal type enum
DO $$ BEGIN
    CREATE TYPE signaltype AS ENUM ('AI_GENERATED', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add signal_type column to lead_signals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_signals' AND column_name = 'signal_type'
  ) THEN
    ALTER TABLE lead_signals ADD COLUMN signal_type signaltype DEFAULT 'AI_GENERATED'::signaltype NOT NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_lead_signals_signal_type ON lead_signals(signal_type);