import React, { useState } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../services/announcementsService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, Megaphone, Calendar } from "lucide-react";

export const Announcements = () => {
  const { showToast } = useToast();

  // Load announcements and classes
  const { data: announcements, loading } = useSupabaseCollection("announcements", {
    sorting: [["created_at", "desc"]],
  });
  const { data: classes } = useSupabaseCollection("classes", {
    sorting: [["display_order", "asc"]],
  });

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClassName, setSelectedClassName] = useState("All Classes");
  const [isActive, setIsActive] = useState(true);
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split("T")[0]);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const CLASS_OPTIONS = [
    { id: "", name: "All Classes" },
    { id: "class_1", name: "Class 1" },
    { id: "class_2", name: "Class 2" },
    { id: "class_3", name: "Class 3" },
    { id: "class_4", name: "Class 4" },
    { id: "class_5", name: "Class 5" },
    { id: "class_6", name: "Class 6" },
    { id: "class_7", name: "Class 7" },
    { id: "class_8", name: "Class 8" },
    { id: "class_9", name: "Class 9" },
    { id: "class_10", name: "Class 10" },
  ];

  // Merge loaded classes from DB if available
  const availableClasses = classes && classes.length > 0
    ? [{ id: "", name: "All Classes" }, ...classes.map(c => ({ id: c.id, name: c.name }))]
    : CLASS_OPTIONS;

  // Filtered List
  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      classFilter === "ALL" ||
      (classFilter === "" && (!item.class_id || item.class_name === "All Classes")) ||
      item.class_id === classFilter ||
      item.class_name === classFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && item.is_active) ||
      (statusFilter === "INACTIVE" && !item.is_active);

    return matchesSearch && matchesClass && matchesStatus;
  });

  const openAddModal = () => {
    setEditItem(null);
    setTitle("");
    setMessage("");
    setSelectedClassId("");
    setSelectedClassName("All Classes");
    setIsActive(true);
    setPublishDate(new Date().toISOString().split("T")[0]);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setTitle(item.title || "");
    setMessage(item.message || "");
    setSelectedClassId(item.class_id || "");
    setSelectedClassName(item.class_name || "All Classes");
    setIsActive(item.is_active !== false);
    setPublishDate(item.publish_date || new Date().toISOString().split("T")[0]);
    setModalOpen(true);
  };

  const handleClassChange = (e) => {
    const val = e.target.value;
    setSelectedClassId(val);
    const found = availableClasses.find((c) => c.id === val);
    setSelectedClassName(found ? found.name : "All Classes");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast("Announcement Title and Message are required.", "warning");
      return;
    }

    setFormLoading(true);
    try {
      if (editItem) {
        await updateAnnouncement(editItem.id, {
          title,
          message,
          class_id: selectedClassId || null,
          class_name: selectedClassName,
          is_active: isActive,
          publish_date: publishDate,
        });
        showToast("Announcement updated successfully.", "success");
      } else {
        await createAnnouncement({
          title,
          message,
          class_id: selectedClassId || null,
          class_name: selectedClassName,
          is_active: isActive,
          publish_date: publishDate,
        });
        showToast("Announcement created successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to save announcement.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrigger = (item) => {
    setDeleteId(item.id);
    setDeleteTitle(item.title);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteAnnouncement(deleteId);
      showToast(`Announcement "${deleteTitle}" deleted successfully.`, "success");
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete announcement.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleStatus = async (item) => {
    try {
      await updateAnnouncement(item.id, { is_active: !item.is_active });
      showToast(`Announcement status updated.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update status.", "danger");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Announcements</h1>
          <p className="text-xs text-slate-400 mt-1">Manage announcements and important messages shown to students.</p>
        </div>
        <Button onClick={openAddModal} icon={Plus} className="shadow-lg shadow-primary/10">
          Add Announcement
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title or message..."
        />

        {/* Class Filter */}
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none bg-white text-slate-700"
        >
          <option value="ALL">All Classes (Filter)</option>
          {availableClasses.filter(c => c.id !== "").map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none bg-white text-slate-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>

      {/* Content List */}
      {loading ? (
        <LoadingSpinner message="Retrieving announcements list..." />
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Announcements Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Click "+ Add Announcement" to create your first notification message for students.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Announcement Title</th>
                  <th className="px-6 py-3">Target Class</th>
                  <th className="px-6 py-3">Publish Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredAnnouncements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors animate-fade-in">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{item.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.message}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs text-slate-600">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
                        {item.class_name || "All Classes"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {item.publish_date || "Today"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleStatus(item)} className="cursor-pointer">
                        {item.is_active ? (
                          <span className="flex items-center gap-1 w-fit px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                            <Eye className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 w-fit px-2.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-xs font-bold rounded-full">
                            <EyeOff className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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

      {/* CRUD Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Edit Announcement" : "Create Announcement"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Announcement Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exam Schedule Update"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Class</label>
            <select
              value={selectedClassId}
              onChange={handleClassChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
            >
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Publish Date</label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Announcement Message / Note</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the full announcement message for students..."
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 shrink-0">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status</label>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-success after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
              <span className="ml-3 text-sm font-semibold text-slate-600">
                {isActive ? "Active" : "Inactive"}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 shrink-0">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {editItem ? "Save Changes" : "Create Announcement"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Announcement?"
        message={`Are you sure you want to delete "${deleteTitle}"? Students will no longer see this message.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Announcements;
