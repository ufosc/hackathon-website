import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegistrationData {
  name: string
  email: string
  year: string
  major: string
  experience: string
  dietary_restrictions?: string
  linkedin_url?: string
  github_url?: string
  resume_url?: string
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@ufl\.edu$/
  return emailRegex.test(email.trim().toLowerCase())
}

function validateUrl(url: string | undefined, domain: string): boolean {
  if (!url) return true // Optional field
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname.includes(domain) && (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:')
  } catch {
    return false
  }
}

function sanitizeInput(input: string | undefined, maxLength: number): string {
  if (!input) return ''
  return input.trim().substring(0, maxLength).replace(/<[^>]*>/g, '') // Basic HTML tag removal
}

function validateAndSanitizeData(data: any): RegistrationData | { error: string } {
  // Validate required fields
  if (!data.name || !data.email || !data.year || !data.major || !data.experience) {
    return { error: 'Missing required fields' }
  }

  const email = data.email.trim().toLowerCase()
  
  // Validate email domain
  if (!validateEmail(email)) {
    return { error: 'Please use a valid @ufl.edu email address' }
  }

  // Validate enum fields
  const validYears = ['freshman', 'sophomore', 'junior', 'senior']
  const validExperience = ['beginner', 'intermediate', 'advanced']
  
  if (!validYears.includes(data.year)) {
    return { error: 'Invalid academic year' }
  }
  
  if (!validExperience.includes(data.experience)) {
    return { error: 'Invalid experience level' }
  }

  // Validate URLs
  if (!validateUrl(data.linkedin_url, 'linkedin.com')) {
    return { error: 'Invalid LinkedIn URL' }
  }
  
  if (!validateUrl(data.github_url, 'github.com')) {
    return { error: 'Invalid GitHub URL' }
  }

  // Sanitize and return validated data
  return {
    name: sanitizeInput(data.name, 100),
    email: email,
    year: data.year,
    major: sanitizeInput(data.major, 100),
    experience: data.experience,
    dietary_restrictions: data.dietary_restrictions ? sanitizeInput(data.dietary_restrictions, 500) : undefined,
    linkedin_url: data.linkedin_url || undefined,
    github_url: data.github_url || undefined,
    resume_url: data.resume_url || undefined,
  }
}

async function checkRateLimit(supabase: any, ipAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_ip_address: ipAddress,
      p_action: 'registration',
      p_limit: 3,
      p_window_minutes: 60
    })
    
    if (error) {
      console.error('Rate limit check error:', error)
      return true // Allow on error (fail open)
    }
    
    return data === true
  } catch (error) {
    console.error('Rate limit check exception:', error)
    return true // Allow on error (fail open)
  }
}

async function logAuditEvent(supabase: any, action: string, details: any, ipAddress: string, userAgent: string) {
  try {
    await supabase.from('audit_log').insert({
      action,
      table_name: 'registrations',
      ip_address: ipAddress,
      user_agent: userAgent,
      details
    })
  } catch (error) {
    console.error('Audit logging failed:', error)
    // Don't fail the request if audit logging fails
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get client IP address
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    '127.0.0.1'
    
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check rate limit
    const rateLimitOk = await checkRateLimit(supabase, clientIP)
    if (!rateLimitOk) {
      await logAuditEvent(supabase, 'RATE_LIMITED', { ip: clientIP }, clientIP, userAgent)
      return new Response(
        JSON.stringify({ error: 'Too many registration attempts. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestData = await req.json()
    
    // Validate and sanitize data
    const validatedData = validateAndSanitizeData(requestData)
    if ('error' in validatedData) {
      await logAuditEvent(supabase, 'VALIDATION_FAILED', { error: validatedData.error, data: requestData }, clientIP, userAgent)
      return new Response(
        JSON.stringify({ error: validatedData.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check for duplicate email
    const { data: existingRegistration } = await supabase
      .from('registrations')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existingRegistration) {
      await logAuditEvent(supabase, 'DUPLICATE_EMAIL', { email: validatedData.email }, clientIP, userAgent)
      return new Response(
        JSON.stringify({ error: 'An account with this email already exists.' }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Insert registration
    const { data, error } = await supabase
      .from('registrations')
      .insert([{
        ...validatedData,
        submitted_at: new Date().toISOString(),
      }])
      .select()

    if (error) {
      await logAuditEvent(supabase, 'INSERT_FAILED', { error: error.message, data: validatedData }, clientIP, userAgent)
      console.error('Database insert error:', error)
      return new Response(
        JSON.stringify({ error: 'Registration failed. Please try again.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log successful registration
    await logAuditEvent(supabase, 'REGISTRATION_SUCCESS', { 
      registration_id: data[0].id, 
      email: validatedData.email 
    }, clientIP, userAgent)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Registration submitted successfully!',
        id: data[0].id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
