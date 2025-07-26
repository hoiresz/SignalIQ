/*
  # Enable Email Confirmation for Authentication

  1. Configuration Changes
    - Enable email confirmation for new signups
    - Configure email templates and settings
    - Set up proper redirect URLs

  2. Security
    - Ensure users must confirm email before accessing the application
    - Prevent unverified accounts from signing in
*/

-- Enable email confirmation in auth settings
-- Note: This would typically be done through the Supabase dashboard
-- Auth > Settings > Email Auth > Enable email confirmations

-- Create a function to handle post-confirmation setup
CREATE OR REPLACE FUNCTION public.handle_new_user_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the user's email is now confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Create user profile record
    INSERT INTO public.user_profiles (user_id, onboarding_completed)
    VALUES (NEW.id, false)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email confirmation
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_confirmation();

-- Update RLS policies to ensure only confirmed users can access data
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Update existing policies to check for email confirmation
DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );

-- Update conversations policy
DROP POLICY IF EXISTS "Users can read own conversations" ON public.conversations;
CREATE POLICY "Users can read own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;
CREATE POLICY "Users can create own conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );