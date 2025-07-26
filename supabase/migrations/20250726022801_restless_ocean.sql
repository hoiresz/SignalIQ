/*
  # Fix User Profiles RLS Policy

  1. Security
    - Drop existing restrictive policies
    - Add proper policies for authenticated users to manage their own profiles
    - Allow INSERT and UPDATE operations for own profile data
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;

-- Create proper INSERT policy
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create proper SELECT policy  
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create proper UPDATE policy
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create proper DELETE policy (optional, for completeness)
CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);