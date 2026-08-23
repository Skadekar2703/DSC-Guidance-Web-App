import React, { useState } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addSubject, updateSubject, deleteSubject } from "../services/subjectsService";
import { uploadSubjectAsset, deleteSubjectAsset } from "../services/storageService";
import { PREDEFINED_SUBJECTS, getPredefinedSubjectByName, formatClassRange, isIndependentSubject } from "../config/subjectCatalog";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SubjectIcon } from "../components/common/SubjectIcon";
import { SubjectIconPicker } from "../components/common/SubjectIconPicker";
import { SubjectColorPicker } from "../components/common/SubjectColorPicker";
import { Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, Upload, X, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";

export const Subjects = () => {
  const { showToast } = useToast();
  const { data: subjects, loading } = useSupabaseCollection("subjects", {
    sorting: [["display_order", "asc"]],
  });
  const { data: chapters } = useSupabaseCollection("chapters");
  const { data: materials } = useSupabaseCollection("materials");
  const { data: tests } = useSupabaseCollection("tests");
  const { data: pyqPapers } = useSupabaseCollection("pyqPapers");
  const { data: importantTopics } = useSupabaseCollection("importantTopics");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
  const [typeFilter, setTypeFilter] = useState("all"); // all, class_based, independent

  // Modal forms state
  const [modalOpen, setModalOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(null); // null if adding
  const [formLoading, setFormLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [iconName, setIconName] = useState("book");
  const [backgroundColor, setBackgroundColor] = useState("#EDE7F6");
  const [subjectType, setSubjectType] = useState("class_based");
  const [classRange, setClassRange] = useState("3-10");

  // Subject Banner state
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerRemoved, setBannerRemoved] = useState(false);

  // Deletion state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteWarning, setDeleteWarning] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter & Search computation
  const filteredSubjects = subjects.filter((subj) => {
    const matchesSearch =
      subj.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subj.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const isActive = subj.is_active !== false && subj.active !== false;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "inactive" && !isActive);

    const sType = subj.subject_type || (isIndependentSubject(subj) ? "independent" : "class_based");
    const matchesType = typeFilter === "all" || sType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const resetAssetStates = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setBannerRemoved(false);
    setUploading(false);
    setUploadProgress(null);
  };

  const applyPredefinedMetadata = (subjectName) => {
    const predefined = getPredefinedSubjectByName(subjectName);
    if (predefined) {
      setSubjectType(predefined.subject_type);
      setClassRange(predefined.class_range || null);
      if (predefined.default_icon_name || predefined.default_icon_key) {
        setIconName(predefined.default_icon_name || predefined.default_icon_key);
      }
      if (predefined.default_background_color || predefined.default_icon_color) {
        setBackgroundColor(predefined.default_background_color || predefined.default_icon_color);
      }
      if (!description) {
        setDescription(predefined.description);
      }
    }
  };

  const handleNameChange = (newName) => {
    setName(newName);
    applyPredefinedMetadata(newName);
  };

  const openAddModal = () => {
    setEditSubject(null);
    setName("");
    setDescription("");
    setDisplayOrder(subjects.length + 1);
    setActive(true);
    setIconName("book");
    setBackgroundColor("#EDE7F6");
    setSubjectType("class_based");
    setClassRange("3-10");
    resetAssetStates();
    setModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditSubject(subject);
    setName(subject.name || "");
    setDescription(subject.description || "");
    setDisplayOrder(subject.display_order || subject.displayOrder || 1);
    setActive(subject.is_active !== false && subject.active !== false);

    const resolvedIcon = subject.icon_name || subject.iconName || subject.icon_key || subject.iconKey || subject.icon || "book";
    const resolvedColor = subject.background_color || subject.backgroundColor || subject.icon_color || subject.iconColor || "#EDE7F6";

    setIconName(resolvedIcon);
    setBackgroundColor(resolvedColor);

    const predefined = getPredefinedSubjectByName(subject.name);
    setSubjectType(subject.subject_type || predefined?.subject_type || "class_based");
    setClassRange(subject.class_range !== undefined ? subject.class_range : (predefined?.class_range || null));

    resetAssetStates();
    setBannerPreview(subject.banner_url || subject.bannerUrl || null);
    setModalOpen(true);
  };

  const validateImageFile = (file) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const validExts = [".png", ".jpg", ".jpeg", ".webp"];

    if ((file.type && !validTypes.includes(file.type.toLowerCase())) && !validExts.includes(ext)) {
      showToast("Invalid image format. Allowed: PNG, JPG, JPEG, WEBP", "warning");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be under 5MB.", "warning");
      return false;
    }

    return true;
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImageFile(file)) return;

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setBannerRemoved(false);
  };

  const handleBannerRemove = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setBannerRemoved(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Subject name is required.", "warning");
      return;
    }

    if (!iconName) {
      showToast("Please select a Subject Symbol.", "warning");
      return;
    }

    if (!backgroundColor) {
      showToast("Please select a Subject Background Color.", "warning");
      return;
    }

    // Check for duplicate name if creating or renaming
    const duplicate = subjects.find(
      (s) => s.name.toLowerCase() === name.trim().toLowerCase() && (!editSubject || s.id !== editSubject.id)
    );

    if (duplicate) {
      showToast(`Subject "${name.trim()}" already exists in the catalog.`, "warning");
      return;
    }

    setFormLoading(true);
    setUploading(true);

    const subjectId = editSubject ? editSubject.id : crypto.randomUUID();
    const newlyUploadedUrls = [];
    let finalBannerUrl = editSubject ? (editSubject.banner_url || editSubject.bannerUrl || null) : null;

    try {
      // 1. Handle Banner Upload/Removal
      if (bannerRemoved) {
        finalBannerUrl = null;
      } else if (bannerFile) {
        setUploadProgress("Uploading subject banner...");
        const res = await uploadSubjectAsset({
          subjectId,
          assetType: "banner",
          file: bannerFile,
        });
        finalBannerUrl = res.downloadUrl;
        newlyUploadedUrls.push(res.downloadUrl);
      }

      // 2. Derive subject_type & class_range based on predefined catalog rules
      const predefined = getPredefinedSubjectByName(name.trim());
      const finalSubjectType = predefined ? predefined.subject_type : subjectType;
      const finalClassRange = predefined ? predefined.class_range : (finalSubjectType === "independent" ? null : classRange);

      setUploadProgress("Saving subject data...");
      const payload = {
        name: name.trim(),
        description: description.trim(),
        display_order: Number(displayOrder),
        is_active: Boolean(active),
        active: Boolean(active),
        icon_name: iconName,
        icon_key: iconName,
        icon: iconName,
        background_color: backgroundColor,
        icon_color: backgroundColor,
        subject_type: finalSubjectType,
        class_range: finalClassRange,
        banner_url: finalBannerUrl,
      };

      if (editSubject) {
        await updateSubject(subjectId, payload);

        if ((bannerRemoved || bannerFile) && (editSubject.banner_url || editSubject.bannerUrl)) {
          deleteSubjectAsset(editSubject.banner_url || editSubject.bannerUrl);
        }

        showToast("Subject updated successfully.", "success");
      } else {
        await addSubject({
          id: subjectId,
          ...payload,
        });
        showToast("Subject created successfully.", "success");
      }

      setModalOpen(false);
    } catch (err) {
      console.error("Subject save error:", err);
      showToast(err.message || "Failed to save subject data.", "danger");

      for (const url of newlyUploadedUrls) {
        try {
          await deleteSubjectAsset(url);
        } catch (cleanupErr) {
          console.warn("Failed to clean up uploaded asset:", cleanupErr);
        }
      }
    } finally {
      setFormLoading(false);
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteTrigger = (subject) => {
    setDeleteId(subject.id);
    setDeleteName(subject.name);

    const chapterCount = (chapters || []).filter((c) => c.subjectId === subject.id).length;
    const materialCount = (materials || []).filter((m) => m.subjectId === subject.id).length;
    const testCount = (tests || []).filter((t) => t.subjectId === subject.id).length;
    const pyqCount = (pyqPapers || []).filter((p) => p.subjectId === subject.id).length;
    const topicCount = (importantTopics || []).filter((t) => t.subjectId === subject.id).length;

    const parts = [];
    if (chapterCount > 0) parts.push(`${chapterCount} chapters`);
    if (materialCount > 0) parts.push(`${materialCount} study materials`);
    if (testCount > 0) parts.push(`${testCount} tests`);
    if (pyqCount > 0) parts.push(`${pyqCount} previous papers`);
    if (topicCount > 0) parts.push(`${topicCount} important topics`);

    if (parts.length > 0) {
      setDeleteWarning(
        `WARNING: The subject "${subject.name}" currently contains ${parts.join(
          ", "
        )}. Deleting it will leave these resources unlinked. Are you sure you want to proceed?`
      );
    } else {
      setDeleteWarning(`Are you sure you want to delete the subject "${subject.name}"?`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const subjectToDelete = subjects.find((s) => s.id === deleteId);
      await deleteSubject(deleteId);

      if (subjectToDelete && (subjectToDelete.banner_url || subjectToDelete.bannerUrl)) {
        deleteSubjectAsset(subjectToDelete.banner_url || subjectToDelete.bannerUrl);
      }

      showToast(`Subject "${deleteName}" deleted successfully.`, "success");
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete subject.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSubjectActive = async (subject) => {
    const currentActive = subject.is_active !== false && subject.active !== false;
    try {
      await updateSubject(subject.id, {
        is_active: !currentActive,
        active: !currentActive,
      });
      showToast(`Subject "${subject.name}" status updated.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle status.", "danger");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Subjects Directory</h1>
          <p className="text-xs text-slate-400 mt-1">Manage core educational subjects, symbol icons, colors, and banners.</p>
        </div>
        <Button onClick={openAddModal} icon={Plus} className="shadow-lg shadow-primary/10">
          Add Subject
        </Button>
      </div>

      {/* Search & Filter Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search subjects by name or description..."
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-primary"
            >
              <option value="all">All Types</option>
              <option value="class_based">Class-based Subjects</option>
              <option value="independent">Independent Subjects</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Subject Cards */}
      {loading ? (
        <LoadingSpinner message="Loading subjects catalog..." />
      ) : filteredSubjects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Subjects Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Try adjusting your search filters or add a subject to the catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => {
            const banner = subject.banner_url || subject.bannerUrl;
            const isActive = subject.is_active !== false && subject.active !== false;
            const isIndep = isIndependentSubject(subject);
            const iconNameVal = subject.icon_name || subject.iconName || subject.icon_key || subject.iconKey || subject.icon || "book";
            const cardBgColor = subject.background_color || subject.backgroundColor || subject.icon_color || subject.iconColor || "#EDE7F6";

            return (
              <div
                key={subject.id}
                className="rounded-2xl border border-slate-900/10 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                style={{ backgroundColor: cardBgColor }}
              >
                {/* Banner Preview Strip */}
                {banner && (
                  <div className="h-28 w-full overflow-hidden bg-slate-100/50 relative shrink-0 border-b border-slate-900/10">
                    <img
                      src={banner}
                      alt={`${subject.name} banner`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      {/* Native Symbol in Circular White/Light Container */}
                      <div className="h-14 w-14 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-xs border border-slate-900/10">
                        <SubjectIcon
                          iconName={iconNameVal}
                          subjectName={subject.name}
                          color="#1E293B"
                          className="h-7 w-7 text-slate-800"
                        />
                      </div>

                      {/* Active Status Badge */}
                      <button
                        onClick={() => toggleSubjectActive(subject)}
                        className="cursor-pointer"
                        title="Click to toggle status"
                      >
                        {isActive ? (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-white/90 text-emerald-800 border border-emerald-300/80 text-xs font-bold rounded-full shadow-2xs">
                            <Eye className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-white/70 text-slate-600 border border-slate-300/80 text-xs font-bold rounded-full shadow-2xs">
                            <EyeOff className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">{subject.name}</h3>

                      {/* Type & Range Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {isIndep ? (
                          <span className="px-2.5 py-0.5 bg-white/75 text-purple-900 border border-purple-200/80 text-[11px] font-bold rounded-lg shadow-2xs">
                            Independent Subject
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-white/75 text-blue-900 border border-blue-200/80 text-[11px] font-bold rounded-lg shadow-2xs">
                            Class-based Subject
                          </span>
                        )}

                        <span className="px-2.5 py-0.5 bg-white/75 text-slate-800 border border-slate-200/80 text-[11px] font-semibold rounded-lg shadow-2xs">
                          {formatClassRange(subject)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-700/80 font-medium">
                        <span>Display Order: <strong className="text-slate-900">{subject.display_order || subject.displayOrder || 1}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[10px] bg-white/75 text-slate-800 border border-slate-900/10 px-2 py-0.5 rounded-md shadow-2xs">
                          <span className="h-2 w-2 rounded-full inline-block border border-slate-400" style={{ backgroundColor: cardBgColor }} />
                          {iconNameVal} ({cardBgColor})
                        </span>
                      </div>

                      <p className="text-xs text-slate-700/90 mt-2.5 leading-relaxed line-clamp-2 font-normal">
                        {subject.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="bg-white/60 backdrop-blur-xs px-5 py-3 border-t border-slate-900/10 flex items-center justify-end gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(subject)}
                    icon={Edit2}
                    className="bg-white/90 hover:bg-white text-slate-800 border-slate-300 shadow-2xs"
                  >
                    Edit Subject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTrigger(subject)}
                    icon={Trash2}
                    className="bg-white/90 hover:bg-red-50 text-red-700 border-red-200 hover:border-red-300 shadow-2xs"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CRUD Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !formLoading && setModalOpen(false)}
        title={editSubject ? `Edit Subject: ${editSubject.name}` : "Create New Subject"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Subject Name <span className="text-red-500">*</span>
            </label>

            {!editSubject ? (
              <div className="space-y-2">
                <select
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={formLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary font-medium text-slate-800 bg-white"
                >
                  <option value="">-- Select Predefined Core Subject (or enter custom below) --</option>
                  {PREDEFINED_SUBJECTS.map((ps) => {
                    const isExisting = subjects.some((s) => s.name.toLowerCase() === ps.name.toLowerCase());
                    return (
                      <option key={ps.name} value={ps.name} disabled={isExisting}>
                        {ps.name} {isExisting ? "(Already Added)" : ""}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Or enter custom subject name..."
                  required
                  disabled={formLoading}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-800 bg-white disabled:opacity-60 font-semibold"
                />
              </div>
            ) : (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Biology"
                required
                disabled={formLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-800 bg-white disabled:opacity-60 font-semibold"
              />
            )}
          </div>

          {/* Subject Type & Class Range Status */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Subject Type:</span>
              <span className={subjectType === "independent" ? "text-purple-600 font-bold" : "text-blue-600 font-bold"}>
                {subjectType === "independent" ? "Independent Subject (No Classes)" : "Class-based Subject"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Applicable Range:</span>
              <span className="font-semibold text-slate-700">
                {formatClassRange({ subject_type: subjectType, class_range: classRange })}
              </span>
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief overview of this subject..."
              rows={2}
              disabled={formLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-800 bg-white resize-none disabled:opacity-60"
            />
          </div>

          {/* Display Order & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                min={1}
                required
                disabled={formLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary text-slate-800 bg-white disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Publish Status</label>
              <div className="flex items-center h-10">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    disabled={formLoading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                  <span className="ml-3 text-xs font-bold text-slate-700">
                    {active ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Subject Symbol Selector */}
          <SubjectIconPicker
            value={iconName}
            onChange={setIconName}
            disabled={formLoading || uploading}
          />

          {/* Subject Color Selector */}
          <SubjectColorPicker
            value={backgroundColor}
            onChange={setBackgroundColor}
            disabled={formLoading || uploading}
          />

          {/* LIVE PREVIEW BOX */}
          <div className="space-y-2 select-none">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Live Card Preview
            </label>
            <div
              className="p-6 rounded-2xl border border-slate-900/10 shadow-xs transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[160px] relative overflow-hidden"
              style={{ backgroundColor: backgroundColor || "#EDE7F6" }}
            >
              {/* Inner Circular Icon Container */}
              <div className="h-16 w-16 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center shadow-xs border border-slate-900/10 mb-3 transition-all duration-200">
                <SubjectIcon
                  iconName={iconName}
                  subjectName={name}
                  color="#1E293B"
                  className="h-8 w-8 transition-all duration-200 text-slate-800"
                />
              </div>

              {/* Subject Name */}
              <h4 className="text-base font-bold text-slate-900 leading-tight">
                {name.trim() || "Subject Name Preview"}
              </h4>

              {/* Description Preview */}
              <p className="text-xs text-slate-700/80 mt-1 line-clamp-1 font-medium">
                {description.trim() || "Subject card layout preview..."}
              </p>

              {/* Symbol & HEX Badge */}
              <span className="mt-3 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-white/75 text-slate-800 border border-slate-900/10 shadow-2xs">
                Symbol: {iconName} • {backgroundColor}
              </span>
            </div>
          </div>

          {/* Subject Banner Image Upload Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
              <span>Subject Banner Image</span>
              <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, WEBP (Max 5MB)</span>
            </label>

            {bannerPreview ? (
              <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                <div className="h-24 w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={bannerPreview}
                    alt="Subject banner preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <label className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer shadow-xs transition-all flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5 text-slate-500" /> Replace Banner
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleBannerSelect}
                      disabled={formLoading}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleBannerRemove}
                    disabled={formLoading}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove Banner"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-center group">
                <ImageIcon className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors mb-1" />
                <span className="text-xs font-semibold text-slate-600 group-hover:text-primary">Click to upload Subject Banner Image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleBannerSelect}
                  disabled={formLoading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Progress indicator */}
          {uploading && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-primary text-xs font-semibold">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>{uploadProgress || "Uploading assets..."}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 shrink-0">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={formLoading || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={formLoading || uploading} disabled={formLoading || uploading}>
              {editSubject ? "Save Subject Changes" : "Save Subject"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Safety Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Subject?"
        message={deleteWarning}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Subjects;
