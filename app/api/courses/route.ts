import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

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

function currentSchoolYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 9 ? year : year - 1
  return `${startYear}-${String(startYear + 1).slice(2)}`
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth) return auth

  const schoolYear = req.nextUrl.searchParams.get('school_year') || currentSchoolYear()

  // current_courses(p_school_year) resolves which version of each course applies for
  // the year (handles supersession) -- same RPC TOC-Dayplans/Report Card Tool use.
  const [courses, quarters] = await Promise.all([
    supabaseGet(`rpc/current_courses?p_school_year=${encodeURIComponent(schoolYear)}`),
    supabaseGet('school_quarters?select=id,start_date,end_date'),
  ])

  if (!Array.isArray(courses)) {
    return NextResponse.json({ error: 'Failed to load courses', detail: courses }, { status: 500 })
  }

  // Same fallback as Kawahoot/TOC: resolve today's quarter from public.school_quarters,
  // and if today is outside every defined quarter, fall back to the most recently-ended
  // one rather than showing every quarter-specific course at once.
  const today = new Date().toISOString().split('T')[0]
  const currentQuarter = Array.isArray(quarters)
    ? quarters.find((q: { id: number; start_date: string; end_date: string }) => today >= q.start_date && today <= q.end_date)?.id
      ?? quarters.filter((q: { end_date: string }) => q.end_date < today).sort((a: { end_date: string }, b: { end_date: string }) => b.end_date.localeCompare(a.end_date))[0]?.id
      ?? null
    : null

  const filtered = (courses as Array<{ type: string; quarters: string[] | null; id: string; name: string; block: string | null; grade_years: number[] }>)
    .filter((c) => c.type === 'academic')
    .filter((c) => !currentQuarter || !c.quarters || c.quarters.includes(String(currentQuarter)))
    .map((c) => ({ id: c.id, name: c.name, block: c.block, grade_years: c.grade_years }))

  return NextResponse.json(filtered)
}
