-- Security Setup for Hackathon Registration
-- Run this in your Supabase SQL Editor

-- 1. Add email domain constraint (server-side validation)
ALTER TABLE registrations 
ADD CONSTRAINT check_ufl_email 
CHECK (email LIKE '%@ufl.edu');

-- 2. Add input length constraints
ALTER TABLE registrations 
ADD CONSTRAINT check_name_length CHECK (char_length(name) <= 100 AND char_length(name) > 0);

ALTER TABLE registrations 
ADD CONSTRAINT check_major_length CHECK (char_length(major) <= 100 AND char_length(major) > 0);

ALTER TABLE registrations 
ADD CONSTRAINT check_dietary_restrictions_length 
CHECK (dietary_restrictions IS NULL OR char_length(dietary_restrictions) <= 500);

-- 3. Add valid year constraint
ALTER TABLE registrations 
ADD CONSTRAINT check_valid_year 
CHECK (year IN ('freshman', 'sophomore', 'junior', 'senior'));

-- 4. Add valid experience constraint
ALTER TABLE registrations 
ADD CONSTRAINT check_valid_experience 
CHECK (experience IN ('beginner', 'intermediate', 'advanced'));

-- 5. Add URL validation for LinkedIn and GitHub (basic check)
ALTER TABLE registrations 
ADD CONSTRAINT check_linkedin_url 
CHECK (linkedin_url IS NULL OR linkedin_url ~ '^https?://.*linkedin\.com/.*$');

ALTER TABLE registrations 
ADD CONSTRAINT check_github_url 
CHECK (github_url IS NULL OR github_url ~ '^https?://.*github\.com/.*$');

-- 6. Prevent duplicate email registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_email_unique 
ON registrations (email);

-- 7. Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text,
  record_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can read audit logs
CREATE POLICY "Service role only" ON audit_log
FOR ALL USING (auth.role() = 'service_role');

-- 8. Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  action text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on rate limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY "Service role only rate limits" ON rate_limits
FOR ALL USING (auth.role() = 'service_role');

-- Create index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_action_window 
ON rate_limits (ip_address, action, window_start);

-- 9. Update storage policies for better security
-- First, let's make sure we have proper file validation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Create secure upload policy with file validation
CREATE POLICY "Secure anonymous uploads" ON storage.objects
FOR INSERT 
TO anon
WITH CHECK (
  bucket_id = 'resumes' 
  AND LOWER(RIGHT(name, 4)) = '.pdf'
);

-- Allow public reads for resumes (needed for admin to view)
CREATE POLICY "Allow public resume reads" ON storage.objects
FOR SELECT 
TO anon, authenticated
USING (bucket_id = 'resumes');

-- 10. Add function to clean up old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- 11. Add trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_registration_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (action, table_name, record_id, details)
    VALUES ('INSERT', 'registrations', NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for registration inserts
DROP TRIGGER IF EXISTS audit_registration_insert ON registrations;
CREATE TRIGGER audit_registration_insert
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION audit_registration_changes();

-- 12. Create function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address inet,
  p_action text,
  p_limit integer DEFAULT 3,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  current_count integer;
  window_start timestamptz;
BEGIN
  window_start := NOW() - (p_window_minutes || ' minutes')::interval;
  
  -- Clean up old entries for this IP and action
  DELETE FROM rate_limits 
  WHERE ip_address = p_ip_address 
    AND action = p_action 
    AND window_start < window_start;
  
  -- Get current count
  SELECT COALESCE(SUM(count), 0) INTO current_count
  FROM rate_limits
  WHERE ip_address = p_ip_address 
    AND action = p_action 
    AND window_start >= window_start;
  
  -- If under limit, increment counter
  IF current_count < p_limit THEN
    INSERT INTO rate_limits (ip_address, action, window_start)
    VALUES (p_ip_address, p_action, NOW())
    ON CONFLICT (ip_address, action) 
    DO UPDATE SET count = rate_limits.count + 1, window_start = NOW();
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

COMMENT ON TABLE registrations IS 'Hackathon registration data with security constraints';
COMMENT ON TABLE audit_log IS 'Security audit trail for all registration activities';
COMMENT ON TABLE rate_limits IS 'Rate limiting data to prevent spam and abuse';
