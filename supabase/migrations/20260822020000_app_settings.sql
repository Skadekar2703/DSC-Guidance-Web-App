-- ==============================================================================
-- MIGRATION: 20260822020000_app_settings.sql
-- PUBLIC APP SETTINGS TABLE FOR SOCIAL & SUPPORT LINKS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  whatsapp_url TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',
  telegram_url TEXT DEFAULT '',
  share_url TEXT DEFAULT '',
  rate_url TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Auto update timestamp trigger
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
DROP POLICY IF EXISTS "App Settings viewable by everyone" ON public.app_settings;
CREATE POLICY "App Settings viewable by everyone"
  ON public.app_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "App Settings manageable by admin" ON public.app_settings;
CREATE POLICY "App Settings manageable by admin"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Seed initial row id = '1' if not exists
INSERT INTO public.app_settings (id, whatsapp_url, youtube_url, telegram_url, share_url, rate_url, contact_email)
VALUES ('1', '', '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;
