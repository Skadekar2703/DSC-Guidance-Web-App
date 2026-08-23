/**
 * Core Predefined Subject Catalogue for DSC Guidance
 * 
 * Rules:
 * 1. Class-based subjects have predefined class ranges (e.g. 3–10 or 3–Intermediate).
 * 2. Independent subjects have no class association (class_range: null).
 * 3. Admins manage and edit details for these core subjects; duplicate creation is prevented.
 * 4. Each predefined subject has a default icon_name and icon_color.
 */

export const PREDEFINED_SUBJECTS = [
  {
    name: "Telugu",
    subject_type: "class_based",
    class_range: "3-10",
    default_icon_name: "language",
    default_icon_key: "language",
    default_background_color: "#EDE7F6",
    default_icon_color: "#EDE7F6",
    description: "Telugu Language & Literature",
    display_order: 1,
  },
  {
    name: "English",
    subject_type: "class_based",
    class_range: "3-10",
    default_icon_name: "language",
    default_icon_key: "language",
    default_background_color: "#E3F2FD",
    default_icon_color: "#E3F2FD",
    description: "English Language & Grammar",
    display_order: 2,
  },
  {
    name: "Physics",
    subject_type: "class_based",
    class_range: "3-10",
    default_icon_name: "physics",
    default_icon_key: "physics",
    default_background_color: "#E0F7FA",
    default_icon_color: "#E0F7FA",
    description: "Physical Sciences & Physics",
    display_order: 3,
  },
  {
    name: "Chemistry",
    subject_type: "class_based",
    class_range: "3-10",
    default_icon_name: "chemistry",
    default_icon_key: "chemistry",
    default_background_color: "#FFF3E0",
    default_icon_color: "#FFF3E0",
    description: "Chemical Sciences & Chemistry",
    display_order: 4,
  },
  {
    name: "Biology",
    subject_type: "class_based",
    class_range: "3-intermediate",
    default_icon_name: "biology",
    default_icon_key: "biology",
    default_background_color: "#E8F5E9",
    default_icon_color: "#E8F5E9",
    description: "Biological Sciences & Life Sciences",
    display_order: 5,
  },
  {
    name: "Psychology",
    subject_type: "independent",
    class_range: null,
    default_icon_name: "psychology",
    default_icon_key: "psychology",
    default_background_color: "#F3E5F5",
    default_icon_color: "#F3E5F5",
    description: "Educational Psychology & Child Development",
    display_order: 6,
  },
  {
    name: "Perspective in Education",
    subject_type: "independent",
    class_range: null,
    default_icon_name: "education",
    default_icon_key: "education",
    default_background_color: "#FFF8E1",
    default_icon_color: "#FFF8E1",
    description: "Perspectives in Education (PIE)",
    display_order: 7,
  },
  {
    name: "Biology Methodology",
    subject_type: "independent",
    class_range: null,
    default_icon_name: "methodology",
    default_icon_key: "methodology",
    default_background_color: "#E8F5E9",
    default_icon_color: "#E8F5E9",
    description: "Teaching Methodology for Biology",
    display_order: 8,
  },
  {
    name: "Physics Methodology",
    subject_type: "independent",
    class_range: null,
    default_icon_name: "methodology",
    default_icon_key: "methodology",
    default_background_color: "#E0F7FA",
    default_icon_color: "#E0F7FA",
    description: "Teaching Methodology for Physics",
    display_order: 9,
  },
];

/**
 * Finds predefined subject metadata by name (case-insensitive).
 */
export const getPredefinedSubjectByName = (name) => {
  if (!name) return null;
  const cleanName = String(name).trim().toLowerCase();
  return PREDEFINED_SUBJECTS.find((s) => s.name.toLowerCase() === cleanName) || null;
};

/**
 * Helper to check if a given subject is independent.
 */
export const isIndependentSubject = (subject) => {
  if (!subject) return false;
  if (subject.subject_type === "independent") return true;
  const predefined = getPredefinedSubjectByName(subject.name);
  return predefined ? predefined.subject_type === "independent" : false;
};

/**
 * Helper to format display string for class range.
 */
export const formatClassRange = (subject) => {
  if (!subject) return "Classes: Not applicable";
  if (isIndependentSubject(subject)) {
    return "Classes: Not applicable";
  }

  const range = subject.class_range || getPredefinedSubjectByName(subject.name)?.class_range || "3-10";
  if (range.toLowerCase() === "3-10") return "Classes 3–10";
  if (range.toLowerCase() === "3-intermediate") return "Classes 3–Intermediate";
  return `Classes ${range}`;
};
