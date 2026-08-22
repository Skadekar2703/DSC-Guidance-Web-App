-- ==============================================================================
-- MIGRATION: 20260822000000_fix_auth_roles_rls.sql
-- FIX AUTHENTICATION & AUTHORIZATION ARCHITECTURE
-- ==============================================================================

-- 1. Ensure profiles table default role is 'student'
ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'student';

-- Ensure constraint allows 'admin', 'tutor', 'student'
DO $$ 
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'tutor', 'student'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Update handle_new_user() trigger function to default to 'student'
-- ONLY grant 'admin' if 0 admins exist in public.profiles OR if explicitly created by an existing admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INT;
  assigned_role TEXT;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  
  -- If 0 admins exist and metadata specifies 'admin', allow first admin bootstrap
  IF admin_count = 0 AND (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    assigned_role := 'admin';
  ELSIF (NEW.raw_user_meta_data->>'role') = 'admin' AND public.is_admin() THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User Account'),
    assigned_role,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Trigger to PREVENT self role escalation by non-admins
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Check if current operating user is an active admin
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized role escalation attempt. Only existing administrators can modify account roles.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_role_escalation ON public.profiles;
CREATE TRIGGER check_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- 4. Helper function: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: is_staff()
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'tutor') AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update Profiles Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by admins or self" ON public.profiles;
CREATE POLICY "Profiles viewable by admins or self"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles updatable by admins or self" ON public.profiles;
CREATE POLICY "Profiles updatable by admins or self"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles insertable by admins" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insertable by admins or self during bootstrap" ON public.profiles;
CREATE POLICY "Profiles insertable by admins or self during bootstrap"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() 
    OR auth.uid() = id 
    OR (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') = 0
  );

DROP POLICY IF EXISTS "Profiles deletable by admins" ON public.profiles;
CREATE POLICY "Profiles deletable by admins"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 6. Safely update existing profiles to explicitly default non-admin users to 'student'
UPDATE public.profiles
SET role = 'student'
WHERE role IS NULL OR role NOT IN ('admin', 'tutor', 'student');
