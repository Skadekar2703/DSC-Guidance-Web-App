import { supabase } from "../lib/supabase";

/**
 * Fetch all social links ordered by display_order.
 */
export const getSocialLinks = async () => {
  try {
    const { data, error } = await supabase
      .from("social_links")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
        console.warn("Table 'social_links' not found in Supabase schema.");
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (err) {
    console.warn("Could not query social_links table:", err.message);
    return [];
  }
};

/**
 * Create a new social link.
 * @param {object} payload { platform, url, is_active }
 */
export const createSocialLink = async (payload) => {
  const { data, error } = await supabase
    .from("social_links")
    .insert([{
      platform: payload.platform.trim(),
      url: payload.url.trim(),
      is_active: payload.is_active !== false,
      display_order: payload.display_order || 0,
    }])
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      throw new Error("Table 'social_links' does not exist in Supabase. Please run the SQL migration in Supabase SQL Editor.");
    }
    throw error;
  }
  return data;
};

/**
 * Update an existing social link.
 * @param {string} id 
 * @param {object} updates 
 */
export const updateSocialLink = async (id, updates) => {
  const payload = {};
  if (updates.platform !== undefined) payload.platform = updates.platform.trim();
  if (updates.url !== undefined) payload.url = updates.url.trim();
  if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);
  if (updates.display_order !== undefined) payload.display_order = Number(updates.display_order);

  const { data, error } = await supabase
    .from("social_links")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      throw new Error("Table 'social_links' does not exist in Supabase. Please run the SQL migration in Supabase SQL Editor.");
    }
    throw error;
  }
  return data;
};

/**
 * Delete a social link.
 * @param {string} id 
 */
export const deleteSocialLink = async (id) => {
  const { error } = await supabase
    .from("social_links")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      throw new Error("Table 'social_links' does not exist in Supabase. Please run the SQL migration in Supabase SQL Editor.");
    }
    throw error;
  }
};
