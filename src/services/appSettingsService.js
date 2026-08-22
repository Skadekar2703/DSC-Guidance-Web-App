import { supabase } from "../lib/supabase";

const DEFAULT_SETTINGS = {
  id: "1",
  whatsapp_url: "",
  youtube_url: "",
  telegram_url: "",
  share_url: "",
  rate_url: "",
  contact_email: "",
};

/**
 * Fetch application settings row (id = '1') from public.app_settings.
 * @returns {Promise<object>}
 */
export const getAppSettings = async () => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", "1")
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
        console.warn("Table 'app_settings' not found in Supabase schema.");
        return DEFAULT_SETTINGS;
      }
      throw error;
    }

    return data || DEFAULT_SETTINGS;
  } catch (err) {
    console.warn("Could not retrieve app settings from Supabase:", err.message);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Update a single setting field in public.app_settings row (id = '1').
 * @param {string} fieldKey Column name (whatsapp_url, youtube_url, etc.)
 * @param {string} value New URL / email string
 */
export const updateAppSettingField = async (fieldKey, value) => {
  const cleanValue = typeof value === "string" ? value.trim() : "";

  const payload = {
    id: "1",
    [fieldKey]: cleanValue,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("app_settings")
    .upsert([payload], { onConflict: "id" })
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      throw new Error("Table 'app_settings' does not exist in Supabase database. Please run the migration SQL in Supabase SQL Editor.");
    }
    throw error;
  }

  return data;
};

/**
 * Bulk update application settings in public.app_settings row (id = '1').
 * @param {object} settingsData 
 */
export const updateAllAppSettings = async (settingsData) => {
  const payload = {
    id: "1",
    whatsapp_url: settingsData.whatsapp_url?.trim() || "",
    youtube_url: settingsData.youtube_url?.trim() || "",
    telegram_url: settingsData.telegram_url?.trim() || "",
    share_url: settingsData.share_url?.trim() || "",
    rate_url: settingsData.rate_url?.trim() || "",
    contact_email: settingsData.contact_email?.trim() || "",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("app_settings")
    .upsert([payload], { onConflict: "id" })
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      throw new Error("Table 'app_settings' does not exist in Supabase database. Please run the migration SQL in Supabase SQL Editor.");
    }
    throw error;
  }

  return data;
};
