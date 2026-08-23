-- ==============================================================================
-- MIGRATION: 20260824000000_subject_symbol_and_color.sql
-- SUBJECT SYMBOL (ICON NAME) & SUBJECT COLOR ARCHITECTURE
-- ==============================================================================

-- 1. ADD NEW COLUMNS SAFELY TO SUBJECTS TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'icon_name'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN icon_name TEXT DEFAULT 'book';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'icon_color'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN icon_color TEXT DEFAULT '#5B2FD6';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'icon_key'
  ) THEN
    ALTER TABLE public.subjects ADD COLUMN icon_key TEXT DEFAULT 'book';
  END IF;
END $$;

-- 2. SYNC EXISTING DATA FOR BACKWARD COMPATIBILITY
UPDATE public.subjects 
SET icon_name = COALESCE(NULLIF(icon_name, ''), NULLIF(icon_key, ''), NULLIF(icon, ''), 'book')
WHERE icon_name IS NULL OR icon_name = '';

UPDATE public.subjects 
SET icon_key = COALESCE(NULLIF(icon_key, ''), NULLIF(icon_name, ''), 'book')
WHERE icon_key IS NULL OR icon_key = '';

UPDATE public.subjects 
SET icon_color = COALESCE(NULLIF(icon_color, ''), '#5B2FD6')
WHERE icon_color IS NULL OR icon_color = '';

-- 3. SEED / UPSERT PREDEFINED SUBJECT SYMBOLS AND COLORS
DO $$
DECLARE
  rec RECORD;
  core_subjects JSONB := '[
    {"name": "Telugu", "icon_name": "telugu", "icon_color": "#5B2FD6"},
    {"name": "English", "icon_name": "english", "icon_color": "#2563EB"},
    {"name": "Physics", "icon_name": "physics", "icon_color": "#0284C7"},
    {"name": "Chemistry", "icon_name": "chemistry", "icon_color": "#0D9488"},
    {"name": "Biology", "icon_name": "biology", "icon_color": "#16A34A"},
    {"name": "Psychology", "icon_name": "psychology", "icon_color": "#8B5CF6"},
    {"name": "Perspective in Education", "icon_name": "education", "icon_color": "#D97706"},
    {"name": "Biology Methodology", "icon_name": "methodology", "icon_color": "#059669"},
    {"name": "Physics Methodology", "icon_name": "methodology", "icon_color": "#2563EB"},
    {"name": "General Science", "icon_name": "science", "icon_color": "#0891B2"},
    {"name": "Mathematics", "icon_name": "math", "icon_color": "#DC2626"},
    {"name": "Marathi", "icon_name": "marathi", "icon_color": "#7C3AED"},
    {"name": "Hindi", "icon_name": "hindi", "icon_color": "#EA580C"}
  ]'::jsonb;
BEGIN
  FOR rec IN SELECT * FROM jsonb_to_recordset(core_subjects) AS x(
    name TEXT, icon_name TEXT, icon_color TEXT
  )
  LOOP
    IF EXISTS (SELECT 1 FROM public.subjects WHERE LOWER(name) = LOWER(rec.name)) THEN
      UPDATE public.subjects
      SET
        icon_name = COALESCE(icon_name, rec.icon_name),
        icon_key = COALESCE(icon_key, rec.icon_name),
        icon_color = COALESCE(icon_color, rec.icon_color)
      WHERE LOWER(name) = LOWER(rec.name);
    END IF;
  END LOOP;
END $$;

-- 4. OPTIMIZATION INDEXES
CREATE INDEX IF NOT EXISTS idx_subjects_icon_name ON public.subjects(icon_name);
CREATE INDEX IF NOT EXISTS idx_subjects_icon_color ON public.subjects(icon_color);
