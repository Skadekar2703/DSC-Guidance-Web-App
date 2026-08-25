-- ==============================================================================
-- MIGRATION: 20260826000000_subject_logo_image.sql
-- SUBJECT LOGO IMAGE ARCHITECTURE
-- ==============================================================================

-- 1. ADD LOGO_URL AND BANNER_URL SAFELY TO SUBJECTS TABLE
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

-- 2. CREATE OPTIMIZATION INDEXES
CREATE INDEX IF NOT EXISTS idx_subjects_logo_url ON public.subjects(logo_url);
CREATE INDEX IF NOT EXISTS idx_subjects_banner_url ON public.subjects(banner_url);
