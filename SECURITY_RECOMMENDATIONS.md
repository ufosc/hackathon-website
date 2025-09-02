# Security Recommendations for Hackathon Registration

## Immediate High-Priority Fixes

### 1. Server-Side Email Validation
Add a Supabase Edge Function or database constraint to enforce @ufl.edu emails:

```sql
-- Add email domain constraint
ALTER TABLE registrations 
ADD CONSTRAINT check_ufl_email 
CHECK (email LIKE '%@ufl.edu');
```

### 2. Rate Limiting
Implement per-IP rate limiting using Supabase Edge Functions:
- Max 3 registrations per IP per hour
- Max 1 registration per email address

### 3. File Upload Security
```sql
-- Create storage policy with file type validation
CREATE POLICY "Restrict file uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'resumes'
  AND LOWER(storage.extension(name)) = 'pdf'
  AND octet_length(decode(encode(metadata, 'escape'), 'escape')) < 5242880 -- 5MB
);
```

### 4. Input Sanitization
Add server-side validation in a Supabase Edge Function:

```typescript
// Validate and sanitize inputs
const validateRegistration = (data: any) => {
  return {
    name: data.name?.trim().substring(0, 100) || '',
    email: data.email?.trim().toLowerCase() || '',
    year: ['freshman', 'sophomore', 'junior', 'senior'].includes(data.year) ? data.year : '',
    major: data.major?.trim().substring(0, 100) || '',
    experience: ['beginner', 'intermediate', 'advanced'].includes(data.experience) ? data.experience : '',
    dietary_restrictions: data.dietary_restrictions?.trim().substring(0, 500) || null,
    linkedin_url: isValidUrl(data.linkedin_url) ? data.linkedin_url : null,
    github_url: isValidUrl(data.github_url) ? data.github_url : null
  }
}
```

## Medium-Priority Security Improvements

### 5. Enhanced Admin Authentication
Replace simple password with proper session management:
- Use Supabase Auth for admin login
- Implement JWT tokens with expiration
- Add 2FA for admin accounts

### 6. CSRF Protection
Add CSRF tokens to admin actions:
```typescript
// Generate CSRF token on admin login
const csrfToken = crypto.randomUUID()
// Validate on each admin API call
```

### 7. Content Security Policy
Add CSP headers to prevent XSS:
```typescript
// In next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
]
```

### 8. File Access Control
Make resume storage private and add signed URLs:
```sql
-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'resumes';

-- Create policy for signed URL access only
CREATE POLICY "Admin access only" ON storage.objects
FOR SELECT USING (bucket_id = 'resumes' AND auth.role() = 'service_role');
```

## Low-Priority Hardening

### 9. Audit Logging
Log all admin actions and registration attempts:
```sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  user_id text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
```

### 10. Environment Hardening
- Use strong `ADMIN_PASSWORD` (32+ chars, mixed case, numbers, symbols)
- Rotate Supabase service role key regularly
- Enable Supabase project-level security features

## Implementation Priority

**Week 1 (Critical):**
- Server-side email validation
- Basic rate limiting
- File upload restrictions
- Input sanitization

**Week 2 (Important):**
- Enhanced admin auth
- CSRF protection
- Private file storage

**Week 3 (Nice-to-have):**
- Audit logging
- CSP headers
- Advanced monitoring

## Quick Wins You Can Implement Now

1. **Add email constraint to database** (5 minutes)
2. **Limit file size in storage policy** (10 minutes)  
3. **Add input length limits in form validation** (15 minutes)
4. **Use a strong admin password** (2 minutes)

## Monitoring & Detection

Set up alerts for:
- Unusual registration volumes
- Failed admin login attempts
- Large file uploads
- Suspicious email patterns

The current setup is adequate for a small hackathon but needs hardening for production use.
