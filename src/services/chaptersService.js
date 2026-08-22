import { supabase } from "../lib/supabase";

export const addChapter = async (data) => {
  const payload = {
    subject_id: data.subjectId || data.subject_id,
    name: data.name,
    description: data.description || "",
    display_order: Number(data.displayOrder ?? data.display_order ?? 0),
    is_published: data.active !== undefined ? Boolean(data.active) : Boolean(data.is_published ?? true),
  };

  const { data: result, error } = await supabase
    .from("chapters")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return result.id;
};

export const updateChapter = async (id, data) => {
  const payload = {};
  if (data.subjectId !== undefined || data.subject_id !== undefined) payload.subject_id = data.subjectId || data.subject_id;
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.displayOrder !== undefined || data.display_order !== undefined) payload.display_order = Number(data.displayOrder ?? data.display_order);
  if (data.active !== undefined) payload.is_published = Boolean(data.active);
  if (data.is_published !== undefined) payload.is_published = Boolean(data.is_published);

  const { error } = await supabase
    .from("chapters")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
};

export const deleteChapter = async (id) => {
  const { error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
