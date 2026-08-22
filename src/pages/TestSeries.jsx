import React, { useState, useEffect } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addTestSeries, updateTestSeries, deleteTestSeries } from "../services/testSeriesService";
import { getClassSubjects } from "../services/classSubjectsService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, Layers, Folders, CheckSquare, Square } from "lucide-react";

export const TestSeries = () => {
  const { showToast } = useToast();

  // Load database listings
  const { data: subjects, loading: loadingSubjects } = useSupabaseCollection("subjects", {
    sorting: [["display_order", "asc"]],
  });
  const { data: classes, loading: loadingClasses } = useSupabaseCollection("classes", {
    sorting: [["display_order", "asc"]],
  });
  const { data: tests, loading: loadingTests } = useSupabaseCollection("tests", {
    sorting: [["display_order", "asc"]],
  });
  const { data: seriesList, loading: loadingSeries } = useSupabaseCollection("testSeries", {
    sorting: [["created_at", "desc"]],
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
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal forms state
  const [modalOpen, setModalOpen] = useState(false);
  const [editSeries, setEditSeries] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [published, setPublished] = useState(true);

  // Deletion State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Lookups
  const subjectMap = subjects.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {});
  const classMap = classes.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});

  // Dependent Subjects logic based on selected Class
  const availableFormSubjects = React.useMemo(() => {
    if (!classId || !classSubjectsMap[classId] || classSubjectsMap[classId].length === 0) {
      return subjects;
    }
    const assignedIds = classSubjectsMap[classId];
    return subjects.filter((sub) => assignedIds.includes(sub.id));
  }, [classId, classSubjectsMap, subjects]);

  // Form conditional test selections (only tests of the selected subject can be added)
  const availableTests = tests.filter((t) => t.subjectId === subjectId);

  // Filter Series
  const filteredSeries = seriesList.filter((series) => {
    const matchesSearch = series.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      series.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesSubject = subjectFilter === "all" || series.subjectId === subjectFilter;
    const matchesClass = classFilter === "all" || series.classId === classFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "published" && series.published === true) ||
      (statusFilter === "draft" && series.published === false);

    return matchesSearch && matchesSubject && matchesClass && matchesStatus;
  });

  const openAddModal = () => {
    setEditSeries(null);
    setTitle("");
    setDescription("");
    setClassId(classes[0]?.id || "");
    setSubjectId(subjects[0]?.id || "");
    setSelectedTestIds([]);
    setPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (series) => {
    setEditSeries(series);
    setTitle(series.title || "");
    setDescription(series.description || "");
    setClassId(series.classId || "");
    setSubjectId(series.subjectId || "");
    setSelectedTestIds(series.tests || []);
    setPublished(series.published !== false);
    setModalOpen(true);
  };

  const handleTestToggle = (id) => {
    setSelectedTestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) {
      showToast("Title and Subject are required.", "warning");
      return;
    }

    setFormLoading(true);
    const seriesData = {
      title: title.trim(),
      description: description.trim(),
      subjectId,
      classId: classId || null,
      tests: selectedTestIds,
      published: Boolean(published),
      active: true,
    };

    try {
      if (editSeries) {
        await updateTestSeries(editSeries.id, seriesData);
        showToast("Test series bundle updated successfully.", "success");
      } else {
        await addTestSeries(seriesData);
        showToast("Test series bundle created successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save test series bundle.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrigger = (series) => {
    setDeleteId(series.id);
    setDeleteName(series.title);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteTestSeries(deleteId);
      showToast(`Test series "${deleteName}" deleted successfully.`, "success");
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete test series bundle.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const togglePublished = async (series) => {
    try {
      await updateTestSeries(series.id, {
        published: !series.published
      });
      showToast(`Publication status updated.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle status.", "danger");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Test Series Bundles</h1>
          <p className="text-xs text-slate-400 mt-1">Group practice exams and daily tests into comprehensive subject bundles.</p>
        </div>
        <Button
          onClick={openAddModal}
          icon={Plus}
          disabled={subjects.length === 0}
          className="shadow-lg shadow-primary/10"
        >
          Create Test Series
        </Button>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by series title or description..."
        />

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <label className="text-slate-400 shrink-0">Class:</label>
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
            <label className="text-slate-400 shrink-0">Subject:</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400 shrink-0">Status:</label>
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

      {/* Series Listing */}
      {loadingSubjects || loadingClasses || loadingTests || loadingSeries ? (
        <LoadingSpinner message="Retrieving test series bundles..." />
      ) : filteredSeries.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Test Series Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Click "Create Test Series" to bundle individual tests into a study package.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeries.map((series) => {
            const bundledTestCount = (series.tests || []).length;

            return (
              <div
                key={series.id}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                      <Layers className="h-5 w-5" />
                    </div>
                    <button
                      onClick={() => togglePublished(series)}
                      className="cursor-pointer shrink-0"
                    >
                      {series.published !== false ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-full">
                          <Eye className="h-3 w-3" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-[11px] font-bold rounded-full">
                          <EyeOff className="h-3 w-3" /> Draft
                        </span>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-base leading-snug">{series.title}</h3>
                    {series.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{series.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg">
                      Class: {classMap[series.classId] || "All Classes"}
                    </span>
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-semibold rounded-lg">
                      Subject: {subjectMap[series.subjectId] || "Unassigned"}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[11px] font-medium rounded-lg border border-slate-100 flex items-center gap-1">
                      <Folders className="h-3 w-3" /> {bundledTestCount} Test{bundledTestCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 shrink-0">
                  <button
                    onClick={() => openEditModal(series)}
                    className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTrigger(series)}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSeries ? "Edit Test Series Bundle" : "Create Test Series Bundle"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Series Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bundle Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Biology Mock Series"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this series bundle..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none resize-none"
            />
          </div>

          {/* Class first, followed by dependent Subject Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class Grade</label>
              <select
                value={classId}
                onChange={(e) => {
                  const newClassId = e.target.value;
                  setClassId(newClassId);
                  const assignedSubs = classSubjectsMap[newClassId];
                  if (assignedSubs && assignedSubs.length > 0 && !assignedSubs.includes(subjectId)) {
                    setSubjectId(assignedSubs[0]);
                    setSelectedTestIds([]);
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                <option value="">All Classes (General)</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject Pathway</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setSelectedTestIds([]); // reset selected tests when subject changes
                }}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                <option value="" disabled>Select subject...</option>
                {availableFormSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tests Selection Checkbox List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Include Tests in Bundle</label>
            {!subjectId ? (
              <p className="text-xs text-slate-400 italic">Select a subject first to view available tests.</p>
            ) : availableTests.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No tests created under this subject yet.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {availableTests.map((test) => {
                  const isChecked = selectedTestIds.includes(test.id);

                  return (
                    <div
                      key={test.id}
                      onClick={() => handleTestToggle(test.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isChecked ? "bg-white border border-primary/30 text-slate-800 shadow-2xs" : "text-slate-600 hover:bg-white/60"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{test.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Publish Status */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Publish Status</label>
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

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 shrink-0">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {editSeries ? "Save Series" : "Create Series"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Test Series Bundle?"
        message={`Are you sure you want to delete "${deleteName}"? Tests inside the bundle will remain intact.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default TestSeries;
