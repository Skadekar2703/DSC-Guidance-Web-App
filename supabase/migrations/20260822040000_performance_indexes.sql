-- ==============================================================================
-- MIGRATION: 20260822040000_performance_indexes.sql
-- PERFORMANCE INDEXES FOR HIGH-FREQUENCY QUERY PATHS
-- ==============================================================================

-- 1. INDEXES FOR TESTS TABLE
CREATE INDEX IF NOT EXISTS idx_tests_class_id ON public.tests(class_id);
CREATE INDEX IF NOT EXISTS idx_tests_subject_id ON public.tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_tests_chapter_id ON public.tests(chapter_id);
CREATE INDEX IF NOT EXISTS idx_tests_test_type ON public.tests(test_type);
CREATE INDEX IF NOT EXISTS idx_tests_published_order ON public.tests(is_published, display_order);

-- 2. INDEXES FOR MATERIALS TABLE
CREATE INDEX IF NOT EXISTS idx_materials_class_id ON public.materials(class_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_chapter_id ON public.materials(chapter_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON public.materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_published ON public.materials(is_published);

-- 3. INDEXES FOR CHAPTERS TABLE
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_published_order ON public.chapters(is_published, display_order);

-- 4. INDEXES FOR PREVIOUS YEAR QUESTIONS TABLE
CREATE INDEX IF NOT EXISTS idx_pyq_class_id ON public.previous_year_questions(class_id);
CREATE INDEX IF NOT EXISTS idx_pyq_subject_id ON public.previous_year_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_pyq_chapter_id ON public.previous_year_questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_pyq_exam_type ON public.previous_year_questions(exam_type);

-- 5. INDEXES FOR CLASS_SUBJECTS JUNCTION TABLE
CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON public.class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON public.class_subjects(subject_id);

-- 6. INDEXES FOR RESOURCES TABLE
CREATE INDEX IF NOT EXISTS idx_resources_class_id ON public.resources(class_id);
CREATE INDEX IF NOT EXISTS idx_resources_subject_id ON public.resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_resources_chapter_id ON public.resources(chapter_id);

-- 7. INDEXES FOR IMPORTANT TOPICS TABLE
CREATE INDEX IF NOT EXISTS idx_important_topics_class_id ON public.important_topics(class_id);
CREATE INDEX IF NOT EXISTS idx_important_topics_subject_id ON public.important_topics(subject_id);

-- 8. INDEXES FOR GENERAL SCIENCE TABLE
CREATE INDEX IF NOT EXISTS idx_general_science_class_id ON public.general_science(class_id);
CREATE INDEX IF NOT EXISTS idx_general_science_subject_id ON public.general_science(subject_id);

-- 9. INDEXES FOR PROFILES TABLE
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON public.profiles(role, is_active);
