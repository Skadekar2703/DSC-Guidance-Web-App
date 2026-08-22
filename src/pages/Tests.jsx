import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addTest, updateTest, deleteTest } from "../services/testsService";
import { getClassSubjects } from "../services/classSubjectsService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, FileSpreadsheet, ExternalLink, Copy, Check } from "lucide-react";

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

  // Dependent Subjects logic based on selected Class
  const availableFormSubjects = React.useMemo(() => {
    if (!classId) return [];
    const assignedIds = classSubjectsMap[classId];
    if (!assignedIds || assignedIds.length === 0) {
      return subjects;
    }
    return subjects.filter((sub) => assignedIds.includes(sub.id));
  }, [classId, classSubjectsMap, subjects]);

  // Form conditional chapters filtering
  const formChapters = React.useMemo(() => {
    if (!subjectId) return [];
    return chapters.filter((c) => c.subjectId === subjectId || c.subject_id === subjectId);
  }, [subjectId, chapters]);

  // Filter tests
  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || test.subjectId === subjectFilter;
    const matchesChapter = chapterFilter === "all" || test.chapterId === chapterFilter;
    const matchesClass = classFilter === "all" || test.classId === classFilter;
    const matchesType = typeFilter === "all" || test.testType === typeFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "published" && test.published === true) ||
      (statusFilter === "draft" && test.published === false);

    return matchesSearch && matchesSubject && matchesChapter && matchesClass && matchesType && matchesStatus;
  });

  const openAddModal = () => {
    setEditTest(null);
    setTitle("");
    setDescription("");
    setTestType(typeParam || "DAILY");
    setClassId("");
    setSubjectId("");
    setChapterId("");
    setDailyTestNumber(tests.length + 1);
    setQuestionCount(30);
    setDuration(30);
    setMarks(30);
    setTestLink("");
    setDisplayOrder(tests.length + 1);
    setPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (test) => {
    setEditTest(test);
    setTitle(test.title || "");
    setDescription(test.description || "");
    setTestType(test.testType || "DAILY");
    setClassId(test.classId || "");
    setSubjectId(test.subjectId || "");
    setChapterId(test.chapterId || "");
    setDailyTestNumber(test.dailyTestNumber || 1);
    setQuestionCount(test.questionCount || 30);
    setDuration(test.duration || 30);
    setMarks(test.marks || 30);
    setTestLink(test.testLink || test.external_url || "");
    setDisplayOrder(test.displayOrder || 1);
    setPublished(test.published !== false);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !testLink.trim() || !classId || !subjectId) {
      showToast("Title, Test Link URL, Class Grade, and Subject are required.", "warning");
      return;
    }

    if (!testLink.trim().startsWith("http")) {
      showToast("Please provide a valid test link starting with http:// or https://", "warning");
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
      testLink: testLink.trim(),
      external_url: testLink.trim(),
      displayOrder: Number(displayOrder),
      published: Boolean(published),
      active: true,
    };

    try {
      if (editTest) {
        await updateTest(editTest.id, testData);
        showToast("Test updated successfully.", "success");
      } else {
        await addTest(testData);
        showToast("Test added successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save test.", "danger");
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
      await deleteTest(deleteId);
      showToast(`Test "${deleteName}" deleted successfully.`, "success");
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete test.", "danger");
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
              <option value="PREVIOUS_YEAR">Previous-Year Quizzes</option>
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
        </div>
      </div>

      {/* Tests Data Table */}
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Test Title</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Subject / Chapter</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Link URL</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredTests.map((test) => {
                  const testUrl = test.testLink || test.external_url || "";

                  return (
                    <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                            <FileSpreadsheet className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{test.title}</div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              {test.questionCount || 30} Qs • {test.duration || 30} Mins • {test.marks || 30} Marks
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-xs text-slate-600">
                        {classMap[test.classId] || "All Classes"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {subjectMap[test.subjectId] || "Unassigned"}
                        </div>
                        {test.chapterId && chapterMap[test.chapterId] && (
                          <div className="text-[11px] text-slate-400 font-medium">
                            {chapterMap[test.chapterId]}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] uppercase rounded-lg border border-slate-200">
                          {test.testType || "DAILY"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {testUrl ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            <a
                              href={testUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary font-mono truncate hover:underline"
                            >
                              {testUrl}
                            </a>
                            <button
                              onClick={() => copyToClipboard(test.id, testUrl)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer shrink-0"
                              title="Copy URL"
                            >
                              {copiedId === test.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No link</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {testUrl && (
                            <a
                              href={testUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-slate-100 text-primary rounded-lg transition-colors cursor-pointer"
                              title="Launch Form URL"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(test)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(test)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
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

          {/* Link URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Test Link URL (Google Form / External)</label>
            <input
              type="url"
              value={testLink}
              onChange={(e) => setTestLink(e.target.value)}
              placeholder="https://docs.google.com/forms/d/..."
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-800 bg-white"
            />
          </div>

          {/* Class selection first, followed by dependent Subject & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class Grade</label>
              <select
                value={classId}
                onChange={(e) => {
                  const newClassId = e.target.value;
                  setClassId(newClassId);
                  setSubjectId("");
                  setChapterId("");
                }}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
              >
                <option value="">Select class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  const newSubjectId = e.target.value;
                  setSubjectId(newSubjectId);
                  setChapterId("");
                }}
                disabled={!classId}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {!classId ? (
                  <option value="">Select class first...</option>
                ) : (
                  <>
                    <option value="">Select subject...</option>
                    {availableFormSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </>
                )}
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
                <option value="PREVIOUS_YEAR">PREVIOUS-YEAR QUIZ</option>
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

          {/* Order & Publish toggler */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
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
