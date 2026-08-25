import { supabase } from "../lib/supabase";

export const addTest = async (data) => {
  let payload = {
    title: data.title,
    description: data.description || "",
    test_type: data.testType || data.test_type || "PRACTICE",
    subject_id: data.subjectId || data.subject_id || null,
    chapter_id: data.chapterId || data.chapter_id || null,
    class_id: data.classId || data.class_id || null,
    question_count: Number(data.questionCount ?? data.question_count ?? 0),
    duration: Number(data.duration ?? 0),
    total_marks: Number(data.marks ?? data.total_marks ?? 0),
    external_url: data.testLink || data.external_url || data.externalUrl || "",
    pdf_url: data.pdfUrl || data.pdf_url || data.testLink || null,
    storage_path: data.storagePath || data.storage_path || null,
    file_name: data.fileName || data.file_name || null,
    file_size: data.fileSize || data.file_size || null,
    display_order: Number(data.displayOrder ?? data.display_order ?? 0),
    is_published: data.published !== undefined ? Boolean(data.published) : (data.active !== undefined ? Boolean(data.active) : Boolean(data.is_published ?? true)),
  };

  let { data: result, error } = await supabase
    .from("tests")
    .insert([payload])
    .select()
    .single();

  // Retry omitting unmigrated columns if Supabase schema cache doesn't have them yet
  while (error && error.message && error.message.includes("Could not find the")) {
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && payload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`Supabase schema cache missing column '${missingCol}' in tests table. Omitting and retrying insert...`);
      delete payload[missingCol];

      const retryRes = await supabase
        .from("tests")
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

export const updateTest = async (id, data) => {
  let payload = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.testType !== undefined || data.test_type !== undefined) payload.test_type = data.testType || data.test_type;
  if (data.subjectId !== undefined || data.subject_id !== undefined) payload.subject_id = data.subjectId || data.subject_id || null;
  if (data.chapterId !== undefined || data.chapter_id !== undefined) payload.chapter_id = data.chapterId || data.chapter_id || null;
  if (data.classId !== undefined || data.class_id !== undefined) payload.class_id = data.classId || data.class_id || null;
  if (data.questionCount !== undefined || data.question_count !== undefined) payload.question_count = Number(data.questionCount ?? data.question_count);
  if (data.duration !== undefined) payload.duration = Number(data.duration);
  if (data.marks !== undefined || data.total_marks !== undefined) payload.total_marks = Number(data.marks ?? data.total_marks);
  if (data.testLink !== undefined || data.external_url !== undefined || data.externalUrl !== undefined) payload.external_url = data.testLink || data.external_url || data.externalUrl;
  if (data.pdfUrl !== undefined || data.pdf_url !== undefined) payload.pdf_url = data.pdfUrl || data.pdf_url;
  if (data.storagePath !== undefined || data.storage_path !== undefined) payload.storage_path = data.storagePath || data.storage_path;
  if (data.fileName !== undefined || data.file_name !== undefined) payload.file_name = data.fileName || data.file_name;
  if (data.fileSize !== undefined || data.file_size !== undefined) payload.file_size = data.fileSize || data.file_size;
  if (data.displayOrder !== undefined || data.display_order !== undefined) payload.display_order = Number(data.displayOrder ?? data.display_order);
  if (data.published !== undefined) payload.is_published = Boolean(data.published);
  if (data.active !== undefined) payload.is_published = Boolean(data.active);
  if (data.is_published !== undefined) payload.is_published = Boolean(data.is_published);

  let { error } = await supabase
    .from("tests")
    .update(payload)
    .eq("id", id);

  // Retry omitting unmigrated columns if Supabase schema cache doesn't have them yet
  while (error && error.message && error.message.includes("Could not find the")) {
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && payload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`Supabase schema cache missing column '${missingCol}' in tests table. Omitting and retrying update...`);
      delete payload[missingCol];

      const retryRes = await supabase
        .from("tests")
        .update(payload)
        .eq("id", id);

      error = retryRes.error;
    } else {
      break;
    }
  }

  if (error) throw error;
};

export const deleteTest = async (id) => {
  const { error } = await supabase
    .from("tests")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
