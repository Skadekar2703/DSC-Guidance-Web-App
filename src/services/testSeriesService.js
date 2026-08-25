import { supabase } from "../lib/supabase";

export const addTestSeries = async (data) => {
  let payload = {
    title: data.title,
    description: data.description || "",
    subject_id: data.subjectId || data.subject_id || null,
    class_id: data.classId || data.class_id || null,
    tests: Array.isArray(data.tests) ? data.tests : [],
    pdf_url: data.pdfUrl || data.pdf_url || null,
    storage_path: data.storagePath || data.storage_path || null,
    file_name: data.fileName || data.file_name || null,
    file_size: data.fileSize || data.file_size || null,
    is_published: data.published !== undefined ? Boolean(data.published) : Boolean(data.is_published ?? true),
  };

  let { data: result, error } = await supabase
    .from("test_series")
    .insert([payload])
    .select()
    .single();

  while (error && error.message && error.message.includes("Could not find the")) {
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && payload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`Supabase schema cache missing column '${missingCol}' in test_series. Omitting and retrying insert...`);
      delete payload[missingCol];

      const retryRes = await supabase
        .from("test_series")
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

export const updateTestSeries = async (id, data) => {
  let payload = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.subjectId !== undefined || data.subject_id !== undefined) payload.subject_id = data.subjectId || data.subject_id || null;
  if (data.classId !== undefined || data.class_id !== undefined) payload.class_id = data.classId || data.class_id || null;
  if (data.tests !== undefined) payload.tests = Array.isArray(data.tests) ? data.tests : [];
  if (data.pdfUrl !== undefined || data.pdf_url !== undefined) payload.pdf_url = data.pdfUrl || data.pdf_url;
  if (data.storagePath !== undefined || data.storage_path !== undefined) payload.storage_path = data.storagePath || data.storage_path;
  if (data.fileName !== undefined || data.file_name !== undefined) payload.file_name = data.fileName || data.file_name;
  if (data.fileSize !== undefined || data.file_size !== undefined) payload.file_size = data.fileSize || data.file_size;
  if (data.published !== undefined) payload.is_published = Boolean(data.published);
  if (data.is_published !== undefined) payload.is_published = Boolean(data.is_published);

  let { error } = await supabase
    .from("test_series")
    .update(payload)
    .eq("id", id);

  while (error && error.message && error.message.includes("Could not find the")) {
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && payload[match[1]] !== undefined) {
      const missingCol = match[1];
      console.warn(`Supabase schema cache missing column '${missingCol}' in test_series. Omitting and retrying update...`);
      delete payload[missingCol];

      const retryRes = await supabase
        .from("test_series")
        .update(payload)
        .eq("id", id);

      error = retryRes.error;
    } else {
      break;
    }
  }

  if (error) throw error;
};

export const deleteTestSeries = async (id) => {
  const { error } = await supabase
    .from("test_series")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
