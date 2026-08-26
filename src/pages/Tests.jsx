import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addTest, updateTest, deleteTest } from "../services/testsService";
import { getClassSubjects } from "../services/classSubjectsService";
import { deleteFile } from "../services/storageService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, FileSpreadsheet, ExternalLink, Copy, Check, Link2, FileText } from "lucide-react";

export const Tests = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type"); // DAILY, CHAPTER_WISE, CLASS_WISE, PRACTICE

  // Load parent listings
  const { data: subjects, loading: loadingSubjects } = useSupabaseCollection("subjects", {
    sorting: [["display_order", "asc"]],
  });
  const { data: chapters, loading: loadingChapters } = useSupabaseCollection("chapters", {
    sorting: [["display_order", "asc"]],
  });
  const { data: classes, loading: loadingClasses } = useSupabaseCollection("classes", {
    sorting: [["display_order", "asc"]],
  });
  const { data: tests, loading: loadingTests } = useSupabaseCollection("tests", {
    sorting: [["display_order", "asc"], ["created_at", "desc"]],
  });

  // Class-Subject Junction Map State
  const [classSubjectsMap, setClassSubjectsMap] = useState({});

  useEffect(() => {
    const fetchClassSubjects = async () => {
      try {
        const data = await getClassSubjects();
        const map = {};
        data.forEach((row) => {
          if (!map[row.class_id]) map[row.class_id] = [];
          if (row.subject_id) map[row.class_id].push(row.subject_id);
        });
        setClassSubjectsMap(map);
      } catch (err) {
        console.error("Error loading class-subject mappings:", err);
      }
    };
    fetchClassSubjects();
  }, []);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState(typeParam || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");

  // Keep typeFilter in sync when routing changes
  useEffect(() => {
    if (typeParam) {
      setTypeFilter(typeParam);
    } else {
      setTypeFilter("all");
    }
  }, [typeParam]);

  // Modal forms state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [testType, setTestType] = useState("DAILY");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [dailyTestNumber, setDailyTestNumber] = useState(1);
  const [questionCount, setQuestionCount] = useState(30);
  const [duration, setDuration] = useState(30);
  const [marks, setMarks] = useState(30);
  const [testLink, setTestLink] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [published, setPublished] = useState(true);
  const [accessType, setAccessType] = useState("free");

  // Deletion State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Copy Link State Tracking
  const [copiedId, setCopiedId] = useState(null);

  // Lookups
  const subjectMap = subjects.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {});
  const chapterMap = chapters.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
  const classMap = classes.reduce((acc, cl) => ({ ...acc, [cl.id]: cl.name }), {});

  // Available subjects for forms (all active subjects are available)
  const availableFormSubjects = React.useMemo(() => {
    return subjects;
  }, [subjects]);

  // Form conditional chapters filtering
  const formChapters = React.useMemo(() => {
    if (!subjectId) return [];
    return chapters.filter((c) => c.subjectId === subjectId || c.subject_id === subjectId);
  }, [subjectId, chapters]);

  // Filter tests
  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || test.subjectId === subjectFilter || test.subject_id === subjectFilter;
    const matchesChapter = chapterFilter === "all" || test.chapterId === chapterFilter || test.chapter_id === chapterFilter;
    const matchesClass = classFilter === "all" || test.classId === classFilter || test.class_id === classFilter;
    const matchesType = typeFilter === "all" || test.testType === typeFilter || test.test_type === typeFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "published" && test.published === true) ||
      (statusFilter === "draft" && test.published === false);
    const matchesAccess = accessFilter === "all" || (test.accessType || test.access_type || "free") === accessFilter;

    return matchesSearch && matchesSubject && matchesChapter && matchesClass && matchesType && matchesStatus && matchesAccess;
  });

  const openAddModal = () => {
    setEditTest(null);
    setTitle("");
    setDescription("");
    setTestType(typeParam || "DAILY");
    setSubjectId("");
    setChapterId("");
    setClassId("");
    setDailyTestNumber(1);
    setQuestionCount(10);
    setDuration(15);
    setMarks(10);
    setTestLink("");
    setDisplayOrder(tests.length + 1);
    setPublished(true);
    setAccessType("free");
    setModalOpen(true);
  };

  const openEditModal = (test) => {
    setEditTest(test);
    setTitle(test.title || "");
    setDescription(test.description || "");
    setTestType(test.testType || test.test_type || "DAILY");
    setSubjectId(test.subjectId || test.subject_id || "");
    setChapterId(test.chapterId || test.chapter_id || "");
    setClassId(test.classId || test.class_id || "");
    setDailyTestNumber(test.dailyTestNumber || test.daily_test_number || 1);
    setQuestionCount(test.questionCount || test.question_count || 10);
    setDuration(test.duration || 15);
    setMarks(test.marks || 10);
    setTestLink(test.testLink || test.external_url || test.pdf_url || test.pdfUrl || "");
    setDisplayOrder(test.displayOrder || test.display_order || 1);
    setPublished(test.published !== false);
    setAccessType(test.accessType || test.access_type || "free");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalLink = testLink.trim();
    if (!title.trim() || !finalLink || !subjectId) {
      showToast("Title, External URL / Form Link, and Subject are required.", "warning");
      return;
    }

    if (finalLink && !finalLink.startsWith("http")) {
      showToast("Please provide a valid test URL starting with http:// or https://", "warning");
      return;
    }

    setFormLoading(true);
    const testData = {
      title: title.trim(),
      description: description.trim(),
      testType,
      subjectId,
      chapterId: chapterId || null,
      classId: classId || null,
      dailyTestNumber: testType === "DAILY" ? Number(dailyTestNumber) : null,
      questionCount: Number(questionCount),
      duration: Number(duration),
      marks: Number(marks),
      testLink: finalLink,
      external_url: finalLink,
      pdfUrl: null,
      storagePath: "",
      fileName: null,
      fileSize: null,
      displayOrder: Number(displayOrder),
      published: Boolean(published),
      active: true,
      accessType,
      access_type: accessType,
    };

    try {
      if (editTest) {
        await updateTest(editTest.id, testData);

        // Clean up old storage file if editing an old record that had a storage path
        const oldStoragePath = editTest.storagePath || editTest.storage_path;
        if (oldStoragePath) {
          try {
            await deleteFile(oldStoragePath);
          } catch (storageErr) {
            console.warn("Storage cleanup warning:", storageErr);
          }
        }

        showToast("Test updated successfully.", "success");
      } else {
        await addTest(testData);
        showToast("Test created successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Test save error:", err);
      showToast(err.message || "Failed to save test.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrigger = (test) => {
    setDeleteId(test.id);
    setDeleteName(test.title);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const testToDelete = tests.find((t) => t.id === deleteId);
      await deleteTest(deleteId);

      const targetPath = testToDelete?.storagePath || testToDelete?.storage_path;
      if (targetPath) {
        try {
          await deleteFile(targetPath);
        } catch (storageErr) {
          console.warn("Storage file deletion warning:", storageErr);
        }
      }

      showToast(`Test "${deleteName}" deleted successfully.`, "success");
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete practice test.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const togglePublished = async (test) => {
    try {
      await updateTest(test.id, {
        published: !test.published
      });
      showToast(`Publication status updated.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle status.", "danger");
    }
  };

  const copyToClipboard = async (id, linkUrl) => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopiedId(id);
      showToast("Test link copied to clipboard!", "success");
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error(err);
      showToast("Could not copy link to clipboard.", "danger");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quizzes & Exam Links Directory</h1>
          <p className="text-xs text-slate-400 mt-1">Manage online practice tests, daily quizzes, and Google Form links.</p>
        </div>
        <Button
          onClick={openAddModal}
          icon={Plus}
          disabled={subjects.length === 0}
          className="shadow-lg shadow-primary/10"
        >
          Add Test Link
        </Button>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-4 shrink-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by test title or description..."
          />
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <label className="text-slate-400">Class:</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-400">Subject:</label>
              <select
                value={subjectFilter}
                onChange={(e) => {
                  setSubjectFilter(e.target.value);
                  setChapterFilter("all");
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="all">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            {subjectFilter !== "all" && (
              <div className="flex items-center gap-2">
                <label className="text-slate-400">Chapter:</label>
                <select
                  value={chapterFilter}
                  onChange={(e) => setChapterFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                >
                  <option value="all">All Chapters</option>
                  {chapters
                    .filter((c) => c.subjectId === subjectFilter)
                    .map((chap) => (
                      <option key={chap.id} value={chap.id}>{chap.name}</option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 border-t border-slate-50 pt-3">
          <div className="flex items-center gap-2">
            <label className="text-slate-400">Test Category:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="all">All Test Categories</option>
              <option value="DAILY">Daily Tests</option>
              <option value="CHAPTER_WISE">Chapter-wise Tests</option>
              <option value="CLASS_WISE">Class-wise Tests</option>
              <option value="PRACTICE">Practice Mocks</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400">Access:</label>
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="all">All Access</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tests Content List - Responsive Layout */}
      {loadingSubjects || loadingChapters || loadingClasses || loadingTests ? (
        <LoadingSpinner message="Retrieving test directory..." />
      ) : filteredTests.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Tests Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Click "Add Test Link" or adjust query filters to show practice exams.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (hidden on mobile, visible md+) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5 w-2/5">Test</th>
                    <th className="px-4 py-3.5">Class</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Access</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {filteredTests.map((test) => {
                    const testUrl = test.testLink || test.external_url || "";
                    const isPremium = (test.accessType || test.access_type || "free") === "premium";

                    return (
                      <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Test Title & Description */}
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0 mt-0.5">
                              <FileSpreadsheet className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-800 text-sm leading-snug">{test.title}</div>
                              {test.description && (
                                <p className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">
                                  {test.description}
                                </p>
                              )}
                              <div className="text-[11px] text-slate-400 font-semibold mt-1">
                                {test.questionCount || 30} Qs • {test.duration || 30} Mins • {test.marks || 30} Marks
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Class */}
                        <td className="px-4 py-4 font-semibold text-xs text-slate-600">
                          {classMap[test.classId] || "All Classes"}
                        </td>

                        {/* Subject */}
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {subjectMap[test.subjectId] || "Unassigned"}
                          </div>
                          {test.chapterId && chapterMap[test.chapterId] && (
                            <div className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                              {chapterMap[test.chapterId]}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] uppercase rounded-lg border border-slate-200">
                            {test.testType || "DAILY"}
                          </span>
                        </td>

                        {/* Access */}
                        <td className="px-4 py-4">
                          {isPremium ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-[10px] uppercase rounded-lg border border-amber-200">
                              ⭐ PREMIUM
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase rounded-lg border border-emerald-200">
                              FREE
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() => togglePublished(test)}
                            className="cursor-pointer"
                          >
                            {test.published !== false ? (
                              <span className="flex items-center gap-1 w-fit px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                                <Eye className="h-3 w-3" /> Published
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 w-fit px-2.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-xs font-bold rounded-full">
                                <EyeOff className="h-3 w-3" /> Draft
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Actions: Open Link, Edit, Delete */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {testUrl && (
                              <a
                                href={testUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
                                title="Open Link"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Open Link</span>
                              </a>
                            )}
                            <button
                              onClick={() => openEditModal(test)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Test"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrigger(test)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Test"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards View (visible on mobile, hidden md+) */}
          <div className="block md:hidden space-y-4">
            {filteredTests.map((test) => {
              const testUrl = test.testLink || test.external_url || "";
              const isPremium = (test.accessType || test.access_type || "free") === "premium";

              return (
                <div
                  key={test.id}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0 mt-0.5">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm leading-snug">{test.title}</h3>
                        {test.description && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-2">
                            {test.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {isPremium ? (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full">
                        ⭐ PREMIUM
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                        FREE
                      </span>
                    )}

                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold uppercase rounded-full">
                      {test.testType || "DAILY"}
                    </span>

                    <button
                      onClick={() => togglePublished(test)}
                      className="cursor-pointer"
                    >
                      {test.published !== false ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                          <Eye className="h-3 w-3" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-[10px] font-bold rounded-full">
                          <EyeOff className="h-3 w-3" /> Draft
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Class & Subject</span>
                      <span className="font-semibold text-slate-700">
                        {classMap[test.classId] || "All Classes"} • {subjectMap[test.subjectId] || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Test Specs</span>
                      <span className="font-semibold text-slate-700">
                        {test.questionCount || 30} Qs • {test.duration || 30}m • {test.marks || 30} Marks
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {testUrl ? (
                      <a
                        href={testUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-all cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open Link</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No URL set</span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(test)}
                        className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit Test"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrigger(test)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Test"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CRUD Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTest ? "Edit Test Link" : "Create New Practice Test"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Test Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily Biology Quiz - Test #12"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
            />
          </div>

          {/* Test Resource Source (URL Only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              External URL / Form Link <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="url"
                value={testLink}
                onChange={(e) => setTestLink(e.target.value)}
                placeholder="Paste test URL..."
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Subject selection first, followed by Class Grade (optional for independent subjects) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject <span className="text-red-500">*</span></label>
              <select
                value={subjectId}
                onChange={(e) => {
                  const newSubjectId = e.target.value;
                  setSubjectId(newSubjectId);
                  setChapterId("");
                }}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white font-medium"
              >
                <option value="">Select subject...</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class Grade</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
              >
                <option value="">All Classes / Not Applicable</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Category & Chapter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Test Category Type</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                <option value="DAILY">DAILY TEST</option>
                <option value="CHAPTER_WISE">CHAPTER-WISE TEST</option>
                <option value="CLASS_WISE">CLASS-WISE TEST</option>
                <option value="PRACTICE">PRACTICE MOCK</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chapter Category (Optional)</label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                disabled={!subjectId}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {!subjectId ? (
                  <option value="">Select subject first...</option>
                ) : formChapters.length === 0 ? (
                  <option value="">No Chapter (Subject-level)</option>
                ) : (
                  <>
                    <option value="">No Chapter (Subject-level)</option>
                    {formChapters.map((chap) => (
                      <option key={chap.id} value={chap.id}>{chap.name}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe quiz topics, instructions..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none resize-none"
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Questions</label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                min={1}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Duration (Mins)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min={1}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Marks</label>
              <input
                type="number"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                min={1}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Order & Access Control & Publish toggler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                min={1}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Publish Status</label>
              <div className="flex items-center h-11">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-success after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  <span className="ml-3 text-sm font-semibold text-slate-600">
                    {published ? "Published" : "Draft"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Access Control</label>
            <div className="flex items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="testAccessType"
                  value="free"
                  checked={accessType === "free"}
                  onChange={(e) => setAccessType(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-700">Free</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="testAccessType"
                  value="premium"
                  checked={accessType === "premium"}
                  onChange={(e) => setAccessType(e.target.value)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
                  ⭐ Premium
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 shrink-0">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {editTest ? "Save Test" : "Create Test"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Practice Test?"
        message={`Are you sure you want to delete test "${deleteName}"?`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Tests;
