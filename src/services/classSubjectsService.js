import { supabase } from "../lib/supabase";

/**
 * Fetch all class-subject mappings with subject details.
 */
export const getClassSubjects = async () => {
  try {
    const { data, error } = await supabase
      .from("class_subjects")
      .select("id, class_id, subject_id, subjects(*)");

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
        console.warn("Table 'class_subjects' not found in Supabase schema.");
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (err) {
    console.warn("Could not query class_subjects junction table:", err.message);
    return [];
  }
};

/**
 * Fetch assigned subject IDs for a specific class ID.
 * @param {string} classId 
 * @returns {Promise<string[]>} List of subject UUIDs
 */
export const getSubjectIdsForClass = async (classId) => {
  if (!classId) return [];
  try {
    const { data, error } = await supabase
      .from("class_subjects")
      .select("subject_id")
      .eq("class_id", classId);

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
        return [];
      }
      throw error;
    }
    return (data || []).map((row) => row.subject_id);
  } catch (err) {
    console.error("Error fetching subjects for class:", err);
    return [];
  }
};

/**
 * Set assigned subject IDs for a specific class ID.
 * Replaces existing assignments atomically.
 * @param {string} classId 
 * @param {string[]} subjectIds 
 */
export const updateClassSubjects = async (classId, subjectIds = []) => {
  if (!classId) return;

  try {
    // 1. Delete existing subjects for this class
    const { error: deleteError } = await supabase
      .from("class_subjects")
      .delete()
      .eq("class_id", classId);

    if (deleteError) {
      if (deleteError.code === "PGRST205" || deleteError.message?.includes("Could not find the table")) {
        throw new Error("Table 'class_subjects' does not exist in Supabase database. Please run the SQL migration in Supabase SQL Editor.");
      }
      throw deleteError;
    }

    // 2. Insert new subjects if any provided
    if (subjectIds.length > 0) {
      const rowsToInsert = subjectIds.map((subId) => ({
        class_id: classId,
        subject_id: subId,
      }));

      const { error: insertError } = await supabase
        .from("class_subjects")
        .insert(rowsToInsert);

      if (insertError) {
        if (insertError.code === "PGRST205" || insertError.message?.includes("Could not find the table")) {
          throw new Error("Table 'class_subjects' does not exist in Supabase database. Please run the SQL migration in Supabase SQL Editor.");
        }
        throw insertError;
      }
    }
  } catch (err) {
    if (err.code === "PGRST205" || err.message?.includes("Could not find the table")) {
      throw new Error("Table 'class_subjects' does not exist in Supabase database. Please run the SQL migration in Supabase SQL Editor.");
    }
    throw err;
  }
};
