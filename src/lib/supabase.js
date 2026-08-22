import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

/**
 * Checks whether valid Supabase environment configuration exists.
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseKey) return false;
  if (
    supabaseUrl.includes("your-supabase-project-id") ||
    supabaseUrl.includes("example.com") ||
    supabaseKey.includes("your_supabase_publishable")
  ) {
    return false;
  }
  return true;
};

// Fallback dummy URL for client instantiation if unconfigured to prevent crash during init
const validUrl = isSupabaseConfigured() ? supabaseUrl : "https://placeholder.supabase.co";
const validKey = isSupabaseConfigured() ? supabaseKey : "placeholder-key";

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
