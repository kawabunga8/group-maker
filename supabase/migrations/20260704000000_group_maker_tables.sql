-- Group Maker ad-hoc classes and student lists.
-- These are NOT the canonical public.classes / public.students records —
-- they're ephemeral grouping snapshots (often manually-typed or imported as
-- a one-time roster copy) that live independently so teachers can freely
-- edit names, combine classes, and delete without touching real student data.

CREATE TABLE IF NOT EXISTS public.group_maker_classes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  -- Non-null when the class was imported from a real course roster.
  -- SET NULL on delete so deleting a course doesn't cascade into groupings.
  source_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_maker_students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES public.group_maker_classes(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_maker_students_class_id
  ON public.group_maker_students(class_id);

ALTER TABLE public.group_maker_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_maker_students ENABLE ROW LEVEL SECURITY;

-- All authenticated staff can read/write groupings (these are not sensitive PII).
CREATE POLICY "gm_classes_all_authenticated"
  ON public.group_maker_classes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "gm_students_all_authenticated"
  ON public.group_maker_students FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
