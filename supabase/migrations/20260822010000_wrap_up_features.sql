-- ==============================================================================
-- MIGRATION: 20260822010000_wrap_up_features.sql
-- SOCIAL LINKS, ANNOUNCEMENTS, AND CLASS-SUBJECT RELATIONSHIPS
-- ==============================================================================

-- 1. SOCIAL & CONTACT LINKS TABLE
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_social_links_updated_at
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Social Links viewable by everyone"
  ON public.social_links FOR SELECT
  USING (true);

CREATE POLICY "Social Links manageable by admin"
  ON public.social_links FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 2. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  class_name TEXT DEFAULT 'All Classes',
  is_active BOOLEAN NOT NULL DEFAULT true,
  publish_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Announcements viewable by everyone"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "Announcements manageable by admin"
  ON public.announcements FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 3. CLASS_SUBJECTS MANY-TO-MANY JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_id, subject_id)
);

ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class Subjects viewable by everyone"
  ON public.class_subjects FOR SELECT
  USING (true);

CREATE POLICY "Class Subjects manageable by admin"
  ON public.class_subjects FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 4. ENSURE TEST_SERIES HAS CLASS_ID IF MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='test_series' AND column_name='class_id'
  ) THEN
    ALTER TABLE public.test_series ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
  END IF;
END $$;
