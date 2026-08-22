import React, { useState, useEffect } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addResource, updateResource, deleteResource } from "../services/resourcesService";
import { getClassSubjects } from "../services/classSubjectsService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, FolderOpen, ExternalLink, MessageCircle, Play, Send, Globe, FileSpreadsheet, Link2 } from "lucide-react";

export const Resources = () => {
  const { showToast } = useToast();

  // Load database listings
  const { data: subjects, loading: loadingSubjects } = useSupabaseCollection("subjects", {
    sorting: [["display_order", "asc"]],
  });
  const { data: chapters, loading: loadingChapters } = useSupabaseCollection("chapters", {
    sorting: [["display_order", "asc"]],
  });
  const { data: classes, loading: loadingClasses } = useSupabaseCollection("classes", {
    sorting: [["display_order", "asc"]],
  });
  const { data: resources, loading: loadingResources } = useSupabaseCollection("resources", {
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

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal forms state
  const [modalOpen, setModalOpen] = useState(false);
  const [editResource, setEditResource] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [resourceType, setResourceType] = useState("Website");
  const [url, setUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [published, setPublished] = useState(true);

  // Deletion State
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Lookups
  const subjectMap = subjects.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {});
  const chapterMap = chapters.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
  const classMap = classes.reduce((acc, cl) => ({ ...acc, [cl.id]: cl.name }), {});

  // Dependent Subjects logic based on selected Class
  const availableFormSubjects = React.useMemo(() => {
    if (!classId || !classSubjectsMap[classId] || classSubjectsMap[classId].length === 0) {
      return subjects;
    }
    const assignedIds = classSubjectsMap[classId];
    return subjects.filter((sub) => assignedIds.includes(sub.id));
  }, [classId, classSubjectsMap, subjects]);

  // Form chapters filtering
  const formChapters = chapters.filter((c) => c.subjectId === subjectId);

  // Filter Resources
  const filteredResources = resources.filter((res) => {
    const matchesSearch = res.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesSubject = subjectFilter === "all" || res.subjectId === subjectFilter;
    const matchesChapter = chapterFilter === "all" || res.chapterId === chapterFilter;
    const matchesClass = classFilter === "all" || res.classId === classFilter;
    const matchesType = typeFilter === "all" || res.resourceType === typeFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "published" && res.published === true) ||
      (statusFilter === "draft" && res.published === false);

    return matchesSearch && matchesSubject && matchesChapter && matchesClass && matchesType && matchesStatus;
  });

  const openAddModal = () => {
    setEditResource(null);
    setTitle("");
    setDescription("");
    setClassId(classes[0]?.id || "");
    setSubjectId(subjects[0]?.id || "");
    setChapterId("");
    setResourceType("Website");
    setUrl("");
    setDisplayOrder(resources.length + 1);
    setPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (res) => {
    setEditResource(res);
    setTitle(res.title || "");
    setDescription(res.description || "");
    setClassId(res.classId || "");
    setSubjectId(res.subjectId || "");
    setChapterId(res.chapterId || "");
    setResourceType(res.resourceType || "Website");
    setUrl(res.url || "");
    setDisplayOrder(res.displayOrder || 1);
    setPublished(res.published !== false);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !subjectId) {
      showToast("Resource Title, Destination URL, and Subject are required.", "warning");
      return;
    }

    if (!url.trim().startsWith("http")) {
      showToast("Please enter a valid destination link starting with http:// or https://", "warning");
      return;
    }

    setFormLoading(true);
    const resourceData = {
      title: title.trim(),
      description: description.trim(),
      subjectId,
      chapterId: chapterId || null,
      classId: classId || null,
      resourceType,
      url: url.trim(),
      displayOrder: Number(displayOrder),
      published: Boolean(published),
      active: true,
    };

    try {
      if (editResource) {
        await updateResource(editResource.id, resourceData);
        showToast("Resource updated successfully.", "success");
      } else {
        await addResource(resourceData);
        showToast("Resource created successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save resource link.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrigger = (res) => {
    setDeleteItem(res);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    try {
      await deleteResource(deleteItem.id);
      showToast(`Resource "${deleteItem.title}" deleted successfully.`, "success");
      setDeleteItem(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete resource link.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const togglePublished = async (res) => {
    try {
      await updateResource(res.id, {
        published: !res.published
      });
      showToast(`Publication status updated.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle status.", "danger");
    }
  };

  const getResourceTypeIcon = (type) => {
    switch (type) {
      case "WhatsApp":
        return <MessageCircle className="h-4.5 w-4.5 text-emerald-600" />;
      case "YouTube":
        return <Play className="h-4.5 w-4.5 text-red-600" />;
      case "Telegram":
        return <Send className="h-4.5 w-4.5 text-sky-500" />;
      case "Google Form":
        return <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-600" />;
      default:
        return <Globe className="h-4.5 w-4.5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Generic Resources & Links</h1>
          <p className="text-xs text-slate-400 mt-1">Manage external study portals, video playlists, and community links.</p>
        </div>
        <Button
          onClick={openAddModal}
          icon={Plus}
          disabled={subjects.length === 0}
          className="shadow-lg shadow-primary/10"
        >
          Add Resource Link
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
            <label className="text-slate-400">Platform Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="Website">Website</option>
              <option value="YouTube">YouTube</option>
              <option value="Telegram">Telegram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Google Form">Google Form</option>
              <option value="Other">Other</option>
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

      {/* Resources Listing */}
      {loadingSubjects || loadingChapters || loadingClasses || loadingResources ? (
        <LoadingSpinner message="Retrieving generic resources..." />
      ) : filteredResources.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Resources Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Click "Add Resource Link" to add external reference portals or study links.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Resource Title</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Subject / Chapter</th>
                  <th className="px-6 py-3">Platform</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredResources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                          {getResourceTypeIcon(res.resourceType)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{res.title}</div>
                          {res.url && (
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary font-mono hover:underline truncate block max-w-xs"
                            >
                              {res.url}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs text-slate-600">
                      {classMap[res.classId] || "All Classes"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-xs">
                        {subjectMap[res.subjectId] || "Unassigned"}
                      </div>
                      {res.chapterId && chapterMap[res.chapterId] && (
                        <div className="text-[11px] text-slate-400 font-medium">
                          {chapterMap[res.chapterId]}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] uppercase rounded-lg border border-slate-200">
                        {res.resourceType || "Website"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublished(res)}
                        className="cursor-pointer"
                      >
                        {res.published !== false ? (
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
                        {res.url && (
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-slate-100 text-primary rounded-lg transition-colors cursor-pointer"
                            title="Launch Link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => openEditModal(res)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(res)}
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
        title={editResource ? "Edit Resource Link" : "Add New Resource Link"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Resource Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Official SCERT Textbook Portal"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Destination URL</label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/resource"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-800 bg-white"
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
                    setChapterId("");
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
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setChapterId("");
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

          {/* Platform Type & Chapter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Platform Type</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                <option value="Website">Website Link</option>
                <option value="YouTube">YouTube Video/Playlist</option>
                <option value="Telegram">Telegram Channel</option>
                <option value="WhatsApp">WhatsApp Group</option>
                <option value="Google Form">Google Form Link</option>
                <option value="Other">Other Media Link</option>
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about this link resource..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none resize-none"
            />
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
              {editResource ? "Save Resource" : "Create Resource"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Resource Link?"
        message={`Are you sure you want to delete "${deleteItem?.title}"?`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Resources;
