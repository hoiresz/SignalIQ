/*
  # Update Lead Tables with Table Type and Default Columns

  1. Schema Changes
    - Add `table_type` column to lead_tables (companies, people, custom)
    - Add `default_columns` JSONB column for storing column definitions
    - Add proper constraints and indexes

  2. Data Migration
    - Set default table_type to 'companies' for existing tables
    - Initialize default_columns with basic structure

  3. Indexes
    - Add index on table_type for efficient filtering
    - Add GIN index on default_columns for JSONB queries
*/

-- Add table_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_tables' AND column_name = 'table_type'
  ) THEN
    ALTER TABLE lead_tables ADD COLUMN table_type text DEFAULT 'companies';
  END IF;
END $$;

-- Add default_columns column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_tables' AND column_name = 'default_columns'
  ) THEN
    ALTER TABLE lead_tables ADD COLUMN default_columns jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add table_type constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'lead_tables_table_type_check'
  ) THEN
    ALTER TABLE lead_tables ADD CONSTRAINT lead_tables_table_type_check 
    CHECK (table_type IN ('companies', 'people', 'custom'));
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lead_tables_type ON lead_tables(table_type);
CREATE INDEX IF NOT EXISTS idx_lead_tables_default_columns ON lead_tables USING gin(default_columns);
CREATE INDEX IF NOT EXISTS idx_lead_tables_type_user ON lead_tables(table_type, user_id);

-- Update existing tables with default columns based on type
UPDATE lead_tables 
SET default_columns = '[
  {"name": "Company Name", "type": "text", "order": 0},
  {"name": "Website", "type": "text", "order": 1},
  {"name": "Description", "type": "text", "order": 2}
]'::jsonb
WHERE table_type = 'companies' AND default_columns = '[]'::jsonb;

UPDATE lead_tables 
SET default_columns = '[
  {"name": "Name", "type": "text", "order": 0},
  {"name": "Job Title", "type": "text", "order": 1},
  {"name": "Company", "type": "text", "order": 2}
]'::jsonb
WHERE table_type = 'people' AND default_columns = '[]'::jsonb;

UPDATE lead_tables 
SET default_columns = '[
  {"name": "Name", "type": "text", "order": 0},
  {"name": "Description", "type": "text", "order": 1},
  {"name": "URL", "type": "text", "order": 2}
]'::jsonb
WHERE table_type = 'custom' AND default_columns = '[]'::jsonb;