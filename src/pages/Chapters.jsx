import React, { useState } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addChapter, updateChapter, deleteChapter } from "../services/chaptersService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, Bookmark } from "lucide-react";

export const Chapters = () => {
  const { showToast } = useToast();

  // Fetch subjects for dropdown selection and filtering
  const { data: subjects, loading: loadingSubjects } = useSupabaseCollection("subjects", {
    sorting: [["display_order", "asc"]],
  });

  // Fetch chapters
  const { data: chapters, loading: loadingChapters } = useSupabaseCollection("chapters", {
    sorting: [["display_order", "asc"]],
  });

  // Filters State
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal forms state
  const [modalOpen, setModalOpen] = useState(false);
  const [editChapter, setEditChapter] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [active, setActive] = useState(true);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter computations
  const filteredChapters = chapters.filter((chap) => {
    const matchesSearch = chap.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chap.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubjectFilter === "all" || chap.subjectId === selectedSubjectFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && chap.active === true) || 
      (statusFilter === "inactive" && chap.active === false);

    return matchesSearch && matchesSubject && matchesStatus;
  });

  // Map subject names by ID for easy lookup in chapter list
  const subjectMap = subjects.reduce((acc, sub) => {
    acc[sub.id] = sub.name;
    return acc;
  }, {});

  const openAddModal = () => {
    setEditChapter(null);
    setName("");
    setDescription("");
    // Default subjectId to the filtered subject if it's a specific one, else first available
    setSubjectId(selectedSubjectFilter !== "all" ? selectedSubjectFilter : (subjects[0]?.id || ""));
    setDisplayOrder(chapters.filter(c => selectedSubjectFilter === "all" || c.subjectId === selectedSubjectFilter).length + 1);
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (chapter) => {
    setEditChapter(chapter);
    setName(chapter.name || "");
    setDescription(chapter.description || "");
    setSubjectId(chapter.subjectId || "");
    setDisplayOrder(chapter.displayOrder || 1);
    setActive(chapter.active !== false);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !subjectId) {
      showToast("Chapter name and parent subject are required.", "warning");
      return;
    }

    setFormLoading(true);
    const chapterData = {
      name: name.trim(),
      description: description.trim(),
      subjectId,
      displayOrder: Number(displayOrder),
      active: Boolean(active),
    };

    try {
      if (editChapter) {
        await updateChapter(editChapter.id, chapterData);
        showToast("Chapter updated successfully.", "success");
      } else {
        await addChapter(chapterData);
        showToast("Chapter created successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save chapter.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrigger = (chapter) => {
    setDeleteId(chapter.id);
    setDeleteName(chapter.name);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteChapter(deleteId);
      showToast(`Chapter "${deleteName}" deleted successfully.`, "success");
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete chapter.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleChapterActive = async (chapter) => {
    try {
      await updateChapter(chapter.id, {
        active: !chapter.active
      });
      showToast(`Chapter status updated.`, "success");
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
          <h1 className="text-xl font-bold text-slate-800">Chapters Index</h1>
          <p className="text-xs text-slate-400 mt-1">Manage nested chapters categorizing student content.</p>
        </div>
        <Button 
          onClick={openAddModal} 
          icon={Plus} 
          disabled={subjects.length === 0}
          className="shadow-lg shadow-primary/10"
        >
          Add Chapter
        </Button>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search chapters..."
        />

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <label className="text-slate-400 shrink-0">Subject:</label>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
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
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chapters Data Listing */}
      {loadingSubjects || loadingChapters ? (
        <LoadingSpinner message="Retrieving chapters directory..." />
      ) : filteredChapters.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <Bookmark className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Chapters Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Create a chapter under a specific subject to start adding lessons and pdf files.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Chapter Name</th>
                  <th className="px-6 py-3">Subject Pathway</th>
                  <th className="px-6 py-3">Display Order</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredChapters.map((chapter) => (
                  <tr key={chapter.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-800">{chapter.name}</div>
                        {chapter.description && (
                          <div className="text-xs text-slate-400 font-medium line-clamp-1 max-w-sm mt-0.5">
                            {chapter.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {subjectMap[chapter.subjectId] || "Unknown Subject"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-500">
                      {chapter.displayOrder || 1}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleChapterActive(chapter)}
                        className="cursor-pointer"
                      >
                        {chapter.active !== false ? (
                          <span className="flex items-center gap-1 w-fit px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                            <Eye className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 w-fit px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-xs font-bold rounded-full">
                            <EyeOff className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(chapter)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(chapter)}
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

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editChapter ? "Edit Chapter Details" : "Create New Chapter"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Chapter Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chapter Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Genetics"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
            />
          </div>

          {/* Subject Dropdown Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Parent Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
            >
              <option value="" disabled>Select parent subject...</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of chapters or topics..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white resize-none"
            />
          </div>

          {/* displayOrder & active checkbox */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                min={1}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
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
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success" />
                  <span className="ml-3 text-sm font-semibold text-slate-600">
                    {active ? "Active" : "Inactive"}
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
              {editChapter ? "Save Changes" : "Create Chapter"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Safety Prompt */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Chapter?"
        message={`Are you sure you want to delete chapter "${deleteName}"? This will unlink study materials that references this chapter.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Chapters;
