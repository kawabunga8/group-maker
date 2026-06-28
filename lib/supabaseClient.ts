import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — never construct at module scope, since that runs immediately
// on import (even during Next's build-time prerender pass, before any env vars
// might be available), not just when actually used in the browser.
let cached: SupabaseClient | null = null;
export function getSupabaseClient(): SupabaseClient {
  if (!cached) cached = createBrowserSupabaseClient();
  return cached;
}

// These are Group Maker's own ad-hoc classes/students (manually-typed groupings),
// stored in public.group_maker_classes/group_maker_students -- distinct from the
// real public.classes/public.students, which the course-import feature reads
// separately (see app/api/courses).
export type Class = {
  id: string;
  name: string;
  created_at: string;
  source_course_id: string | null;
};

export type Student = {
  id: string;
  class_id: string;
  full_name: string;
  created_at: string;
};
