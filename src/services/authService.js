import { supabase } from "../lib/supabase";

/**
 * Sign in user with email and password using Supabase Auth.
 * @param {string} email 
 * @param {string} password 
 */
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/**
 * Sign out current user session.
 */
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
  } catch (err) {
    console.error("Exception during sign out:", err);
  }
};

/**
 * Send password reset email.
 * @param {string} email 
 */
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw error;
  return data;
};

/**
 * Fetch profile record for given user ID from profiles table.
 * @param {string} uid 
 * @returns {Promise<object|null>}
 */
export const getAdminRecord = async (uid) => {
  if (!uid) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user profile record:", error);
      throw error;
    }
    
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.full_name,
      role: data.role || "student",
      active: data.is_active !== false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error("Failed to retrieve profile record:", err);
    throw err;
  }
};

