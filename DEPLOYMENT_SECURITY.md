# Security Implementation Deployment Guide

## Overview
This guide implements comprehensive security measures for the hackathon registration system, including server-side validation, rate limiting, input sanitization, and audit logging.

## 1. Database Security Setup

### Step 1: Run Database Constraints
Execute `supabase-security-setup.sql` in your Supabase SQL Editor:

```bash
# Copy the contents of supabase-security-setup.sql and paste into Supabase SQL Editor
# Click "Run" to execute all security constraints and tables
```

This creates:
- Email domain validation (`@ufl.edu` required)
- Input length constraints
- Valid enum constraints for year/experience
- URL validation for LinkedIn/GitHub
- Unique email constraint
- Audit logging table
- Rate limiting table
- Security functions

### Step 2: Verify Constraints
Check that constraints were created:
```sql
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'registrations'::regclass;
```

## 2. Deploy Edge Function

### Step 1: Install Supabase CLI
```bash

supabase login
```

### Step 2: Link to Your Project
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### Step 3: Deploy the Function
```bash
# Deploy the secure registration function
supabase functions deploy register

# Set environment variables for the function
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Test the Function
```bash
# Test the function locally first
supabase functions serve register

# Test with curl
curl -X POST 'http://localhost:54321/functions/v1/register' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "email": "test@ufl.edu",
    "year": "senior",
    "major": "Computer Science",
    "experience": "intermediate"
  }'
```

## 3. Update Storage Policies

### Step 1: Update Storage Security
Run in Supabase SQL Editor:
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Create secure policies
CREATE POLICY "Secure anonymous uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'resumes' 
  AND LOWER(RIGHT(name, 4)) = '.pdf'
  AND octet_length(content) <= 5242880 -- 5MB
);

CREATE POLICY "Allow public resume reads" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'resumes');
```

## 4. Environment Variables

### Required Environment Variables:
```bash
# .env.local for development
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=your_strong_admin_password_32chars_min
```

### For Production (GitHub Pages):
Add these as GitHub repository secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

## 5. Testing Security Implementation

### Test 1: Email Validation
Try registering with non-UFL email - should fail at database level.

### Test 2: Rate Limiting
Submit 4 registrations quickly from same IP - 4th should fail.

### Test 3: Input Validation
Try submitting with:
- Name > 100 characters
- Invalid LinkedIn/GitHub URLs
- Invalid year/experience values

### Test 4: File Upload Security
Try uploading:
- Non-PDF file
- File > 5MB
- File with malicious name

### Test 5: Duplicate Prevention
Try registering same email twice - should fail.

## 6. Monitoring and Maintenance

### Check Audit Logs
```sql
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50;
```

### Monitor Rate Limits
```sql
SELECT ip_address, action, count, window_start 
FROM rate_limits 
WHERE window_start > NOW() - INTERVAL '1 hour';
```

### Clean Up Old Data
```sql
-- Run periodically to clean up old rate limit entries
SELECT cleanup_rate_limits();
```

## 7. Security Checklist

- [ ] Database constraints applied
- [ ] Edge function deployed
- [ ] Storage policies updated
- [ ] Environment variables set
- [ ] Rate limiting tested
- [ ] Input validation tested
- [ ] File upload security tested
- [ ] Audit logging working
- [ ] CSP headers configured
- [ ] Strong admin password set

## 8. Troubleshooting

### Function Deployment Issues:
```bash
# Check function logs
supabase functions logs register

# Redeploy if needed
supabase functions deploy register --no-verify-jwt
```

### Database Constraint Violations:
Check the specific constraint that failed:
```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'registrations'::regclass;
```

### Rate Limiting Not Working:
Verify the rate limit function exists:
```sql
SELECT proname FROM pg_proc WHERE proname = 'check_rate_limit';
```

## 9. Performance Considerations

- Rate limit cleanup runs automatically via the Edge Function
- Audit logs should be archived/cleaned periodically for large events
- Consider adding indexes if you expect >1000 registrations:

```sql
CREATE INDEX IF NOT EXISTS idx_registrations_submitted_at ON registrations (submitted_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at);
```

## 10. Security Monitoring Alerts

Set up Supabase alerts for:
- High registration volume (>50/hour)
- Rate limit violations (>10/hour)
- Database constraint violations
- Edge function errors

The system is now production-ready with enterprise-level security measures appropriate for a university hackathon.
