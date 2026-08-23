import {
  Calculator,
  Pi,
  Dna,
  FlaskConical,
  Atom,
  Microscope,
  Brain,
  BookOpen,
  Languages,
  GraduationCap,
  CalendarCheck,
  Layers,
  ClipboardCheck,
  ClipboardList,
  History,
  FileQuestion,
  NotebookPen,
  Download,
  Megaphone,
  Link,
  Book,
  Sparkles,
  Award,
  Library,
  Leaf,
  Zap
} from "lucide-react";

/**
 * Predefined Subject Icon Library
 * Note: These stable string identifiers (icon_name / icon_key) are stored in Supabase 
 * and mapped to Jetpack Compose icons in the Android application.
 */
export const SUBJECT_ICON_REGISTRY = [
  // Subject Core Identifiers
  { key: "language", name: "Language / Text", icon: Languages, category: "Language" },
  { key: "book", name: "Book", icon: Book, category: "Academic" },
  { key: "science", name: "Science", icon: Microscope, category: "Science" },
  { key: "physics", name: "Physics / Atom", icon: Atom, category: "Science" },
  { key: "lightning", name: "Lightning / Physics", icon: Zap, category: "Science" },
  { key: "chemistry", name: "Chemistry / Flask", icon: FlaskConical, category: "Science" },
  { key: "flask", name: "Flask", icon: FlaskConical, category: "Science" },
  { key: "biology", name: "Biology / Leaf", icon: Leaf, category: "Science" },
  { key: "leaf", name: "Leaf", icon: Leaf, category: "Science" },
  { key: "dna", name: "DNA", icon: Dna, category: "Science" },
  { key: "psychology", name: "Psychology / Brain", icon: Brain, category: "Social Science" },
  { key: "brain", name: "Brain", icon: Brain, category: "Social Science" },
  { key: "education", name: "Education", icon: GraduationCap, category: "Education" },
  { key: "graduation", name: "Graduation Cap", icon: GraduationCap, category: "Education" },
  { key: "math", name: "Mathematics", icon: Calculator, category: "Mathematics" },
  { key: "calculator", name: "Calculator", icon: Calculator, category: "Mathematics" },
  { key: "pi", name: "Pi / Math", icon: Pi, category: "Mathematics" },
  { key: "telugu", name: "Telugu", icon: Languages, category: "Language" },
  { key: "english", name: "English", icon: Languages, category: "Language" },
  { key: "marathi", name: "Marathi", icon: Languages, category: "Language" },
  { key: "hindi", name: "Hindi", icon: Languages, category: "Language" },
  { key: "methodology", name: "Methodology", icon: Library, category: "Education" },

  // Generic Academic & Tests
  { key: "book-open", name: "Book Open", icon: BookOpen, category: "Academic" },
  { key: "library", name: "Library", icon: Library, category: "Academic" },
  { key: "calendar-check", name: "Daily Tests", icon: CalendarCheck, category: "Tests" },
  { key: "layers", name: "Chapter Tests", icon: Layers, category: "Tests" },
  { key: "clipboard-check", name: "Practice Tests", icon: ClipboardCheck, category: "Tests" },
  { key: "clipboard-list", name: "Test Series", icon: ClipboardList, category: "Tests" },
  { key: "history", name: "Previous Papers", icon: History, category: "Tests" },
  { key: "file-question", name: "Question Bank", icon: FileQuestion, category: "Tests" },
  { key: "notebook-pen", name: "Notes & PDF", icon: NotebookPen, category: "Resources" },
  { key: "download", name: "Downloads", icon: Download, category: "Resources" },
  { key: "megaphone", name: "Announcements", icon: Megaphone, category: "Resources" },
  { key: "sparkles", name: "Sparkles", icon: Sparkles, category: "Resources" },
  { key: "award", name: "Award", icon: Award, category: "Resources" },
  { key: "link", name: "Links", icon: Link, category: "Resources" }
];

// O(1) key map lookup
export const ICON_MAP = SUBJECT_ICON_REGISTRY.reduce((acc, item) => {
  acc[item.key] = item.icon;
  return acc;
}, {});

// Normalize alternative or legacy icon key strings
export const normalizeIconKey = (key) => {
  if (!key) return null;
  const lower = String(key).trim().toLowerCase();

  if (ICON_MAP[lower]) return lower;

  if (lower.includes("telugu")) return "telugu";
  if (lower.includes("english")) return "english";
  if (lower.includes("marathi")) return "marathi";
  if (lower.includes("hindi")) return "hindi";
  if (lower.includes("phy")) return "physics";
  if (lower.includes("chem")) return "chemistry";
  if (lower.includes("bio")) return "biology";
  if (lower.includes("psych")) return "psychology";
  if (lower.includes("pie") || lower.includes("perspective") || lower.includes("edu")) return "education";
  if (lower.includes("method")) return "methodology";
  if (lower.includes("math")) return "math";
  if (lower.includes("sci")) return "science";
  if (lower.includes("leaf")) return "leaf";
  if (lower.includes("flask")) return "flask";
  if (lower.includes("brain")) return "brain";
  if (lower.includes("grad")) return "graduation";

  return null;
};

/**
 * Returns a Lucide Icon component for a given iconName / iconKey or subjectName.
 */
export const getSubjectIcon = (iconName, subjectName = "") => {
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }

  const normalizedKey = normalizeIconKey(iconName);
  if (normalizedKey && ICON_MAP[normalizedKey]) {
    return ICON_MAP[normalizedKey];
  }

  if (subjectName) {
    const matchedNameKey = normalizeIconKey(subjectName);
    if (matchedNameKey && ICON_MAP[matchedNameKey]) {
      return ICON_MAP[matchedNameKey];
    }
  }

  return Book;
};
