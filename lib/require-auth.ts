import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STAFF_DOMAIN = '@myrcs.ca'

/**
 * Returns a 401 response if the request isn't from an authenticated @myrcs.ca
 * staff member, otherwise null. Real auth via the Supabase session cookie set
 * by middleware.ts — same account as TOC-Dayplans/Student Hub/Report Card
 * Tool/Kawahoot.
 */
export async function requireAuth(req: NextRequest): Promise<NextResponse | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email?.toLowerCase().endsWith(STAFF_DOMAIN)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
