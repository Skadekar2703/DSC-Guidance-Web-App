-- ==============================================================================
-- MIGRATION: 20260825000000_subject_background_color.sql
-- ADD BACKGROUND_COLOR COLUMN TO SUBJECTS TABLE & SYNC EXISTING COLOR FIELDS
-- ==============================================================================

-- 1. ADD background_color COLUMN SAFELY TO SUBJECTS TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'background_color'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN background_color TEXT DEFAULT '#EDE7F6';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'icon_color'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN icon_color TEXT DEFAULT '#EDE7F6';
  END IF;
END $$;

-- 2. SYNC EXISTING COLOR DATA ACROSS ALL COLOR FIELDS
UPDATE public.subjects 
SET 
  background_color = COALESCE(NULLIF(background_color, ''), NULLIF(icon_color, ''), '#EDE7F6'),
  icon_color = COALESCE(NULLIF(icon_color, ''), NULLIF(background_color, ''), '#EDE7F6')
WHERE background_color IS NULL OR background_color = '' OR icon_color IS NULL OR icon_color = '';

-- 3. CREATE OPTIMIZATION INDEX
CREATE INDEX IF NOT EXISTS idx_subjects_background_color ON public.subjects(background_color);
