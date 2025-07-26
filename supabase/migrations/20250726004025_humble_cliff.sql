/*
# Update Lead Tables with Default Columns Support

This migration adds support for storing default column configurations in lead tables
and ensures proper structure for the enrichment-based table creation flow.

## Changes Made

1. **Updated lead_tables table**
   - Ensured default_columns is properly configured as JSONB
   - Added proper indexing for table_type queries

2. **Sample Data Updates**
   - Updated existing tables to include proper default_columns structure
   - Ensured consistency with new enrichment-based approach

## Schema Updates

- default_columns: JSONB array storing column definitions with name, type, and order
- table_type: Enum supporting 'companies', 'people', 'custom'
- Proper foreign key relationships maintained
*/

-- Ensure default_columns has proper default value
ALTER TABLE lead_tables 
ALTER COLUMN default_columns SET DEFAULT '[]'::jsonb;

-- Update existing tables to have proper default_columns structure
UPDATE lead_tables 
SET default_columns = CASE 
  WHEN table_type = 'companies' THEN 
    '[
      {"name": "Company Name", "type": "text", "order": 0},
      {"name": "Website", "type": "text", "order": 1},
      {"name": "Description", "type": "text", "order": 2},
      {"name": "Industry", "type": "text", "order": 3},
      {"name": "Location", "type": "text", "order": 4}
    ]'::jsonb
  WHEN table_type = 'people' THEN 
    '[
      {"name": "Name", "type": "text", "order": 0},
      {"name": "Job Title", "type": "text", "order": 1},
      {"name": "Company", "type": "text", "order": 2},
      {"name": "LinkedIn", "type": "text", "order": 3},
      {"name": "Email", "type": "text", "order": 4}
    ]'::jsonb
  ELSE 
    '[
      {"name": "Name", "type": "text", "order": 0},
      {"name": "Description", "type": "text", "order": 1},
      {"name": "URL", "type": "text", "order": 2}
    ]'::jsonb
END
WHERE default_columns = '[]'::jsonb OR default_columns IS NULL;

-- Add index for better performance on table_type queries
CREATE INDEX IF NOT EXISTS idx_lead_tables_type_user 
ON lead_tables(table_type, user_id);

-- Add index for default_columns JSONB queries
CREATE INDEX IF NOT EXISTS idx_lead_tables_default_columns 
ON lead_tables USING GIN (default_columns);