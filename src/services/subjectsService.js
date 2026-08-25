import { supabase } from "../lib/supabase";

/**
 * Safely inserts a new subject into Supabase.
 * Stores icon_name and icon_color without icon image uploads.
 * Automatically retries omitting columns if Supabase schema has not been updated with new migration columns yet.
 */
export const addSubject = async (data) => {
  const iconNameVal = data.icon_name ?? data.iconName ?? data.icon_key ?? data.iconKey ?? data.icon ?? "book";
  const bgColorVal = data.background_color ?? data.backgroundColor ?? data.icon_color ?? data.iconColor ?? "#EDE7F6";
  const activeVal = data.active !== undefined ? Boolean(data.active) : Boolean(data.is_active ?? data.is_published ?? true);

  const logoUrlVal = data.logo_url ?? data.logoUrl ?? data.logo_image_url ?? data.logoImageUrl ?? null;
  const bannerUrlVal = data.banner_url ?? data.bannerUrl ?? data.banner_image_url ?? data.bannerImageUrl ?? null;

  let payload = {
    name: data.name,
    description: data.description || "",
    display_order: Number(data.displayOrder ?? data.display_order ?? 0),
    is_active: activeVal,
    is_published: activeVal,
    logo_url: logoUrlVal,
    banner_url: bannerUrlVal,
    subject_type: data.subject_type ?? data.subjectType ?? "class_based",
    class_range: data.class_range ?? data.classRange ?? null,
  };

  if (data.icon_name || data.iconName) {
    const iconVal = data.icon_name ?? data.iconName;
    payload.icon_name = iconVal;
    payload.icon_key = iconVal;
  }
  if (data.background_color || data.backgroundColor) {
    const colorVal = data.background_color ?? data.backgroundColor;
    payload.background_color = colorVal;
    payload.icon_color = colorVal;
  }

  if (data.id) {
    payload.id = data.id;
  }

  let { data: result, error } = await supabase
    .from("subjects")
    .insert([payload])
    .select()
    .single();

  // Handle missing columns gracefully if migration script has not been executed yet in Supabase
  while (error && error.message && error.message.includes("Could not find the")) {
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && payload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`Supabase schema cache missing column '${missingCol}'. Omitting '${missingCol}' and retrying insert...`);
      delete payload[missingCol];

      const retryRes = await supabase
        .from("subjects")
        .insert([payload])
        .select()
        .single();

      result = retryRes.data;
      error = retryRes.error;
    } else {
      break;
    }
  }

  if (error) throw error;
  return result;
};

/**
 * Safely updates an existing subject in Supabase.
 * Automatically retries omitting columns if Supabase schema cache has missing columns.
 */
export const updateSubject = async (id, data) => {
  const payload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.displayOrder !== undefined || data.display_order !== undefined) payload.display_order = Number(data.displayOrder ?? data.display_order);

  if (data.active !== undefined || data.is_active !== undefined || data.is_published !== undefined) {
    const activeVal = Boolean(data.active ?? data.is_active ?? data.is_published);
    payload.is_active = activeVal;
    payload.is_published = activeVal;
  }

  if (data.icon_name !== undefined || data.iconName !== undefined || data.icon_key !== undefined || data.iconKey !== undefined || data.icon !== undefined) {
    const nameVal = data.icon_name ?? data.iconName ?? data.icon_key ?? data.iconKey ?? data.icon;
    payload.icon_name = nameVal;
    payload.icon_key = nameVal;
    payload.icon = nameVal;
  }

  if (data.background_color !== undefined || data.backgroundColor !== undefined || data.icon_color !== undefined || data.iconColor !== undefined || data.color !== undefined) {
    const colorVal = data.background_color ?? data.backgroundColor ?? data.icon_color ?? data.iconColor ?? data.color;
    payload.background_color = colorVal;
    payload.icon_color = colorVal;
    payload.color = colorVal;
  }

  if (data.subject_type !== undefined || data.subjectType !== undefined) {
    payload.subject_type = data.subject_type ?? data.subjectType;
  }

  if (data.class_range !== undefined || data.classRange !== undefined) {
    payload.class_range = data.class_range ?? data.classRange;
  }

  if (data.logo_url !== undefined) payload.logo_url = data.logo_url;
  else if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl;
  else if (data.logoImageUrl !== undefined) payload.logo_url = data.logoImageUrl;

  if (data.banner_url !== undefined) payload.banner_url = data.banner_url;
  else if (data.bannerUrl !== undefined) payload.banner_url = data.bannerUrl;
  else if (data.bannerImageUrl !== undefined) payload.banner_url = data.bannerImageUrl;

  let { error } = await supabase
    .from("subjects")
    .update(payload)
    .eq("id", id);

  // Handle missing columns gracefully if migration script has not been executed yet in Supabase
  while (error && error.message && error.message.includes("Could not find the")) {
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && payload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`Supabase schema cache missing column '${missingCol}'. Omitting '${missingCol}' and retrying update...`);
      delete payload[missingCol];

      const retryRes = await supabase
        .from("subjects")
        .update(payload)
        .eq("id", id);

      error = retryRes.error;
    } else {
      break;
    }
  }

  if (error) throw error;
};

export const deleteSubject = async (id) => {
  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
