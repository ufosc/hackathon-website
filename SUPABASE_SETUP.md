# Supabase Setup Guide

This guide will help you set up Supabase to store registration data and resume uploads for the hackathon website.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization and enter project details:
   - Name: `hackathon-website` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be ready (usually 1-2 minutes)

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## 3. Create Environment File

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Edit `.env.local` and replace the placeholder values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 4. Create Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste this SQL:

```sql
-- Create registrations table
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  year text not null,
  major text not null,
  experience text not null,
  dietary_restrictions text,
  resume_url text,
  submitted_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.registrations enable row level security;

-- Allow anonymous users to insert registrations
create policy "allow_insert_from_anon"
on public.registrations
for insert
to anon
with check (true);

-- Prevent anonymous users from reading/updating/deleting
create policy "deny_select_update_delete_anon"
on public.registrations
for select using (false);

create policy "deny_update_anon"
on public.registrations
for update using (false);

create policy "deny_delete_anon"
on public.registrations
for delete using (false);
```

4. Click "Run" to execute the SQL

## 5. Create Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Enter bucket details:
   - **Name**: `resumes`
   - **Public bucket**: ✅ **Check this box**
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `application/pdf`
4. Click "Create bucket"

## 6. Set Up Storage Policies

1. In the Storage section, click on your `resumes` bucket
2. Go to the **Policies** tab
3. Click "New Policy"
4. Create these policies:

### Policy 1: Allow anonymous uploads
- **Policy name**: `Allow anonymous uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `anon`
- **Policy definition**:
```sql
bucket_id = 'resumes'
```

### Policy 2: Allow public reads
- **Policy name**: `Allow public reads`
- **Allowed operation**: `SELECT`
- **Target roles**: `anon`
- **Policy definition**:
```sql
bucket_id = 'resumes'
```

## 7. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Go to `http://localhost:3000`
3. Scroll to the registration form
4. Fill out the form and upload a PDF resume
5. Submit the form
6. Check your Supabase dashboard:
   - **Table Editor** → `registrations` table should show the new entry
   - **Storage** → `resumes` bucket should show the uploaded file

## 8. Production Deployment

For GitHub Pages deployment, you'll need to:

1. Add your environment variables as GitHub repository secrets:
   - Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Update your GitHub Actions workflow to use these secrets in the build process

## Troubleshooting

### Common Issues:

1. **"Registration backend not configured"** error:
   - Make sure your `.env.local` file exists and has the correct values
   - Restart your development server after adding environment variables

2. **File upload fails**:
   - Check that the `resumes` bucket exists and is public
   - Verify storage policies allow anonymous uploads
   - Ensure file is under 5MB and is a PDF

3. **Database insert fails**:
   - Check that the `registrations` table exists
   - Verify RLS policies allow anonymous inserts
   - Check the browser console for detailed error messages

### Security Notes:

- The anon key is safe to use in client-side code for this use case
- RLS policies prevent unauthorized access to registration data
- Only authenticated users (with service role key) can read/update/delete registrations
- Resume files are stored publicly but with unique filenames

## Managing Registrations

To view and manage registrations:

1. Go to your Supabase dashboard
2. Navigate to **Table Editor** → `registrations`
3. You can view, filter, and export registration data
4. For bulk operations, use the **SQL Editor**

To download resumes:
1. Go to **Storage** → `resumes` bucket
2. Click on any file to download it
