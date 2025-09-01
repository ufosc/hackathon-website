/*
  Local export tool for organizers.
  Usage:
    - Create .env with SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
    - Run: npx ts-node scripts/export-registrations.ts
*/

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { createWriteStream } from 'fs'
import { resolve } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Error fetching registrations:', error.message)
    process.exit(1)
  }

  const rows = data ?? []
  const headers = [
    'id','name','email','year','major','experience','dietary_restrictions','linkedin_url','github_url','resume_url','submitted_at'
  ]

  const csvLines = [headers.join(',')]
  for (const row of rows as any[]) {
    const values = headers.map((h) => {
      const v = row[h] ?? ''
      const s = String(v).replaceAll('"', '""')
      return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s
    })
    csvLines.push(values.join(','))
  }

  const outPath = resolve(process.cwd(), 'registrations.csv')
  await new Promise<void>((resolvePromise, reject) => {
    const ws = createWriteStream(outPath, { encoding: 'utf8' })
    ws.on('error', reject)
    ws.on('finish', () => resolvePromise())
    ws.write(csvLines.join('\n'))
    ws.end()
  })

  console.log(`Wrote ${rows.length} registrations to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


