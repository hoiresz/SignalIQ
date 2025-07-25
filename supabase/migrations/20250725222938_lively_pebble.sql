/*
  # Remove conversation dependency from leads tables

  1. Schema Changes
    - Remove conversation_id from lead_tables (make nullable first, then remove)
    - Update foreign key constraints
    - Update RLS policies to work without conversations
    
  2. Data Migration
    - Preserve existing lead_tables by removing conversation dependency
    - Update policies for direct user access
    
  3. Cleanup
    - Remove unused foreign key constraints
    - Update indexes
*/

-- Step 1: Make conversation_id nullable in lead_tables
ALTER TABLE lead_tables ALTER COLUMN conversation_id DROP NOT NULL;

-- Step 2: Drop the foreign key constraint
ALTER TABLE lead_tables DROP CONSTRAINT IF EXISTS lead_tables_conversation_id_fkey;

-- Step 3: Drop the index on conversation_id
DROP INDEX IF EXISTS idx_lead_tables_conversation_id;

-- Step 4: Remove conversation_id from conversations table (we'll keep it for now but make it optional)
ALTER TABLE conversations ALTER COLUMN lead_table_id DROP NOT NULL;

-- Step 5: Update RLS policies for lead_tables to work without conversations
DROP POLICY IF EXISTS "Users can manage own lead tables" ON lead_tables;

CREATE POLICY "Users can manage own lead tables"
  ON lead_tables
  FOR ALL
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

-- Step 6: Ensure all related tables have proper policies
DROP POLICY IF EXISTS "Users can manage rows in own tables" ON lead_rows;
CREATE POLICY "Users can manage rows in own tables"
  ON lead_rows
  FOR ALL
  TO authenticated
  USING (lead_table_id IN (
    SELECT id FROM lead_tables WHERE user_id = uid()
  ))
  WITH CHECK (lead_table_id IN (
    SELECT id FROM lead_tables WHERE user_id = uid()
  ));

DROP POLICY IF EXISTS "Users can manage columns in own tables" ON lead_columns;
CREATE POLICY "Users can manage columns in own tables"
  ON lead_columns
  FOR ALL
  TO authenticated
  USING (lead_table_id IN (
    SELECT id FROM lead_tables WHERE user_id = uid()
  ))
  WITH CHECK (lead_table_id IN (
    SELECT id FROM lead_tables WHERE user_id = uid()
  ));

DROP POLICY IF EXISTS "Users can manage cells in own tables" ON lead_cells;
CREATE POLICY "Users can manage cells in own tables"
  ON lead_cells
  FOR ALL
  TO authenticated
  USING (row_id IN (
    SELECT lr.id FROM lead_rows lr
    JOIN lead_tables lt ON lr.lead_table_id = lt.id
    WHERE lt.user_id = uid()
  ))
  WITH CHECK (row_id IN (
    SELECT lr.id FROM lead_rows lr
    JOIN lead_tables lt ON lr.lead_table_id = lt.id
    WHERE lt.user_id = uid()
  ));