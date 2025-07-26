/*
  # Add Signal Status Column

  1. Changes
    - Add `status` column to lead_signals table with enum constraint
    - Set default status to 'deployed'
    - Add index for status column for efficient filtering

  2. Status Types
    - deployed: Signal is active and monitoring
    - searching: Signal is currently searching for matches
    - completed: Signal has finished its search cycle
*/

-- Add status column to lead_signals table
ALTER TABLE lead_signals 
ADD COLUMN status text DEFAULT 'deployed' NOT NULL;

-- Add constraint for status values
ALTER TABLE lead_signals 
ADD CONSTRAINT lead_signals_status_check 
CHECK (status IN ('deployed', 'searching', 'completed'));

-- Add index for status column
CREATE INDEX idx_lead_signals_status ON lead_signals(status);

-- Update existing records to have deployed status
UPDATE lead_signals SET status = 'deployed' WHERE status IS NULL;