import React, { useState, useEffect } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addPyqPaper, updatePyqPaper, deletePyqPaper } from "../services/pyqService";
import { getClassSubjects } from "../services/classSubjectsService";
import { deleteFile } from "../services/storageService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { FileUpload } from "../components/forms/FileUpload";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText, ExternalLink, Link2 } from "lucide-react";

export const PYQ = () => {
  const { showToast } = useToast();

  // Load parent listings
  const { data: subjects, loading: loadingSubjects } = useSupabaseCollection("subjects", {
    sorting: [["display_order", "asc"]],
  });
  const { data: classes, loading: loadingClasses } = useSupabaseCollection("classes", {
    sorting: [["display_order", "asc"]],
  });
  const { data: papers, loading: loadingPapers } = useSupabaseCollection("pyqPapers", {
    sorting: [["year", "desc"], ["created_at", "desc"]],
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

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editPaper, setEditPaper] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState("DSC");
  const [year, setYear] = useState(new Date().getFullYear());
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [pdfSource, setPdfSource] = useState("upload"); // upload | external
  const [pdfUrl, setPdfUrl] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [published, setPublished] = useState(true);

  // Deletion State
  const [deleteItem, setDeleteItem] = useState(null);
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

  // Generate unique list of years from papers for filter selection
  const yearOptions = Array.from(new Set(papers.map((p) => p.year).filter(Boolean))).sort((a, b) => b - a);

  // Filter papers
  const filteredPapers = papers.filter((paper) => {
    const matchesSearch = paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.year?.toString().includes(searchQuery) ||
      paper.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesExam = examTypeFilter === "all" || paper.examType === examTypeFilter;
    const matchesYear = yearFilter === "all" || paper.year === Number(yearFilter);
    const matchesSubject = subjectFilter === "all" || paper.subjectId === subjectFilter;
    const matchesClass = classFilter === "all" || paper.classId === classFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "published" && paper.published === true) ||
      (statusFilter === "draft" && paper.published === false);

    return matchesSearch && matchesExam && matchesYear && matchesSubject && matchesClass && matchesStatus;
  });

  const openAddModal = () => {
    setEditPaper(null);
    setTitle("");
    setExamType("DSC");
    setYear(new Date().getFullYear());
    setClassId(classes[0]?.id || "");
    setSubjectId(subjects[0]?.id || "");
    setDescription("");
    setPdfSource("upload");
    setPdfUrl("");
    setStoragePath("");
    setPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (paper) => {
    setEditPaper(paper);
    setTitle(paper.title || "");
    setExamType(paper.examType || "DSC");
    setYear(paper.year || new Date().getFullYear());
    setClassId(paper.classId || "");
    setSubjectId(paper.subjectId || "");
    setDescription(paper.description || "");
    setPdfSource(paper.storagePath ? "upload" : "external");
    setPdfUrl(paper.pdfUrl || "");
    setStoragePath(paper.storagePath || "");
    setPublished(paper.published !== false);
    setModalOpen(true);
  };

  const handleUploadSuccess = (uploadData) => {
    setPdfUrl(uploadData.pdfUrl);
    setStoragePath(uploadData.storagePath);
    showToast("PDF file uploaded successfully.", "success");
  };

  const handleUploadClear = () => {
    setPdfUrl("");
    setStoragePath("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subjectId || !pdfUrl) {
      showToast("Paper Title, Subject, and PDF Reference are required.", "warning");
      return;
    }

    if (pdfSource === "external" && pdfUrl && !pdfUrl.trim().startsWith("http")) {
      showToast("Please provide a valid PDF link starting with http:// or https://", "warning");
      return;
    }

    setFormLoading(true);
    const paperData = {
      title: title.trim(),
      examType: examType.trim(),
      year: Number(year),
      subjectId,
      classId: classId || null,
      description: description.trim(),
      pdfUrl: pdfUrl.trim(),
      storagePath: pdfSource === "upload" ? storagePath : "",
      published: Boolean(published),
      active: true,
    };

    try {
      if (editPaper) {
        if (pdfSource === "external" && editPaper.storagePath) {
          try {
            await deleteFile(editPaper.storagePath);
          } catch (storageErr) {
            console.warn("Storage cleanup ignored:", storageErr);
          }
        }
        await updatePyqPaper(editPaper.id, paperData);
        showToast("Previous paper updated successfully.", "success");
      } else {
        await addPyqPaper(paperData);
        showToast("Previous paper added successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save paper.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrigger = (paper) => {
    setDeleteItem(paper);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    try {
      if (deleteItem.storagePath) {
        try {
          await deleteFile(deleteItem.storagePath);
        } catch (storageErr) {
          console.warn("Storage file deletion warning:", storageErr);
        }
      }

      await deletePyqPaper(deleteItem.id);
      showToast(`"${deleteItem.title}" deleted successfully.`, "success");
      setDeleteItem(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete paper.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const togglePublished = async (paper) => {
    try {
      await updatePyqPaper(paper.id, {
        published: !paper.published
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
          <h1 className="text-xl font-bold text-slate-800">Previous Year Papers</h1>
          <p className="text-xs text-slate-400 mt-1">Upload and categorize solved exam papers and question keys.</p>
        </div>
        <Button
          onClick={openAddModal}
          icon={Plus}
          disabled={subjects.length === 0}
          className="shadow-lg shadow-primary/10"
        >
          Add Previous Paper
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-4 shrink-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by title, exam, or year..."
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
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="all">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 border-t border-slate-50 pt-3">
          <div className="flex items-center gap-2">
            <label className="text-slate-400">Exam Type:</label>
            <select
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="all">All Exams</option>
              <option value="DSC">DSC Exam</option>
              <option value="TET">TET Exam</option>
              <option value="MODEL_PAPER">Model Paper</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400">Year:</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="all">All Years</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400">Publication:</label>
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

      {/* Papers Data Table */}
      {loadingSubjects || loadingClasses || loadingPapers ? (
        <LoadingSpinner message="Retrieving previous year papers..." />
      ) : filteredPapers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Papers Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Upload previous question papers or adjust filter queries.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Paper Title</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Exam / Year</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{paper.title}</div>
                          {paper.description && (
                            <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{paper.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs text-slate-600">
                      {classMap[paper.classId] || "All Classes"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 text-xs">
                      {subjectMap[paper.subjectId] || "Unassigned"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] uppercase rounded-lg border border-slate-200">
                        {paper.examType || "DSC"} • {paper.year}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublished(paper)}
                        className="cursor-pointer"
                      >
                        {paper.published !== false ? (
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
                        {paper.pdfUrl && (
                          <a
                            href={paper.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-slate-100 text-primary rounded-lg transition-colors cursor-pointer"
                            title="Open Paper PDF"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => openEditModal(paper)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(paper)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editPaper ? "Edit Question Paper" : "Add Previous Year Paper"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paper Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Paper Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DSC 2024 Biology Official Paper"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
            />
          </div>

          {/* Exam Type & Year Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                <option value="DSC">DSC EXAM</option>
                <option value="TET">TET EXAM</option>
                <option value="MODEL_PAPER">MODEL PAPER</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Exam Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={2000}
                max={2030}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Class selection first, followed by dependent Subject */}
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
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paper notes, shift details, answer key information..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none resize-none"
            />
          </div>

          {/* PDF Source */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Question Paper PDF Source</label>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="pdfSource"
                  checked={pdfSource === "upload"}
                  onChange={() => setPdfSource("upload")}
                  className="text-primary focus:ring-primary"
                />
                Upload PDF File
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="pdfSource"
                  checked={pdfSource === "external"}
                  onChange={() => setPdfSource("external")}
                  className="text-primary focus:ring-primary"
                />
                External PDF Link
              </label>
            </div>

            {pdfSource === "upload" ? (
              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                onClear={handleUploadClear}
                currentPath={storagePath}
                currentUrl={pdfUrl}
                bucket="study-materials"
                folder="pyq"
              />
            ) : (
              <div className="space-y-1.5 pt-1">
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://example.com/pyq-2024.pdf"
                    required={pdfSource === "external"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  />
                </div>
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
              {editPaper ? "Save Paper" : "Add Paper"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Question Paper?"
        message={`Are you sure you want to delete "${deleteItem?.title}"? Attached PDF storage files will be unlinked.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default PYQ;
