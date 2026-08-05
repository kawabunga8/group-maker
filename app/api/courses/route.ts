import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

const COURSE_HUB_URL = process.env.COURSE_HUB_URL!
const COURSE_HUB_API_KEY = process.env.COURSE_HUB_API_KEY!

// Proxies to course-hub — course-hub is the single source of truth for
// course/student data. This app no longer queries Supabase directly for courses.
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth) return auth

  const schoolYear = req.nextUrl.searchParams.get('school_year')
  const url = new URL(`${COURSE_HUB_URL}/api/courses`)
  url.searchParams.set('type', 'academic')
  if (schoolYear) url.searchParams.set('school_year', schoolYear)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${COURSE_HUB_API_KEY}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const detail = await res.text()
    return NextResponse.json({ error: 'Failed to load courses', detail }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
