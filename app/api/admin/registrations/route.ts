export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

function toCsv(rows: any[]): string {
  const headers = [
    'id','name','email','year','major','experience','dietary_restrictions','linkedin_url','github_url','resume_url','submitted_at'
  ]
  const csvLines = [headers.join(',')]
  for (const row of rows) {
    const values = headers.map((h) => {
      const raw = row[h] ?? ''
      const s = String(raw).replaceAll('"', '""')
      return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s
    })
    csvLines.push(values.join(','))
  }
  return csvLines.join('\n')
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const format = url.searchParams.get('format')
    const providedKey = request.headers.get('x-admin-key') ?? ''

    const adminPassword = requireEnv('ADMIN_PASSWORD')
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    if (providedKey !== adminPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = data ?? []

    if (format === 'csv') {
      const csv = toCsv(rows)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="registrations.csv"'
        },
      })
    }

    return NextResponse.json({ registrations: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}


