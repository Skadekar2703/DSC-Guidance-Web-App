-- ==============================================================================
-- MIGRATION: 20260829000000_add_access_type_and_subscription_plans.sql
-- ADD ACCESS_TYPE COLUMN TO CONTENT TABLES & CREATE SUBSCRIPTION_PLANS TABLE
-- ==============================================================================

-- Helper function: update_updated_at_column()
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  -- 1. TESTS TABLE ACCESS_TYPE
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'access_type'
  ) THEN
    ALTER TABLE public.tests ADD COLUMN access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'premium'));
  END IF;

  -- 2. MATERIALS TABLE ACCESS_TYPE
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'materials' AND column_name = 'access_type'
  ) THEN
    ALTER TABLE public.materials ADD COLUMN access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'premium'));
  END IF;

  -- 3. TEST_SERIES TABLE ACCESS_TYPE
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'test_series' AND column_name = 'access_type'
  ) THEN
    ALTER TABLE public.test_series ADD COLUMN access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'premium'));
  END IF;

  -- 4. PREVIOUS_YEAR_QUESTIONS TABLE ACCESS_TYPE
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'previous_year_questions' AND column_name = 'access_type'
  ) THEN
    ALTER TABLE public.previous_year_questions ADD COLUMN access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'premium'));
  END IF;
END $$;

-- 5. CREATE SUBSCRIPTION_PLANS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Premium Access',
  price INT NOT NULL DEFAULT 19900,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_type TEXT NOT NULL DEFAULT 'one_time',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at on subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial Premium Access plan if table is empty
INSERT INTO public.subscription_plans (name, price, currency, payment_type, is_active)
SELECT 'Premium Access', 19900, 'INR', 'one_time', true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
DROP POLICY IF EXISTS "Subscription plans public select" ON public.subscription_plans;
DROP POLICY IF EXISTS "Subscription plans admin manage" ON public.subscription_plans;
DROP POLICY IF EXISTS "Subscription plans admin insert" ON public.subscription_plans;
DROP POLICY IF EXISTS "Subscription plans admin update" ON public.subscription_plans;
DROP POLICY IF EXISTS "Subscription plans admin delete" ON public.subscription_plans;

-- Public / Student SELECT policy
CREATE POLICY "Subscription plans public select" ON public.subscription_plans
  FOR SELECT USING (true);

-- Admin INSERT policy
CREATE POLICY "Subscription plans admin insert" ON public.subscription_plans
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- Admin UPDATE policy
CREATE POLICY "Subscription plans admin update" ON public.subscription_plans
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Admin DELETE policy
CREATE POLICY "Subscription plans admin delete" ON public.subscription_plans
  FOR DELETE TO authenticated
  USING (public.is_admin());
