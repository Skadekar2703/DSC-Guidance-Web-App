import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Collection name to Supabase table name mapping
const TABLE_MAP = {
  subjects: "subjects",
  chapters: "chapters",
  classes: "classes",
  materials: "materials",
  pyqPapers: "previous_year_questions",
  previous_year_questions: "previous_year_questions",
  tests: "tests",
  testSeries: "test_series",
  test_series: "test_series",
  resources: "resources",
  importantTopics: "important_topics",
  important_topics: "important_topics",
  generalScience: "general_science",
  general_science: "general_science",
  admins: "profiles",
  profiles: "profiles",
};

/**
 * Normalizes PostgreSQL row fields to match UI expectations.
 */
export const normalizeRow = (row) => {
  if (!row) return row;

  const createdAt = row.created_at ? new Date(row.created_at) : new Date();
  const seconds = Math.floor(createdAt.getTime() / 1000);

  return {
    ...row,
    id: row.id,
    name: row.name || row.full_name || "",
    full_name: row.full_name || row.name || "",
    description: row.description || "",
    subjectId: row.subject_id || row.subjectId || null,
    chapterId: row.chapter_id || row.chapterId || null,
    classId: row.class_id || row.classId || null,
    displayOrder: row.display_order ?? row.displayOrder ?? 0,
    color: row.brand_color || row.color || "#16A34A",
    coverImage: row.cover_image || row.coverImage || "",
    active: row.is_published ?? row.is_active ?? row.active ?? true,
    published: row.is_published ?? row.published ?? true,
    type: row.material_type || row.type || "PDF",
    materialType: row.material_type || row.materialType || "PDF",
    pdfUrl: row.pdf_url || row.pdfUrl || "",
    storagePath: row.storage_path || row.storagePath || "",
    fileName: row.file_name || row.fileName || "",
    fileSize: row.file_size || row.fileSize || 0,
    externalUrl: row.external_url || row.externalUrl || "",
    testLink: row.external_url || row.testLink || "",
    examType: row.exam_type || row.examType || "DSC",
    year: row.year || new Date().getFullYear(),
    testType: row.test_type || row.testType || "PRACTICE",
    questionCount: row.question_count ?? row.questionCount ?? 0,
    duration: row.duration ?? 0,
    marks: row.total_marks ?? row.marks ?? 0,
    resourceType: row.resource_type || row.resourceType || "PDF",
    thumbnailUrl: row.thumbnail_url || row.thumbnailUrl || "",
    logoUrl: row.logo_url || row.logoUrl || null,
    logo_url: row.logo_url || row.logoUrl || null,
    bannerUrl: row.banner_url || row.bannerUrl || null,
    banner_url: row.banner_url || row.bannerUrl || null,
    role: row.role || "tutor",
    createdAt: {
      seconds,
      toDate: () => createdAt,
      toISOString: () => createdAt.toISOString(),
    },
    created_at: row.created_at,
  };
};

/**
 * Custom hook to listen to a Supabase table in real-time.
 * @param {string} collectionName Collection/Table identifier
 * @param {object} [options]
 * @param {Array} [options.filters] e.g. [['subject_id', 'eq', id], ['is_published', 'eq', true]]
 * @param {Array} [options.sorting] e.g. [['display_order', 'asc'], ['created_at', 'desc']]
 * @returns {{ data: Array, loading: boolean, error: any }}
 */
export const useSupabaseCollection = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tableName = TABLE_MAP[collectionName] || collectionName;
  const filtersStr = JSON.stringify(options.filters || []);
  const sortingStr = JSON.stringify(options.sorting || []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        let query = supabase.from(tableName).select("*");

        // Apply filters
        const parsedFilters = JSON.parse(filtersStr);
        parsedFilters.forEach(([field, op, val]) => {
          if (val !== undefined && val !== null && val !== "") {
            // Map legacy field names to DB column names if necessary
            let col = field;
            if (field === "subjectId") col = "subject_id";
            if (field === "chapterId") col = "chapter_id";
            if (field === "classId") col = "class_id";
            if (field === "published" || field === "active") col = "is_published";
            if (field === "role") col = "role";

            let supabaseOp = op;
            if (op === "==") supabaseOp = "eq";
            if (op === "!=") supabaseOp = "neq";

            if (supabaseOp === "eq") query = query.eq(col, val);
            else if (supabaseOp === "neq") query = query.neq(col, val);
            else if (supabaseOp === "in") query = query.in(col, val);
          }
        });

        // Apply sorting
        const parsedSorting = JSON.parse(sortingStr);
        if (parsedSorting.length > 0) {
          parsedSorting.forEach(([field, direction]) => {
            let col = field;
            if (field === "createdAt") col = "created_at";
            if (field === "displayOrder") col = "display_order";
            const ascending = direction === "asc" || direction === "ASC";
            query = query.order(col, { ascending });
          });
        } else {
          // Default sorting by created_at desc if available
          query = query.order("created_at", { ascending: false });
        }

        const { data: rows, error: fetchErr } = await query;

        if (fetchErr) throw fetchErr;

        if (isMounted) {
          setData((rows || []).map(normalizeRow));
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error(`Error querying ${tableName}:`, err);
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    fetchData();

    // Subscribe to Realtime postgres_changes
    const channel = supabase
      .channel(`public:${tableName}:${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [tableName, filtersStr, sortingStr]);

  return { data, loading, error };
};

// Aliases for compatibility
export const useFirestoreCollection = useSupabaseCollection;

export default useSupabaseCollection;
