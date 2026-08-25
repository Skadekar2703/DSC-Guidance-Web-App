import React, { useState } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addImportantTopic, updateImportantTopic, deleteImportantTopic } from "../services/importantTopicsService";
import { deleteFile } from "../services/storageService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { FileUpload } from "../components/forms/FileUpload";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, Bookmark, ExternalLink, Link2, UploadCloud } from "lucide-react";

export const ImportantTopics = () => {
  const { showToast } = useToast();

  // Load parent listings
  const { data: subjects, loading: loadingSubjects } = useSupabaseCollection("subjects", {
    sorting: [["display_order", "asc"]],
  });
  const { data: chapters, loading: loadingChapters } = useSupabaseCollection("chapters", {
    sorting: [["display_order", "asc"]],
  });
  const { data: topics, loading: loadingTopics } = useSupabaseCollection("importantTopics", {
    sorting: [["display_order", "asc"], ["created_at", "desc"]],
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editTopic, setEditTopic] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [pdfSource, setPdfSource] = useState("upload"); // upload | external
  const [pdfUrl, setPdfUrl] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [fileName, setFileName] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [active, setActive] = useState(true);

  // Deletion state
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Lookups
  const subjectMap = subjects.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {});
  const chapterMap = chapters.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});

  // Form conditional chapter filtering
  const formChapters = chapters.filter((c) => c.subjectId === subjectId);

  // Filters calculation
  const filteredTopics = topics.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || item.subjectId === subjectFilter;
    const matchesChapter = chapterFilter === "all" || item.chapterId === chapterFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && item.active === true) ||
      (statusFilter === "inactive" && item.active === false);

    return matchesSearch && matchesSubject && matchesChapter && matchesStatus;
  });

  const openAddModal = () => {
    setEditTopic(null);
    setTitle("");
    setDescription("");
    setSubjectId(subjects[0]?.id || "");
    setChapterId("");
    setPdfSource("upload");
    setPdfUrl("");
    setStoragePath("");
    setFileName("");
    setDisplayOrder(topics.length + 1);
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditTopic(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setSubjectId(item.subjectId || "");
    setChapterId(item.chapterId || "");
    setPdfSource(item.storagePath ? "upload" : "external");
    setPdfUrl(item.pdfUrl || "");
    setStoragePath(item.storagePath || "");
    setFileName(item.fileName || "");
    setDisplayOrder(item.displayOrder || 1);
    setActive(item.active !== false);
    setModalOpen(true);
  };

  const handleUploadSuccess = (uploadData) => {
    setPdfUrl(uploadData.pdfUrl);
    setStoragePath(uploadData.storagePath);
    setFileName(uploadData.fileName);
    showToast("File uploaded successfully.", "success");
  };

  const handleUploadClear = () => {
    setPdfUrl("");
    setStoragePath("");
    setFileName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) {
      showToast("Topic Title and Subject Pathway are required.", "warning");
      return;
    }

    if (pdfSource === "external" && pdfUrl && !pdfUrl.trim().startsWith("http")) {
      showToast("Please provide a valid PDF Link URL starting with http:// or https://", "warning");
      return;
    }

    setFormLoading(true);
    const topicData = {
      title: title.trim(),
      description: description.trim(),
      subjectId,
      chapterId: chapterId || null,
      pdfUrl: pdfUrl.trim(),
      storagePath: pdfSource === "upload" ? storagePath : "",
      fileName: pdfSource === "upload" ? fileName : "",
      displayOrder: Number(displayOrder),
      active: Boolean(active),
    };

    try {
      if (editTopic) {
        await updateImportantTopic(editTopic.id, topicData);

        // Delete old storage file if replaced or switched to external URL
        if (editTopic.storagePath && (pdfSource === "external" || editTopic.storagePath !== storagePath)) {
          try {
            await deleteFile(editTopic.storagePath);
          } catch (storageErr) {
            console.warn("Storage cleanup warning:", storageErr);
          }
        }

        showToast("Topic updated successfully.", "success");
      } else {
        await addImportantTopic(topicData);
        showToast("Topic created successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save topic.", "danger");
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
      // 1. Delete associated Storage file if path exists
      if (deleteItem.storagePath) {
        try {
          await deleteFile(deleteItem.storagePath);
        } catch (storageErr) {
          console.warn("Storage deletion ignored:", storageErr);
        }
      }

      // 2. Delete DB record
      await deleteImportantTopic(deleteItem.id);
      showToast(`"${deleteItem.title}" deleted successfully.`, "success");
      setDeleteItem(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete topic.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateImportantTopic(item.id, {
        active: !item.active
      });
      showToast(`Topic status updated.`, "success");
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
          <h1 className="text-xl font-bold text-slate-800">Important Topics Directory</h1>
          <p className="text-xs text-slate-400 mt-1">Manage core educational topics and resources shown to students.</p>
        </div>
        <Button
          onClick={openAddModal}
          icon={Plus}
          disabled={subjects.length === 0}
          className="shadow-lg shadow-primary/10"
        >
          Add Topic
        </Button>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-4 shrink-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search topics by title..."
          />
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
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

            <div className="flex items-center gap-2">
              <label className="text-slate-400">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Topics Data Table */}
      {loadingSubjects || loadingChapters || loadingTopics ? (
        <LoadingSpinner message="Retrieving topics directory..." />
      ) : filteredTopics.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <Bookmark className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Topics Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Create an important topic study record to make it visible in the Android application.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Topic Title</th>
                  <th className="px-6 py-3">Subject / Chapter</th>
                  <th className="px-6 py-3">PDF Attachment</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredTopics.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-800 truncate leading-snug max-w-xs">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5 max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <div className="font-semibold text-slate-700">{subjectMap[item.subjectId] || "Subject"}</div>
                        {item.chapterId && (
                          <div className="text-slate-400 font-medium mt-0.5">{chapterMap[item.chapterId] || "Chapter"}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.pdfUrl ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          {item.storagePath ? (
                            <UploadCloud className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Link2 className="h-4 w-4 text-sky-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[120px]">{item.fileName || "View Link"}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">No document</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-500">
                      {item.displayOrder || 1}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(item)}
                        className="cursor-pointer"
                      >
                        {item.active !== false ? (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                            <Eye className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-xs font-bold rounded-full">
                            <EyeOff className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.pdfUrl && (
                          <a
                            href={item.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Open Link"
                          >
                            <ExternalLink className="h-4.5 w-4.5" />
                          </a>
                        )}
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(item)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer shrink-0"
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
        title={editTopic ? "Edit Topic Configuration" : "Create Important Topic"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Topic Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DNA Replication Mechanism"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of details, guidelines, or exam importance..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none resize-none"
            />
          </div>

          {/* Subject & Chapter selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject Pathway</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setChapterId("");
                }}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                <option value="" disabled>Select subject...</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

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
          </div>

          {/* Display Order & Active status toggle */}
          <div className="grid grid-cols-2 gap-4">
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
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-success after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  <span className="ml-3 text-sm font-semibold text-slate-600">
                    {active ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* PDF Source Choice Toggle & Inputs */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">PDF Reference Source (Optional)</label>
            <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => {
                  setPdfSource("upload");
                  if (!storagePath) setPdfUrl("");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pdfSource === "upload"
                    ? "bg-white text-primary shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setPdfSource("external");
                  if (storagePath) setPdfUrl("");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pdfSource === "external"
                    ? "bg-white text-primary shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                External URL link
              </button>
            </div>

            {pdfSource === "upload" ? (
              <FileUpload
                folder="important-topics"
                initialFileUrl={storagePath ? pdfUrl : ""}
                initialFileName={fileName}
                onUploadSuccess={handleUploadSuccess}
                onClear={handleUploadClear}
                maxSizeMb={30}
              />
            ) : (
              <div className="space-y-1.5">
                <input
                  type="url"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-800 bg-white"
                />
                <p className="text-[10px] text-slate-400 font-medium">Paste direct URL targeting external PDF files.</p>
              </div>
            )}
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
              {editTopic ? "Save Changes" : "Create Topic"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Safety Dialog */}
      <ConfirmDialog
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Topic?"
        message={`Are you sure you want to delete "${deleteItem?.title}"? This permanently unlinks it. Associated Storage files will be cleared.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ImportantTopics;
