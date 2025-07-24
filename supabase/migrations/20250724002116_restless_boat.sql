/*
  # Create lead signals table with ICP association

  1. New Tables
    - `lead_signals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `icp_id` (uuid, foreign key to ideal_customer_profiles)
      - `name` (text, signal name)
      - `description` (text, signal description)
      - `signal_type` (text, ai_generated or custom)
      - `criteria` (jsonb, signal criteria and filters)
      - `is_active` (boolean, whether signal is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `lead_signals` table
    - Add policies for authenticated users to manage their own signals

  3. Indexes
    - Add indexes for user_id, icp_id, and is_active for performance
*/

CREATE TABLE IF NOT EXISTS lead_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  icp_id uuid NOT NULL REFERENCES ideal_customer_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  signal_type text NOT NULL DEFAULT 'custom' CHECK (signal_type IN ('ai_generated', 'custom')),
  criteria jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_signals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own signals"
  ON lead_signals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lead_signals_user_id ON lead_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_signals_icp_id ON lead_signals(icp_id);
CREATE INDEX IF NOT EXISTS idx_lead_signals_active ON lead_signals(is_active);
CREATE INDEX IF NOT EXISTS idx_lead_signals_type ON lead_signals(signal_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_signals_updated_at
  BEFORE UPDATE ON lead_signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();