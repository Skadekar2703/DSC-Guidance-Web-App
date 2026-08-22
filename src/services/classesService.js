import { supabase } from "../lib/supabase";

export const addClass = async (data) => {
  const payload = {
    name: data.name,
    display_order: Number(data.displayOrder ?? data.display_order ?? 0),
    is_published: data.active !== undefined ? Boolean(data.active) : Boolean(data.is_published ?? true),
  };

  const { data: result, error } = await supabase
    .from("classes")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return result.id;
};

export const updateClass = async (id, data) => {
  const payload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.displayOrder !== undefined || data.display_order !== undefined) payload.display_order = Number(data.displayOrder ?? data.display_order);
  if (data.active !== undefined) payload.is_published = Boolean(data.active);
  if (data.is_published !== undefined) payload.is_published = Boolean(data.is_published);

  const { error } = await supabase
    .from("classes")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
};

export const deleteClass = async (id) => {
  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
