<div align="center">
<h1>hackathon-website</h1>

<!-- <img src="https://github.com/user-attachments/assets/69302e62-b454-4a84-906e-3a176fa347f3" width="100%" height="90%" /> -->

Website for the UF Open Source Club Minihack.

September 2025 
</div>

## Install
Clone the repository (requires [git](https://git-scm.com/)):
```
git clone https://github.com/ufosc/hackathon-website.git
```

Navigate to the project directory and install the project dependencies (requires [Node.js](https://nodejs.org/en)):
```
cd hackathon-website
npm install --force
```
## Usage
<b>Starting the development server:</b>
```
npm run dev
```
You may access the website at http://localhost:3000

<b>Building for production:</b>
```
npm run build
```

## Registration storage (Supabase)

This site can save registrations and resumes using Supabase (works on static hosting like GitHub Pages).

1. Create a Supabase project and get the anon key and URL.
2. Create storage bucket `resumes` and make it public.
3. Create table `registrations` with columns:
   - `id` uuid default gen_random_uuid() primary key
   - `name` text not null
   - `email` text not null
   - `year` text not null
   - `major` text not null
   - `experience` text not null
   - `dietary_restrictions` text
   - `linkedin_url` text
   - `github_url` text
   - `resume_url` text
   - `submitted_at` timestamptz default now()

4. Add env vars (for local dev create `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For GitHub Pages, add these as repository secrets and expose them in your build.

<b>Publishing to GitHub Pages</b>

To publish to GitHub pages, make sure that your account has permission to push directly to the repository's branches (i.e. you've been invited as a contributor). Then, run the following command to build and deploy the website:
```
npm run build-and-deploy
```
When the website is deployed, GitHub tends to automatically change the website's domain. If this occurs, navigate to `Settings > Pages` and set the custom domain to `hack.ufosc.org`.

## License
[AGPL-3.0-or-later](LICENSE) <br/>
Copyright (C) 2025 Open Source Club

## Export registrations to CSV (local-only)

For organizer use only. Create `.env` in the project root with:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_project_url
```

Then run:
```
npx ts-node scripts/export-registrations.ts
```

This writes `registrations.csv` to the project root. Never commit your service role key.

## Admin page (view registrations in browser)

1. Add these env vars (local `.env.local`, and on your host/secrets):
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASSWORD=choose_a_strong_password
```

2. Visit `/admin` and sign in with the `ADMIN_PASSWORD`.

Notes:
- The `/api/admin/registrations` route requires the `x-admin-key` header matching `ADMIN_PASSWORD` and uses the service role key server-side to fetch data.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` out of client code and version control.
