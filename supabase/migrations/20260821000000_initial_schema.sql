-- ==============================================================================
-- SCHEMAS & EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. PROFILES TABLE (User Roles & Accounts mapped to auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'tutor' CHECK (role IN ('admin', 'tutor', 'student')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatically insert a row in public.profiles on new auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Admin User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is admin or tutor
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'tutor') AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Profiles updatable by admins or self"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles insertable by admins"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Profiles deletable by admins"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 2. SUBJECTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  cover_image TEXT,
  brand_color TEXT DEFAULT '#16A34A',
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Subjects viewable by public if published or by staff"
  ON public.subjects FOR SELECT
  USING (is_published = true OR public.is_staff());

CREATE POLICY "Subjects insertable by staff"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "Subjects updatable by staff"
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (public.is_staff());

CREATE POLICY "Subjects deletable by admin"
  ON public.subjects FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 3. CHAPTERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Chapters viewable by public if published or by staff"
  ON public.chapters FOR SELECT
  USING (is_published = true OR public.is_staff());

CREATE POLICY "Chapters insertable by staff"
  ON public.chapters FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "Chapters updatable by staff"
  ON public.chapters FOR UPDATE
  TO authenticated
  USING (public.is_staff());

CREATE POLICY "Chapters deletable by staff"
  ON public.chapters FOR DELETE
  TO authenticated
  USING (public.is_staff());

-- ==============================================================================
-- 4. CLASSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Classes viewable by everyone"
  ON public.classes FOR SELECT
  USING (true);

CREATE POLICY "Classes manageable by staff"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.is_staff());

-- ==============================================================================
-- 5. MATERIALS TABLE (Study Notes & PDFs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  material_type TEXT DEFAULT 'PDF',
  file_name TEXT,
  file_path TEXT,
  storage_path TEXT,
  pdf_url TEXT,
  external_url TEXT,
  file_size BIGINT,
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Materials viewable by public if published or by staff"
  ON public.materials FOR SELECT
  USING (is_published = true OR public.is_staff());

CREATE POLICY "Materials manageable by staff"
  ON public.materials FOR ALL
  TO authenticated
  USING (public.is_staff());

-- ==============================================================================
-- 6. PREVIOUS YEAR QUESTIONS (pyq_papers) TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.previous_year_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  exam_type TEXT DEFAULT 'DSC',
  year INT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  description TEXT,
  file_name TEXT,
  storage_path TEXT,
  pdf_url TEXT,
  external_url TEXT,
  is_published BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.previous_year_questions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_pyq_updated_at
  BEFORE UPDATE ON public.previous_year_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "PYQ viewable by public if published or by staff"
  ON public.previous_year_questions FOR SELECT
  USING (is_published = true OR public.is_staff());

CREATE POLICY "PYQ manageable by staff"
  ON public.previous_year_questions FOR ALL
  TO authenticated
  USING (public.is_staff());

-- ==============================================================================
-- 7. TESTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  test_type TEXT DEFAULT 'PRACTICE',
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  question_count INT DEFAULT 0,
  duration INT DEFAULT 0,
  total_marks INT DEFAULT 0,
  external_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Tests viewable by public if published or by staff"
  ON public.tests FOR SELECT
  USING (is_published = true OR public.is_staff());

CREATE POLICY "Tests manageable by staff"
  ON public.tests FOR ALL
  TO authenticated
  USING (public.is_staff());

-- ==============================================================================
-- 8. TEST SERIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.test_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  tests JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_test_series_updated_at
  BEFORE UPDATE ON public.test_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Test Series viewable by public if published or by staff"
  ON public.test_series FOR SELECT
  USING (is_published = true OR public.is_staff());

CREATE POLICY "Test Series manageable by staff"
  ON public.test_series FOR ALL
  TO authenticated
  USING (public.is_staff());

-- ==============================================================================
-- 9. RESOURCES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  resource_type TEXT DEFAULT 'PDF',
  url TEXT,
  storage_path TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Resources viewable by public if published or by staff"
  ON public.resources FOR SELECT
  USING (is_published = true OR public.is_staff());

CREATE POLICY "Resources manageable by staff"
  ON public.resources FOR ALL
  TO authenticated
  USING (public.is_staff());

-- ==============================================================================
-- 10. IMPORTANT TOPICS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.important_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  file_name TEXT,
  storage_path TEXT,
  pdf_url TEXT,
  external_url TEXT,
  is_published BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.important_topics ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_important_topics_updated_at
  BEFORE UPDATE ON public.important_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Important Topics viewable by public if published or by staff"
  ON public.important_topics FOR SELECT
  USING (is_published = true OR public.is_staff());

CREATE POLICY "Important Topics manageable by staff"
  ON public.important_topics FOR ALL
  TO authenticated
  USING (public.is_staff());

-- ==============================================================================
-- 11. GENERAL SCIENCE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.general_science (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  file_name TEXT,
  storage_path TEXT,
  pdf_url TEXT,
  external_url TEXT,
  is_published BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.general_science ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_general_science_updated_at
  BEFORE UPDATE ON public.general_science
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "General Science viewable by public if published or by staff"
  ON public.general_science FOR SELECT
  USING (is_published = true OR public.is_staff());

CREATE POLICY "General Science manageable by staff"
  ON public.general_science FOR ALL
  TO authenticated
  USING (public.is_staff());

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION & POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
CREATE POLICY "Public Read Access for Study Materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'study-materials');

CREATE POLICY "Staff Upload Access for Study Materials"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'study-materials' AND public.is_staff());

CREATE POLICY "Staff Update Access for Study Materials"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'study-materials' AND public.is_staff());

CREATE POLICY "Staff Delete Access for Study Materials"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'study-materials' AND public.is_staff());
