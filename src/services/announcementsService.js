import { supabase } from "../lib/supabase";

/**
 * Fetch all announcements ordered by created_at descending.
 */
export const getAnnouncements = async () => {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
        console.warn("Table 'announcements' not found in Supabase schema.");
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (err) {
    console.warn("Could not query announcements table:", err.message);
    return [];
  }
};

/**
 * Create a new announcement.
 * @param {object} payload { title, message, class_id, class_name, is_active, publish_date }
 */
export const createAnnouncement = async (payload) => {
  const { data, error } = await supabase
    .from("announcements")
    .insert([{
      title: payload.title.trim(),
      message: payload.message.trim(),
      class_id: payload.class_id || null,
      class_name: payload.class_name || "All Classes",
      is_active: payload.is_active !== false,
      publish_date: payload.publish_date || new Date().toISOString().split("T")[0],
    }])
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      throw new Error("Table 'announcements' does not exist in Supabase. Please run the SQL migration in Supabase SQL Editor.");
    }
    throw error;
  }
  return data;
};

/**
 * Update an existing announcement.
 * @param {string} id 
 * @param {object} updates 
 */
export const updateAnnouncement = async (id, updates) => {
  const payload = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.message !== undefined) payload.message = updates.message.trim();
  if (updates.class_id !== undefined) payload.class_id = updates.class_id || null;
  if (updates.class_name !== undefined) payload.class_name = updates.class_name || "All Classes";
  if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);
  if (updates.publish_date !== undefined) payload.publish_date = updates.publish_date;

  const { data, error } = await supabase
    .from("announcements")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      throw new Error("Table 'announcements' does not exist in Supabase. Please run the SQL migration in Supabase SQL Editor.");
    }
    throw error;
  }
  return data;
};

/**
 * Delete an announcement.
 * @param {string} id 
 */
export const deleteAnnouncement = async (id) => {
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
      throw new Error("Table 'announcements' does not exist in Supabase. Please run the SQL migration in Supabase SQL Editor.");
    }
    throw error;
  }
};
