"use client"

import { useEffect, useMemo, useState } from "react"

type Registration = {
  id: string
  name: string
  email: string
  year: string
  major: string
  experience: string
  dietary_restrictions: string | null
  resume_url: string | null
  linkedin_url: string | null
  github_url: string | null
  submitted_at: string
}

export default function AdminPage() {
  const [passwordInput, setPasswordInput] = useState("")
  const [storedKey, setStoredKey] = useState<string | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<keyof Registration>("submitted_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const k = localStorage.getItem("adminKey")
    if (k) setStoredKey(k)
  }, [])

  const isAuthed = Boolean(storedKey)

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    // Test auth by hitting the API
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/admin/registrations", {
        headers: { "x-admin-key": passwordInput },
      })
      if (res.status === 401) {
        setError("Incorrect password")
        return
      }
      if (!res.ok) {
        setError("Error validating password")
        return
      }
      localStorage.setItem("adminKey", passwordInput)
      setStoredKey(passwordInput)
    } finally {
      setLoading(false)
    }
  }

  async function loadData() {
    if (!storedKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/registrations", {
        headers: { "x-admin-key": storedKey },
      })
      if (!res.ok) {
        throw new Error(`Failed to load (${res.status})`)
      }
      const json = await res.json()
      setRegistrations(json.registrations as Registration[])
    } catch (err: any) {
      setError(err?.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (storedKey) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedKey])

  function signOut() {
    localStorage.removeItem("adminKey")
    setStoredKey(null)
    setRegistrations([])
  }

  function toggleSort(col: keyof Registration) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const rows = q
      ? registrations.filter((r) =>
          [r.name, r.email, r.major, r.year, r.experience]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        )
      : registrations
    const sorted = [...rows].sort((a, b) => {
      const va = String(a[sortBy] ?? "")
      const vb = String(b[sortBy] ?? "")
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return sorted
  }, [registrations, query, sortBy, sortDir])

  async function downloadCsv() {
    if (!storedKey) return
    const res = await fetch('/api/admin/registrations?format=csv', {
      headers: { 'x-admin-key': storedKey }
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'registrations.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (!isAuthed) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 bg-white rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-4">Admin Sign In</h1>
        <form onSubmit={signIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Admin Password</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2646]"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1C2646] text-white py-2 rounded-md disabled:opacity-60"
          >
            {loading ? 'Checking…' : 'Sign In'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Registrations</h1>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, major…"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <button onClick={loadData} className="px-3 py-2 bg-gray-200 rounded">Refresh</button>
          <button onClick={downloadCsv} className="px-3 py-2 bg-gray-200 rounded">Download CSV</button>
          <button onClick={signOut} className="px-3 py-2 bg-red-600 text-white rounded">Sign Out</button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="overflow-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {['submitted_at','name','email','year','major','experience','dietary_restrictions','linkedin_url','github_url','resume_url'].map((col) => (
                <th key={col} className="px-4 py-3 cursor-pointer" onClick={() => toggleSort(col as keyof Registration)}>
                  {col}
                  {sortBy === col && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-3" colSpan={10}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-3" colSpan={10}>No registrations yet.</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(r.submitted_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">{r.year}</td>
                  <td className="px-4 py-3">{r.major}</td>
                  <td className="px-4 py-3">{r.experience}</td>
                  <td className="px-4 py-3">{r.dietary_restrictions ?? ''}</td>
                  <td className="px-4 py-3">
                    {r.linkedin_url ? <a className="text-blue-700 underline" href={r.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a> : ''}
                  </td>
                  <td className="px-4 py-3">
                    {r.github_url ? <a className="text-blue-700 underline" href={r.github_url} target="_blank" rel="noreferrer">GitHub</a> : ''}
                  </td>
                  <td className="px-4 py-3">
                    {r.resume_url ? <a className="text-blue-700 underline" href={r.resume_url} target="_blank" rel="noreferrer">Resume</a> : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


