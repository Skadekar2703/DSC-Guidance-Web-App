-- ==============================================================================
-- MIGRATION: 20260822030000_subject_branding.sql
-- SUBJECT BRANDING SYSTEM: LOGO_URL AND BANNER_URL FIELDS + STORAGE BUCKET
-- ==============================================================================

-- 1. ADD LOGO_URL AND BANNER_URL COLUMNS TO SUBJECTS TABLE SAFELY
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN logo_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'banner_url'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN banner_url TEXT;
  END IF;
END $$;

-- 2. CREATE STORAGE BUCKET FOR SUBJECT ASSETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('subject-assets', 'subject-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. STORAGE RLS POLICIES FOR SUBJECT ASSETS
DROP POLICY IF EXISTS "Public Read Access for Subject Assets" ON storage.objects;
CREATE POLICY "Public Read Access for Subject Assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'subject-assets');

DROP POLICY IF EXISTS "Staff Upload Access for Subject Assets" ON storage.objects;
CREATE POLICY "Staff Upload Access for Subject Assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'subject-assets' AND public.is_staff());

DROP POLICY IF EXISTS "Staff Update Access for Subject Assets" ON storage.objects;
CREATE POLICY "Staff Update Access for Subject Assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'subject-assets' AND public.is_staff());

DROP POLICY IF EXISTS "Staff Delete Access for Subject Assets" ON storage.objects;
CREATE POLICY "Staff Delete Access for Subject Assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'subject-assets' AND public.is_staff());
