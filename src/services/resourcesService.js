import { supabase } from "../lib/supabase";

export const addResource = async (data) => {
  const payload = {
    title: data.title,
    description: data.description || "",
    subject_id: data.subjectId || data.subject_id || null,
    chapter_id: data.chapterId || data.chapter_id || null,
    class_id: data.classId || data.class_id || null,
    resource_type: data.resourceType || data.resource_type || "PDF",
    url: data.url || null,
    storage_path: data.storagePath || data.storage_path || null,
    thumbnail_url: data.thumbnailUrl || data.thumbnail_url || null,
    is_published: data.published !== undefined ? Boolean(data.published) : Boolean(data.is_published ?? true),
  };

  const { data: result, error } = await supabase
    .from("resources")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return result.id;
};

export const updateResource = async (id, data) => {
  const payload = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.subjectId !== undefined || data.subject_id !== undefined) payload.subject_id = data.subjectId || data.subject_id || null;
  if (data.chapterId !== undefined || data.chapter_id !== undefined) payload.chapter_id = data.chapterId || data.chapter_id || null;
  if (data.classId !== undefined || data.class_id !== undefined) payload.class_id = data.classId || data.class_id || null;
  if (data.resourceType !== undefined || data.resource_type !== undefined) payload.resource_type = data.resourceType || data.resource_type;
  if (data.url !== undefined) payload.url = data.url;
  if (data.storagePath !== undefined || data.storage_path !== undefined) payload.storage_path = data.storagePath || data.storage_path;
  if (data.thumbnailUrl !== undefined || data.thumbnail_url !== undefined) payload.thumbnail_url = data.thumbnailUrl || data.thumbnail_url;
  if (data.published !== undefined) payload.is_published = Boolean(data.published);
  if (data.is_published !== undefined) payload.is_published = Boolean(data.is_published);

  const { error } = await supabase
    .from("resources")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
};

export const deleteResource = async (id) => {
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
