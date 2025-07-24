/*
  # Create flexible lead system with dynamic tables

  1. New Tables
    - `lead_tables` - Named collections of leads per conversation
    - `lead_rows` - Individual lead entities (companies/people)
    - `lead_columns` - Dynamic column definitions with types
    - `lead_cells` - Actual data values for each row/column intersection

  2. Updated Tables
    - `conversations` - Add reference to lead_table_id
    - `messages` - Store chat history with metadata

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Ensure proper data isolation between users

  4. Indexes
    - Add performance indexes for common queries
    - Foreign key relationships for data integrity
*/

-- Create lead_tables
CREATE TABLE IF NOT EXISTS lead_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lead_rows
CREATE TABLE IF NOT EXISTS lead_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_table_id uuid REFERENCES lead_tables(id) ON DELETE CASCADE NOT NULL,
  entity_type text DEFAULT 'company' CHECK (entity_type IN ('company', 'person')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lead_columns
CREATE TABLE IF NOT EXISTS lead_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_table_id uuid REFERENCES lead_tables(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  column_type text DEFAULT 'text',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create lead_cells
CREATE TABLE IF NOT EXISTS lead_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id uuid REFERENCES lead_rows(id) ON DELETE CASCADE NOT NULL,
  column_id uuid REFERENCES lead_columns(id) ON DELETE CASCADE NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add lead_table_id to conversations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'lead_table_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN lead_table_id uuid REFERENCES lead_tables(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE lead_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_cells ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Lead tables policies
  DROP POLICY IF EXISTS "Users can manage own lead tables" ON lead_tables;
  CREATE POLICY "Users can manage own lead tables"
    ON lead_tables FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

  -- Lead rows policies
  DROP POLICY IF EXISTS "Users can manage rows in own tables" ON lead_rows;
  CREATE POLICY "Users can manage rows in own tables"
    ON lead_rows FOR ALL
    TO authenticated
    USING (lead_table_id IN (
      SELECT id FROM lead_tables WHERE user_id = auth.uid()
    ))
    WITH CHECK (lead_table_id IN (
      SELECT id FROM lead_tables WHERE user_id = auth.uid()
    ));

  -- Lead columns policies
  DROP POLICY IF EXISTS "Users can manage columns in own tables" ON lead_columns;
  CREATE POLICY "Users can manage columns in own tables"
    ON lead_columns FOR ALL
    TO authenticated
    USING (lead_table_id IN (
      SELECT id FROM lead_tables WHERE user_id = auth.uid()
    ))
    WITH CHECK (lead_table_id IN (
      SELECT id FROM lead_tables WHERE user_id = auth.uid()
    ));

  -- Lead cells policies
  DROP POLICY IF EXISTS "Users can manage cells in own tables" ON lead_cells;
  CREATE POLICY "Users can manage cells in own tables"
    ON lead_cells FOR ALL
    TO authenticated
    USING (row_id IN (
      SELECT lr.id FROM lead_rows lr
      JOIN lead_tables lt ON lr.lead_table_id = lt.id
      WHERE lt.user_id = auth.uid()
    ))
    WITH CHECK (row_id IN (
      SELECT lr.id FROM lead_rows lr
      JOIN lead_tables lt ON lr.lead_table_id = lt.id
      WHERE lt.user_id = auth.uid()
    ));

  -- Messages policies (handle existing policy)
  DROP POLICY IF EXISTS "Users can create messages in own conversations" ON messages;
  CREATE POLICY "Users can create messages in own conversations"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    ));

  DROP POLICY IF EXISTS "Users can read messages from own conversations" ON messages;
  CREATE POLICY "Users can read messages from own conversations"
    ON messages FOR SELECT
    TO authenticated
    USING (conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    ));

  -- Leads policies (handle existing policies)
  DROP POLICY IF EXISTS "Users can create leads in own conversations" ON leads;
  DROP POLICY IF EXISTS "Users can read leads from own conversations" ON leads;
  DROP POLICY IF EXISTS "Users can update leads in own conversations" ON leads;
  DROP POLICY IF EXISTS "Users can delete leads from own conversations" ON leads;

  CREATE POLICY "Users can create leads in own conversations"
    ON leads FOR INSERT
    TO authenticated
    WITH CHECK (conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    ));

  CREATE POLICY "Users can read leads from own conversations"
    ON leads FOR SELECT
    TO authenticated
    USING (conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    ));

  CREATE POLICY "Users can update leads in own conversations"
    ON leads FOR UPDATE
    TO authenticated
    USING (conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    ));

  CREATE POLICY "Users can delete leads from own conversations"
    ON leads FOR DELETE
    TO authenticated
    USING (conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    ));
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_tables_user_id ON lead_tables(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_tables_conversation_id ON lead_tables(conversation_id);
CREATE INDEX IF NOT EXISTS idx_lead_rows_table_id ON lead_rows(lead_table_id);
CREATE INDEX IF NOT EXISTS idx_lead_columns_table_id ON lead_columns(lead_table_id);
CREATE INDEX IF NOT EXISTS idx_lead_columns_display_order ON lead_columns(lead_table_id, display_order);
CREATE INDEX IF NOT EXISTS idx_lead_cells_row_id ON lead_cells(row_id);
CREATE INDEX IF NOT EXISTS idx_lead_cells_column_id ON lead_cells(column_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_table_id ON conversations(lead_table_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_lead_tables_updated_at ON lead_tables;
CREATE TRIGGER update_lead_tables_updated_at
  BEFORE UPDATE ON lead_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_rows_updated_at ON lead_rows;
CREATE TRIGGER update_lead_rows_updated_at
  BEFORE UPDATE ON lead_rows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_cells_updated_at ON lead_cells;
CREATE TRIGGER update_lead_cells_updated_at
  BEFORE UPDATE ON lead_cells
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();