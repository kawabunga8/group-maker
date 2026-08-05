import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'

const COURSE_HUB_URL = process.env.COURSE_HUB_URL!
const COURSE_HUB_API_KEY = process.env.COURSE_HUB_API_KEY!

// Proxies to course-hub — course-hub is the single source of truth for
// course/student data. This app no longer queries Supabase directly for students.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if (auth) return auth

  const { id } = await params

  const res = await fetch(`${COURSE_HUB_URL}/api/courses/${id}/roster`, {
    headers: { Authorization: `Bearer ${COURSE_HUB_API_KEY}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const detail = await res.text()
    return NextResponse.json({ error: 'Failed to load roster', detail }, { status: res.status })
  }

  const students = await res.json()

  // ClassesClient expects [{ full_name }] — course-hub returns full_name already.
  return NextResponse.json(students)
}
