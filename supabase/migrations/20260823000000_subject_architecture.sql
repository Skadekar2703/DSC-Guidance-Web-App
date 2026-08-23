-- ==============================================================================
-- MIGRATION: 20260823000000_subject_architecture.sql
-- PREDEFINED SUBJECT CATALOGUE & STRING-KEY ICON ARCHITECTURE
-- ==============================================================================

-- 1. ADD NEW COLUMNS SAFELY TO SUBJECTS TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'icon_key'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN icon_key TEXT DEFAULT 'book-open';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'subject_type'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN subject_type TEXT DEFAULT 'class_based';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'class_range'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN class_range TEXT;
  END IF;
END $$;

-- 2. SYNC EXISTING DATA FOR BACKWARD COMPATIBILITY
UPDATE public.subjects 
SET icon_key = COALESCE(icon_key, icon, 'book-open')
WHERE icon_key IS NULL;

UPDATE public.subjects 
SET is_active = COALESCE(is_active, is_published, true)
WHERE is_active IS NULL;

UPDATE public.subjects 
SET is_published = COALESCE(is_published, is_active, true)
WHERE is_published IS NULL;

-- 3. SEED / UPSERT THE PREDEFINED CORE SUBJECTS CATALOGUE
DO $$
DECLARE
  rec RECORD;
  core_subjects JSONB := '[
    {"name": "Telugu", "description": "Telugu Language & Literature", "display_order": 1, "icon_key": "telugu", "subject_type": "class_based", "class_range": "3-10"},
    {"name": "English", "description": "English Language & Grammar", "display_order": 2, "icon_key": "english", "subject_type": "class_based", "class_range": "3-10"},
    {"name": "Physics", "description": "Physical Sciences & Physics", "display_order": 3, "icon_key": "physics", "subject_type": "class_based", "class_range": "3-10"},
    {"name": "Chemistry", "description": "Chemical Sciences & Chemistry", "display_order": 4, "icon_key": "chemistry", "subject_type": "class_based", "class_range": "3-10"},
    {"name": "Biology", "description": "Biological Sciences & Life Sciences", "display_order": 5, "icon_key": "biology", "subject_type": "class_based", "class_range": "3-intermediate"},
    {"name": "Psychology", "description": "Educational Psychology & Child Development", "display_order": 6, "icon_key": "psychology", "subject_type": "independent", "class_range": null},
    {"name": "Perspective in Education", "description": "Perspectives in Education (PIE)", "display_order": 7, "icon_key": "education", "subject_type": "independent", "class_range": null},
    {"name": "Biology Methodology", "description": "Teaching Methodology for Biology", "display_order": 8, "icon_key": "methodology", "subject_type": "independent", "class_range": null},
    {"name": "Physics Methodology", "description": "Teaching Methodology for Physics", "display_order": 9, "icon_key": "methodology", "subject_type": "independent", "class_range": null}
  ]'::jsonb;
BEGIN
  FOR rec IN SELECT * FROM jsonb_to_recordset(core_subjects) AS x(
    name TEXT, description TEXT, display_order INT, icon_key TEXT, subject_type TEXT, class_range TEXT
  )
  LOOP
    IF EXISTS (SELECT 1 FROM public.subjects WHERE LOWER(name) = LOWER(rec.name)) THEN
      UPDATE public.subjects
      SET
        subject_type = rec.subject_type,
        class_range = rec.class_range,
        display_order = rec.display_order,
        icon_key = COALESCE(icon_key, rec.icon_key),
        icon = COALESCE(icon, rec.icon_key),
        description = COALESCE(NULLIF(description, ''), rec.description),
        is_active = COALESCE(is_active, true),
        is_published = COALESCE(is_published, true)
      WHERE LOWER(name) = LOWER(rec.name);
    ELSE
      INSERT INTO public.subjects (name, description, display_order, icon_key, icon, subject_type, class_range, is_active, is_published)
      VALUES (rec.name, rec.description, rec.display_order, rec.icon_key, rec.icon_key, rec.subject_type, rec.class_range, true, true);
    END IF;
  END LOOP;
END $$;

-- 4. OPTIMIZATION INDEXES
CREATE INDEX IF NOT EXISTS idx_subjects_display_order ON public.subjects(display_order);
CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON public.subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_subject_type ON public.subjects(subject_type);
