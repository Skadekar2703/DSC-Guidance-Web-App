-- ==============================================================================
-- MIGRATION: 20260827000000_tests_pdf_and_storage.sql
-- ADD STORAGE & PDF URL COLUMNS TO TESTS AND TEST_SERIES TABLES
-- ==============================================================================

DO $$
BEGIN
  -- Tests table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE public.tests ADD COLUMN pdf_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE public.tests ADD COLUMN storage_path TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE public.tests ADD COLUMN file_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE public.tests ADD COLUMN file_size BIGINT;
  END IF;

  -- Test Series table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'test_series' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE public.test_series ADD COLUMN pdf_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'test_series' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE public.test_series ADD COLUMN storage_path TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'test_series' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE public.test_series ADD COLUMN file_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'test_series' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE public.test_series ADD COLUMN file_size BIGINT;
  END IF;
END $$;
