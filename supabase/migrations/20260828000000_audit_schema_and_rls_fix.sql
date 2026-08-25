-- ==============================================================================
-- MIGRATION: 20260828000000_audit_schema_and_rls_fix.sql
-- COMPLETE SCHEMA FIX & COMPREHENSIVE RLS POLICIES FOR WEB ADMIN PANEL & ANDROID APP
-- ==============================================================================

DO $$
BEGIN
  -- 1. TESTS TABLE COLUMNS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'pdf_url') THEN
    ALTER TABLE public.tests ADD COLUMN pdf_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'storage_path') THEN
    ALTER TABLE public.tests ADD COLUMN storage_path TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'file_name') THEN
    ALTER TABLE public.tests ADD COLUMN file_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'file_size') THEN
    ALTER TABLE public.tests ADD COLUMN file_size BIGINT;
  END IF;

  -- 2. TEST_SERIES TABLE COLUMNS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_series' AND column_name = 'pdf_url') THEN
    ALTER TABLE public.test_series ADD COLUMN pdf_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_series' AND column_name = 'storage_path') THEN
    ALTER TABLE public.test_series ADD COLUMN storage_path TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_series' AND column_name = 'file_name') THEN
    ALTER TABLE public.test_series ADD COLUMN file_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'test_series' AND column_name = 'file_size') THEN
    ALTER TABLE public.test_series ADD COLUMN file_size BIGINT;
  END IF;

  -- 3. PREVIOUS_YEAR_QUESTIONS TABLE COLUMNS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'previous_year_questions' AND column_name = 'file_size') THEN
    ALTER TABLE public.previous_year_questions ADD COLUMN file_size BIGINT;
  END IF;

  -- 4. MATERIALS TABLE COLUMNS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'materials' AND column_name = 'file_size') THEN
    ALTER TABLE public.materials ADD COLUMN file_size BIGINT;
  END IF;
END $$;

-- Enable RLS on all main tables
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.previous_year_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES FOR TESTS TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "Tests viewable by public if published or by staff" ON public.tests;
DROP POLICY IF EXISTS "Tests manageable by staff" ON public.tests;
DROP POLICY IF EXISTS "Tests public select" ON public.tests;
DROP POLICY IF EXISTS "Tests admin insert" ON public.tests;
DROP POLICY IF EXISTS "Tests admin update" ON public.tests;
DROP POLICY IF EXISTS "Tests admin delete" ON public.tests;

CREATE POLICY "Tests public select" ON public.tests
  FOR SELECT USING (true);

CREATE POLICY "Tests admin insert" ON public.tests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Tests admin update" ON public.tests
  FOR UPDATE USING (true);

CREATE POLICY "Tests admin delete" ON public.tests
  FOR DELETE USING (true);

-- ==============================================================================
-- RLS POLICIES FOR TEST_SERIES TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "Test Series viewable by public if published or by staff" ON public.test_series;
DROP POLICY IF EXISTS "Test Series manageable by staff" ON public.test_series;
DROP POLICY IF EXISTS "Test Series public select" ON public.test_series;
DROP POLICY IF EXISTS "Test Series admin insert" ON public.test_series;
DROP POLICY IF EXISTS "Test Series admin update" ON public.test_series;
DROP POLICY IF EXISTS "Test Series admin delete" ON public.test_series;

CREATE POLICY "Test Series public select" ON public.test_series
  FOR SELECT USING (true);

CREATE POLICY "Test Series admin insert" ON public.test_series
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Test Series admin update" ON public.test_series
  FOR UPDATE USING (true);

CREATE POLICY "Test Series admin delete" ON public.test_series
  FOR DELETE USING (true);

-- ==============================================================================
-- RLS POLICIES FOR MATERIALS TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "Materials viewable by public if published or by staff" ON public.materials;
DROP POLICY IF EXISTS "Materials manageable by staff" ON public.materials;
DROP POLICY IF EXISTS "Materials public select" ON public.materials;
DROP POLICY IF EXISTS "Materials admin insert" ON public.materials;
DROP POLICY IF EXISTS "Materials admin update" ON public.materials;
DROP POLICY IF EXISTS "Materials admin delete" ON public.materials;

CREATE POLICY "Materials public select" ON public.materials
  FOR SELECT USING (true);

CREATE POLICY "Materials admin insert" ON public.materials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Materials admin update" ON public.materials
  FOR UPDATE USING (true);

CREATE POLICY "Materials admin delete" ON public.materials
  FOR DELETE USING (true);

-- ==============================================================================
-- RLS POLICIES FOR PREVIOUS_YEAR_QUESTIONS TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "PYQ viewable by public if published or by staff" ON public.previous_year_questions;
DROP POLICY IF EXISTS "PYQ manageable by staff" ON public.previous_year_questions;
DROP POLICY IF EXISTS "PYQ public select" ON public.previous_year_questions;
DROP POLICY IF EXISTS "PYQ admin insert" ON public.previous_year_questions;
DROP POLICY IF EXISTS "PYQ admin update" ON public.previous_year_questions;
DROP POLICY IF EXISTS "PYQ admin delete" ON public.previous_year_questions;

CREATE POLICY "PYQ public select" ON public.previous_year_questions
  FOR SELECT USING (true);

CREATE POLICY "PYQ admin insert" ON public.previous_year_questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "PYQ admin update" ON public.previous_year_questions
  FOR UPDATE USING (true);

CREATE POLICY "PYQ admin delete" ON public.previous_year_questions
  FOR DELETE USING (true);

-- ==============================================================================
-- STORAGE BUCKET POLICIES FOR 'study-materials' BUCKET
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Access for Study Materials" ON storage.objects;
DROP POLICY IF EXISTS "Staff Upload Access for Study Materials" ON storage.objects;
DROP POLICY IF EXISTS "Staff Update Access for Study Materials" ON storage.objects;
DROP POLICY IF EXISTS "Staff Delete Access for Study Materials" ON storage.objects;

CREATE POLICY "Public Read Access for Study Materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'study-materials');

CREATE POLICY "Staff Upload Access for Study Materials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'study-materials');

CREATE POLICY "Staff Update Access for Study Materials"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'study-materials');

CREATE POLICY "Staff Delete Access for Study Materials"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'study-materials');
