import { supabase } from "../lib/supabase";

export const addTestSeries = async (data) => {
  const payload = {
    title: data.title,
    description: data.description || "",
    subject_id: data.subjectId || data.subject_id || null,
    class_id: data.classId || data.class_id || null,
    tests: Array.isArray(data.tests) ? data.tests : [],
    is_published: data.published !== undefined ? Boolean(data.published) : Boolean(data.is_published ?? true),
  };

  const { data: result, error } = await supabase
    .from("test_series")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return result.id;
};

export const updateTestSeries = async (id, data) => {
  const payload = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.subjectId !== undefined || data.subject_id !== undefined) payload.subject_id = data.subjectId || data.subject_id || null;
  if (data.classId !== undefined || data.class_id !== undefined) payload.class_id = data.classId || data.class_id || null;
  if (data.tests !== undefined) payload.tests = Array.isArray(data.tests) ? data.tests : [];
  if (data.published !== undefined) payload.is_published = Boolean(data.published);
  if (data.is_published !== undefined) payload.is_published = Boolean(data.is_published);

  const { error } = await supabase
    .from("test_series")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
};

export const deleteTestSeries = async (id) => {
  const { error } = await supabase
    .from("test_series")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
