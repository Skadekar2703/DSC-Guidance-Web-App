import { supabase } from "../lib/supabase";

export const addSubject = async (data) => {
  const payload = {
    name: data.name,
    description: data.description || "",
    display_order: Number(data.displayOrder ?? data.display_order ?? 0),
    is_published: data.active !== undefined ? Boolean(data.active) : Boolean(data.is_published ?? true),
    logo_url: data.logo_url ?? data.logoUrl ?? null,
    banner_url: data.banner_url ?? data.bannerUrl ?? null,
  };

  if (data.id) {
    payload.id = data.id;
  }

  const { data: result, error } = await supabase
    .from("subjects")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return result;
};

export const updateSubject = async (id, data) => {
  const payload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.displayOrder !== undefined || data.display_order !== undefined) payload.display_order = Number(data.displayOrder ?? data.display_order);
  if (data.active !== undefined) payload.is_published = Boolean(data.active);
  if (data.is_published !== undefined) payload.is_published = Boolean(data.is_published);

  if (data.logo_url !== undefined) payload.logo_url = data.logo_url;
  else if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl;

  if (data.banner_url !== undefined) payload.banner_url = data.banner_url;
  else if (data.bannerUrl !== undefined) payload.banner_url = data.bannerUrl;

  const { error } = await supabase
    .from("subjects")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
};

export const deleteSubject = async (id) => {
  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
