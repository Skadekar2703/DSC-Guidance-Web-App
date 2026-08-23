import React, { useState, useEffect } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addMaterial, updateMaterial, deleteMaterial } from "../services/materialsService";
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

export const Materials = () => {
  const { showToast } = useToast();

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
  const { data: materials, loading: loadingMaterials } = useSupabaseCollection("materials", {
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

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all, published, draft

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [type, setType] = useState("NOTES");
  const [pdfSource, setPdfSource] = useState("upload"); // upload | external
  const [pdfUrl, setPdfUrl] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [published, setPublished] = useState(true);

  // Deletion state
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Map collections for quick lookups in table
  const subjectMap = subjects.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {});
  const chapterMap = chapters.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
  const classMap = classes.reduce((acc, cl) => ({ ...acc, [cl.id]: cl.name }), {});

  // Available subjects for forms (all active subjects are available)
  const availableFormSubjects = React.useMemo(() => {
    return subjects;
  }, [subjects]);

  // Form conditional chapter filtering
  const formChapters = chapters.filter((c) => c.subjectId === subjectId || c.subject_id === subjectId);

  // Filters calculation
  const filteredMaterials = materials.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || item.subjectId === subjectFilter || item.subject_id === subjectFilter;
    const matchesChapter = chapterFilter === "all" || item.chapterId === chapterFilter || item.chapter_id === chapterFilter;
    const matchesClass = classFilter === "all" || item.classId === classFilter || item.class_id === classFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "published" && item.published === true) ||
      (statusFilter === "draft" && item.published === false);

    return matchesSearch && matchesSubject && matchesChapter && matchesClass && matchesType && matchesStatus;
  });

  const openAddModal = () => {
    setEditMaterial(null);
    setTitle("");
    setDescription("");
    setType("PDF");
    setClassId("");
    setSubjectId(subjects[0]?.id || "");
    setChapterId("");
    setType("NOTES");
    setPdfSource("upload");
    setPdfUrl("");
    setStoragePath("");
    setFileName("");
    setFileSize(0);
    setDisplayOrder(materials.length + 1);
    setPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditMaterial(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setClassId(item.classId || "");
    setSubjectId(item.subjectId || "");
    setChapterId(item.chapterId || "");
    setType(item.type || "NOTES");
    setPdfSource(item.storagePath ? "upload" : "external");
    setPdfUrl(item.pdfUrl || "");
    setStoragePath(item.storagePath || "");
    setFileName(item.fileName || "");
    setFileSize(item.fileSize || 0);
    setDisplayOrder(item.displayOrder || 1);
    setPublished(item.published !== false);
    setModalOpen(true);
  };

  const handleUploadSuccess = (uploadData) => {
    setPdfUrl(uploadData.pdfUrl);
    setStoragePath(uploadData.storagePath);
    setFileName(uploadData.fileName);
    setFileSize(uploadData.fileSize);
    showToast("File uploaded successfully.", "success");
  };

  const handleUploadClear = () => {
    setPdfUrl("");
    setStoragePath("");
    setFileName("");
    setFileSize(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subjectId || !pdfUrl) {
      showToast("Title, Subject, and PDF Reference are required.", "warning");
      return;
    }

    if (pdfSource === "external" && pdfUrl && !pdfUrl.trim().startsWith("http")) {
      showToast("Please provide a valid PDF link starting with http:// or https://", "warning");
      return;
    }

    setFormLoading(true);
    const materialData = {
      title: title.trim(),
      description: description.trim(),
      subjectId,
      chapterId: chapterId || null,
      classId: classId || null,
      type,
      pdfUrl: pdfUrl.trim(),
      storagePath: pdfSource === "upload" ? storagePath : "",
      fileName: pdfSource === "upload" ? fileName : "",
      fileSize: pdfSource === "upload" ? Number(fileSize) : 0,
      displayOrder: Number(displayOrder),
      published: Boolean(published),
      active: true,
    };

    try {
      if (editMaterial) {
        if (pdfSource === "external" && editMaterial.storagePath) {
          try {
            await deleteFile(editMaterial.storagePath);
          } catch (storageErr) {
            console.warn("Storage cleanup ignored:", storageErr);
          }
        }
        await updateMaterial(editMaterial.id, materialData);
        showToast("Study material updated successfully.", "success");
      } else {
        await addMaterial(materialData);
        showToast("Study material added successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save material index.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrigger = (item) => {
    setDeleteItem(item);
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

      await deleteMaterial(deleteItem.id);
      showToast(`"${deleteItem.title}" deleted successfully.`, "success");
      setDeleteItem(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete study material.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const togglePublished = async (item) => {
    try {
      await updateMaterial(item.id, {
        published: !item.published
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
          <h1 className="text-xl font-bold text-slate-800">Study Materials Repository</h1>
          <p className="text-xs text-slate-400 mt-1">Upload study guides, PDF files, and reference notes.</p>
        </div>
        <Button
          onClick={openAddModal}
          icon={Plus}
          disabled={subjects.length === 0}
          className="shadow-lg shadow-primary/10"
        >
          Upload Material
        </Button>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-4 shrink-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by title or description..."
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
            <label className="text-slate-400">Material Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="NOTES">Notes Only</option>
              <option value="PDF">PDF Only</option>
              <option value="STUDY_MATERIAL">Study Material</option>
              <option value="REFERENCE">Reference Notes</option>
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

      {/* Materials Data Listing */}
      {loadingSubjects || loadingChapters || loadingClasses || loadingMaterials ? (
        <LoadingSpinner message="Retrieving study files..." />
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Materials Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Upload study files or clear search filters to display documents.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Document Title</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Subject / Chapter</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredMaterials.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{item.title}</div>
                          {item.fileName && (
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{item.fileName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs text-slate-600">
                      {classMap[item.classId] || "All Classes"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-xs">
                        {subjectMap[item.subjectId] || "Unassigned"}
                      </div>
                      {item.chapterId && chapterMap[item.chapterId] && (
                        <div className="text-[11px] text-slate-400 font-medium">
                          {chapterMap[item.chapterId]}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] uppercase rounded-lg border border-slate-200">
                        {item.type || "NOTES"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublished(item)}
                        className="cursor-pointer"
                      >
                        {item.published !== false ? (
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
                        {item.pdfUrl && (
                          <a
                            href={item.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-slate-100 text-primary rounded-lg transition-colors cursor-pointer"
                            title="Open Document URL"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(item)}
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
        title={editMaterial ? "Edit Study Material" : "Upload Study Material"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1 Notes - Cells"
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
              placeholder="Brief description of the PDF guide..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white resize-none"
            />
          </div>

          {/* Subject selection first, followed by Class Grade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject <span className="text-red-500">*</span></label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setChapterId("");
                }}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none font-medium text-slate-800"
              >
                <option value="" disabled>Select subject...</option>
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-800"
              >
                <option value="">All Classes / Not Applicable</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chapter Category & Material Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chapter Category (Optional)</label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                <option value="">No Chapter (Subject-level)</option>
                {formChapters.map((chap) => (
                  <option key={chap.id} value={chap.id}>{chap.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Material Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                <option value="NOTES">NOTES</option>
                <option value="PDF">PDF DOCUMENT</option>
                <option value="STUDY_MATERIAL">STUDY MATERIAL</option>
                <option value="REFERENCE">REFERENCE WORK</option>
              </select>
            </div>
          </div>

          {/* PDF Attachment options */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">PDF Document Source</label>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="pdfSource"
                  checked={pdfSource === "upload"}
                  onChange={() => setPdfSource("upload")}
                  className="text-primary focus:ring-primary"
                />
                Upload File to Storage
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="pdfSource"
                  checked={pdfSource === "external"}
                  onChange={() => setPdfSource("external")}
                  className="text-primary focus:ring-primary"
                />
                External PDF URL Link
              </label>
            </div>

            {pdfSource === "upload" ? (
              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                onClear={handleUploadClear}
                currentPath={storagePath}
                currentUrl={pdfUrl}
                currentFileName={fileName}
                bucket="study-materials"
                folder="materials"
              />
            ) : (
              <div className="space-y-1.5 pt-1">
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://example.com/document.pdf"
                    required={pdfSource === "external"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* displayOrder & Publish toggler */}
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

          {/* Form Actions Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 shrink-0">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {editMaterial ? "Save Material" : "Upload Material"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Study Material?"
        message={`Are you sure you want to remove "${deleteItem?.title}"? Attached PDF storage files will also be unlinked.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Materials;
