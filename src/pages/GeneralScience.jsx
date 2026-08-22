import React, { useState } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addGeneralScienceItem, updateGeneralScienceItem, deleteGeneralScienceItem } from "../services/generalScienceService";
import { deleteFile } from "../services/storageService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { FileUpload } from "../components/forms/FileUpload";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText, ExternalLink, Link2, UploadCloud, Atom } from "lucide-react";

export const GeneralScience = () => {
  const { showToast } = useToast();

  // Load General Science listing from Supabase
  const { data: scienceContent, loading } = useSupabaseCollection("generalScience", {
    sorting: [["category", "asc"], ["display_order", "asc"], ["created_at", "desc"]],
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // all, Physics, Chemistry, Biology
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Physics"); // Physics, Chemistry, Biology
  const [description, setDescription] = useState("");
  const [pdfSource, setPdfSource] = useState("upload"); // upload | external
  const [pdfUrl, setPdfUrl] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [fileName, setFileName] = useState("");
  const [url, setUrl] = useState(""); // Resource URL
  const [displayOrder, setDisplayOrder] = useState(1);
  const [active, setActive] = useState(true);

  // Deletion state
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter General Science content
  const filteredContent = scienceContent.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && item.active === true) ||
      (statusFilter === "inactive" && item.active === false);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const openAddModal = () => {
    setEditItem(null);
    setTitle("");
    setCategory("Physics");
    setDescription("");
    setPdfSource("upload");
    setPdfUrl("");
    setStoragePath("");
    setFileName("");
    setUrl("");
    setDisplayOrder(scienceContent.length + 1);
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setTitle(item.title || "");
    setCategory(item.category || "Physics");
    setDescription(item.description || "");
    setPdfSource(item.storagePath ? "upload" : "external");
    setPdfUrl(item.pdfUrl || "");
    setStoragePath(item.storagePath || "");
    setFileName(item.fileName || "");
    setUrl(item.url || "");
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
    if (!title.trim() || !category) {
      showToast("Title and Category are required.", "warning");
      return;
    }

    if (pdfSource === "external" && pdfUrl && !pdfUrl.trim().startsWith("http")) {
      showToast("Please provide a valid PDF URL starting with http:// or https://", "warning");
      return;
    }

    if (url && !url.trim().startsWith("http")) {
      showToast("Please provide a valid Resource URL starting with http:// or https://", "warning");
      return;
    }

    setFormLoading(true);
    const contentData = {
      title: title.trim(),
      category,
      description: description.trim(),
      pdfUrl: pdfUrl.trim(),
      storagePath: pdfSource === "upload" ? storagePath : "",
      fileName: pdfSource === "upload" ? fileName : "",
      url: url.trim(),
      displayOrder: Number(displayOrder),
      active: Boolean(active),
    };

    try {
      if (editItem) {
        // Delete old storage file if source changed
        if (pdfSource === "external" && editItem.storagePath) {
          try {
            await deleteFile(editItem.storagePath);
          } catch (storageErr) {
            console.warn("Storage cleanup warning:", storageErr);
          }
        }
        await updateGeneralScienceItem(editItem.id, contentData);
        showToast("General Science resource updated successfully.", "success");
      } else {
        await addGeneralScienceItem(contentData);
        showToast("General Science resource created successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save resource details.", "danger");
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
      await deleteGeneralScienceItem(deleteItem.id);
      showToast(`"${deleteItem.title}" deleted successfully.`, "success");
      setDeleteItem(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete resource.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateGeneralScienceItem(item.id, {
        active: !item.active
      });
      showToast(`Resource status updated.`, "success");
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
          <h1 className="text-xl font-bold text-slate-800">General Science Content</h1>
          <p className="text-xs text-slate-400 mt-1">Manage Physics, Chemistry, and Biology learning modules.</p>
        </div>
        <Button onClick={openAddModal} icon={Plus} className="shadow-lg shadow-primary/10">
          Add Resource
        </Button>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-4 shrink-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search general science content..."
          />
          
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <label className="text-slate-400">Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
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
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving general science registry..." />
      ) : filteredContent.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <Atom className="h-10 w-10 text-slate-300 mx-auto mb-3 animate-spin" style={{ animationDuration: '6s' }} />
          <h3 className="text-base font-bold text-slate-700">No Content Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Create content modules under Physics, Chemistry, or Biology to display them to students.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Resource Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">PDF Attachment</th>
                  <th className="px-6 py-3">Resource URL</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredContent.map((item) => (
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
                      <span className={`px-2.5 py-0.5 border text-xs font-extrabold rounded-lg ${
                        item.category === "Physics"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : item.category === "Chemistry"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.pdfUrl ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          {item.storagePath ? (
                            <UploadCloud className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Link2 className="h-4 w-4 text-sky-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[120px]">{item.fileName || "View Document"}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">No document</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline truncate max-w-[140px]"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span>Link URL</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">No URL</span>
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
                            title="Open PDF"
                          >
                            <FileText className="h-4.5 w-4.5" />
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
        title={editItem ? "Edit General Science Details" : "Create General Science Resource"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Resource Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Newton's Laws of Motion"
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
              placeholder="Details on practice study materials, key equations, or chapters..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none resize-none"
            />
          </div>

          {/* Category & Display Order & Status toggle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Science Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

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

          {/* External Resource Link URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Resource URL link (Optional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. YouTube video or external study link"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-800 bg-white"
            />
          </div>

          {/* PDF Attachment Toggle & Inputs */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">PDF Reference Attachment (Optional)</label>
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
                folder="general-science"
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
                  placeholder="https://example.com/science-document.pdf"
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
              {editItem ? "Save Changes" : "Create Resource"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Safety Dialog */}
      <ConfirmDialog
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete General Science Content?"
        message={`Are you sure you want to delete "${deleteItem?.title}"? Any attached local files will be deleted from Supabase Storage.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default GeneralScience;
