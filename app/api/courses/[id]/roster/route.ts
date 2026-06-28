import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Service-role key, not the anon/publishable key: public.enrollments/students only
// grant RLS access to the "authenticated" role, and this route never forwards a
// real user JWT to PostgREST (it auths the caller separately via requireAuth()
// below). The anon key would get silently empty-result'ed by RLS instead of erroring.
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY!

async function supabaseGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: 'no-store',
  })
  return res.json()
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth) return auth

  const { id } = await params

  const enrollments = await supabaseGet(`enrollments?select=student_id&course_id=eq.${id}`)
  if (!Array.isArray(enrollments)) {
    return NextResponse.json({ error: 'Failed to load roster', detail: enrollments }, { status: 500 })
  }
  const studentIds = enrollments.map((e: { student_id: string }) => e.student_id)
  if (studentIds.length === 0) return NextResponse.json([])

  const students = await supabaseGet(`students?select=id,first_name,last_name&id=in.(${studentIds.join(',')})&order=last_name`)
  if (!Array.isArray(students)) {
    return NextResponse.json({ error: 'Failed to load students', detail: students }, { status: 500 })
  }

  return NextResponse.json(
    students.map((s: { id: string; first_name: string; last_name: string }) => ({ full_name: `${s.first_name} ${s.last_name}` }))
  )
}
