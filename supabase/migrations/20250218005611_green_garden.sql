/*
  # Fix user email lookup function and view

  1. Changes
    - Update function return type to match auth.users email type
    - Recreate view with correct types
    - Update permissions

  2. Security
    - Maintain security definer settings
    - Keep restricted permissions
*/

-- Drop existing objects if they exist
DROP VIEW IF EXISTS auth_user_emails;
DROP FUNCTION IF EXISTS get_user_emails;

-- Create a secure function to get user emails
CREATE OR REPLACE FUNCTION get_user_emails()
RETURNS TABLE (
  profile_id uuid,
  user_id uuid,
  email varchar(255),
  role text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.role() = 'authenticated' THEN
    RETURN QUERY
    SELECT 
      p.id as profile_id,
      p.user_id,
      au.email,
      p.role
    FROM auth.users au
    JOIN profiles p ON p.user_id = au.id;
  END IF;
END;
$$;

-- Create the view using the secure function
CREATE OR REPLACE VIEW auth_user_emails AS
SELECT * FROM get_user_emails();

-- Grant access to authenticated users
GRANT SELECT ON auth_user_emails TO authenticated;

-- Revoke all on the function from public
REVOKE ALL ON FUNCTION get_user_emails() FROM PUBLIC;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_emails() TO authenticated;