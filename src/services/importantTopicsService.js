import { supabase } from "../lib/supabase";

export const addImportantTopic = async (data) => {
  const payload = {
    title: data.title,
    description: data.description || "",
    subject_id: data.subjectId || data.subject_id || null,
    chapter_id: data.chapterId || data.chapter_id || null,
    class_id: data.classId || data.class_id || null,
    file_name: data.fileName || data.file_name || null,
    storage_path: data.storagePath || data.storage_path || null,
    pdf_url: data.pdfUrl || data.pdf_url || null,
    external_url: data.externalUrl || data.external_url || null,
    display_order: Number(data.displayOrder ?? data.display_order ?? 0),
    is_published: data.published !== undefined ? Boolean(data.published) : Boolean(data.is_published ?? true),
  };

  const { data: result, error } = await supabase
    .from("important_topics")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return result.id;
};

export const updateImportantTopic = async (id, data) => {
  const payload = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.subjectId !== undefined || data.subject_id !== undefined) payload.subject_id = data.subjectId || data.subject_id || null;
  if (data.chapterId !== undefined || data.chapter_id !== undefined) payload.chapter_id = data.chapterId || data.chapter_id || null;
  if (data.classId !== undefined || data.class_id !== undefined) payload.class_id = data.classId || data.class_id || null;
  if (data.fileName !== undefined || data.file_name !== undefined) payload.file_name = data.fileName || data.file_name;
  if (data.storagePath !== undefined || data.storage_path !== undefined) payload.storage_path = data.storagePath || data.storage_path;
  if (data.pdfUrl !== undefined || data.pdf_url !== undefined) payload.pdf_url = data.pdfUrl || data.pdf_url;
  if (data.externalUrl !== undefined || data.external_url !== undefined) payload.external_url = data.externalUrl || data.external_url;
  if (data.displayOrder !== undefined || data.display_order !== undefined) payload.display_order = Number(data.displayOrder ?? data.display_order);
  if (data.published !== undefined) payload.is_published = Boolean(data.published);
  if (data.is_published !== undefined) payload.is_published = Boolean(data.is_published);

  const { error } = await supabase
    .from("important_topics")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
};

export const deleteImportantTopic = async (id) => {
  const { error } = await supabase
    .from("important_topics")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
