import { supabase } from "../lib/supabase";

export const addPyqPaper = async (data) => {
  let payload = {
    title: data.title,
    exam_type: data.examType || data.exam_type || "DSC",
    year: Number(data.year || new Date().getFullYear()),
    subject_id: data.subjectId || data.subject_id || null,
    chapter_id: data.chapterId || data.chapter_id || null,
    class_id: data.classId || data.class_id || null,
    description: data.description || "",
    file_name: data.fileName || data.file_name || null,
    storage_path: data.storagePath || data.storage_path || null,
    pdf_url: data.pdfUrl || data.pdf_url || null,
    external_url: data.externalUrl || data.external_url || null,
    display_order: Number(data.displayOrder ?? data.display_order ?? 0),
    is_published: data.published !== undefined ? Boolean(data.published) : Boolean(data.is_published ?? true),
    access_type: data.accessType || data.access_type || "free",
  };

  let { data: result, error } = await supabase
    .from("previous_year_questions")
    .insert([payload])
    .select()
    .single();

  while (error && error.message && error.message.includes("Could not find the")) {
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && payload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`Supabase schema cache missing column '${missingCol}' in previous_year_questions. Omitting and retrying insert...`);
      delete payload[missingCol];

      const retryRes = await supabase
        .from("previous_year_questions")
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
  return result?.id;
};

export const updatePyqPaper = async (id, data) => {
  let payload = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.examType !== undefined || data.exam_type !== undefined) payload.exam_type = data.examType || data.exam_type;
  if (data.year !== undefined) payload.year = Number(data.year);
  if (data.subjectId !== undefined || data.subject_id !== undefined) payload.subject_id = data.subjectId || data.subject_id || null;
  if (data.chapterId !== undefined || data.chapter_id !== undefined) payload.chapter_id = data.chapterId || data.chapter_id || null;
  if (data.classId !== undefined || data.class_id !== undefined) payload.class_id = data.classId || data.class_id || null;
  if (data.description !== undefined) payload.description = data.description;
  if (data.fileName !== undefined || data.file_name !== undefined) payload.file_name = data.fileName || data.file_name;
  if (data.storagePath !== undefined || data.storage_path !== undefined) payload.storage_path = data.storagePath || data.storage_path;
  if (data.pdfUrl !== undefined || data.pdf_url !== undefined) payload.pdf_url = data.pdfUrl || data.pdf_url;
  if (data.externalUrl !== undefined || data.external_url !== undefined) payload.external_url = data.externalUrl || data.external_url;
  if (data.displayOrder !== undefined || data.display_order !== undefined) payload.display_order = Number(data.displayOrder ?? data.display_order);
  if (data.published !== undefined) payload.is_published = Boolean(data.published);
  if (data.is_published !== undefined) payload.is_published = Boolean(data.is_published);
  if (data.accessType !== undefined || data.access_type !== undefined) payload.access_type = data.accessType || data.access_type;

  let { error } = await supabase
    .from("previous_year_questions")
    .update(payload)
    .eq("id", id);

  while (error && error.message && error.message.includes("Could not find the")) {
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && payload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`Supabase schema cache missing column '${missingCol}' in previous_year_questions. Omitting and retrying update...`);
      delete payload[missingCol];

      const retryRes = await supabase
        .from("previous_year_questions")
        .update(payload)
        .eq("id", id);

      error = retryRes.error;
    } else {
      break;
    }
  }

  if (error) throw error;
};

export const deletePyqPaper = async (id) => {
  const { error } = await supabase
    .from("previous_year_questions")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
