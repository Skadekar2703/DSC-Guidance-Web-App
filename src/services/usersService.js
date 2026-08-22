import { supabase } from "../lib/supabase";

/**
 * Check total count of admin users registered in profiles table.
 * @returns {Promise<number>}
 */
export const getAdminCount = async () => {
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    if (error) {
      console.warn("Could not query admin count directly:", error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error("Error checking admin count:", err);
    return 0;
  }
};

/**
 * Check whether the given user ID is the last remaining active admin.
 * @param {string} userId 
 * @returns {Promise<boolean>}
 */
export const isLastActiveAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);

    if (error || !data) return false;
    if (data.length <= 1 && data.some(u => u.id === userId)) {
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error checking last active admin:", err);
    return false;
  }
};

/**
 * Creates or authorizes a new admin user.
 * Attempts Edge Function invocation first. If Edge Function is not deployed,
 * uses Supabase auth.signUp and upserts the profile record.
 * @param {object} userData { email, password, name, role, active }
 */
export const createAdminUser = async (userData) => {
  const { email, password, name, role = "admin", active = true } = userData;
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // 1. Try invoking Edge Function 'create-user'
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await supabase.functions.invoke("create-user", {
      body: { email: cleanEmail, password, full_name: cleanName, role },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.error && response.data?.user) {
      return response.data.user;
    }
  } catch (edgeErr) {
    console.warn("Edge function invocation unavailable, utilizing direct Supabase Auth client creation:", edgeErr);
  }

  // 2. Direct Auth Signup fallback
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: password,
    options: {
      data: {
        full_name: cleanName,
        role: role,
      },
    },
  });

  if (signUpError) {
    throw signUpError;
  }

  const userId = authData?.user?.id || userData.id || userData.uid;

  if (userId) {
    const payload = {
      id: userId,
      email: cleanEmail,
      full_name: cleanName,
      role: role,
      is_active: Boolean(active),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert([payload]);

    if (profileError) {
      console.warn("Profile upsert returned error (trigger may have created record):", profileError.message);
    }
    return authData.user || payload;
  }

  return authData.user;
};

/**
 * Update user profile role / active status.
 * Prevents deactivating or removing role of the last remaining admin.
 * @param {string} id User UUID
 * @param {object} updates { name, role, active }
 */
export const updateUserProfile = async (id, updates) => {
  // Guard against deactivating or demoting the last remaining active admin
  if (updates.active === false || (updates.role && updates.role !== "admin")) {
    const isLast = await isLastActiveAdmin(id);
    if (isLast) {
      throw new Error("Action blocked: Cannot deactivate or demote the last remaining administrator account.");
    }
  }

  const payload = {};
  if (updates.name !== undefined) payload.full_name = updates.name.trim();
  if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.active !== undefined) payload.is_active = Boolean(updates.active);
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
};

/**
 * Delete or deactivate user profile.
 * Prevents deleting the last remaining active admin.
 * @param {string} id 
 */
export const deleteUserProfile = async (id) => {
  const isLast = await isLastActiveAdmin(id);
  if (isLast) {
    throw new Error("Action blocked: Cannot delete the last remaining administrator account.");
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
