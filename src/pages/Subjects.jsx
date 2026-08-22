import React, { useState } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addSubject, updateSubject, deleteSubject } from "../services/subjectsService";
import { uploadSubjectAsset, deleteSubjectAsset } from "../services/storageService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

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

  // Subject Logo state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoRemoved, setLogoRemoved] = useState(false);

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
    const matchesSearch = subj.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subj.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "active") return matchesSearch && subj.active === true;
    if (statusFilter === "inactive") return matchesSearch && subj.active === false;
    return matchesSearch;
  });

  const resetAssetStates = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoRemoved(false);
    setBannerFile(null);
    setBannerPreview(null);
    setBannerRemoved(false);
    setUploading(false);
    setUploadProgress(null);
  };

  const openAddModal = () => {
    setEditSubject(null);
    setName("");
    setDescription("");
    setDisplayOrder(subjects.length + 1);
    setActive(true);
    resetAssetStates();
    setModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditSubject(subject);
    setName(subject.name || "");
    setDescription(subject.description || "");
    setDisplayOrder(subject.displayOrder || 1);
    setActive(subject.active !== false);
    resetAssetStates();
    setLogoPreview(subject.logo_url || subject.logoUrl || null);
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

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImageFile(file)) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoRemoved(false);
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoRemoved(true);
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
    if (!name.trim() || !description.trim()) {
      showToast("Subject name and description are required.", "warning");
      return;
    }

    setFormLoading(true);
    setUploading(true);

    const subjectId = editSubject ? editSubject.id : crypto.randomUUID();
    const newlyUploadedUrls = [];

    let finalLogoUrl = editSubject ? (editSubject.logo_url || editSubject.logoUrl || null) : null;
    let finalBannerUrl = editSubject ? (editSubject.banner_url || editSubject.bannerUrl || null) : null;

    try {
      // 1. Handle Logo Upload/Removal
      if (logoRemoved) {
        finalLogoUrl = null;
      } else if (logoFile) {
        setUploadProgress("Uploading subject logo...");
        const res = await uploadSubjectAsset({
          subjectId,
          assetType: "logo",
          file: logoFile,
        });
        finalLogoUrl = res.downloadUrl;
        newlyUploadedUrls.push(res.downloadUrl);
      }

      // 2. Handle Banner Upload/Removal
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

      // 3. Save to database
      setUploadProgress("Saving subject data...");
      const payload = {
        name: name.trim(),
        description: description.trim(),
        displayOrder: Number(displayOrder),
        active: Boolean(active),
        logo_url: finalLogoUrl,
        banner_url: finalBannerUrl,
      };

      if (editSubject) {
        await updateSubject(subjectId, payload);
        
        // Clean up previous images if replaced or removed
        if ((logoRemoved || logoFile) && (editSubject.logo_url || editSubject.logoUrl)) {
          deleteSubjectAsset(editSubject.logo_url || editSubject.logoUrl);
        }
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

      // Rollback newly uploaded files if DB save failed
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
    
    // Count child items linked to this subject
    const chapterCount = (chapters || []).filter(c => c.subjectId === subject.id).length;
    const materialCount = (materials || []).filter(m => m.subjectId === subject.id).length;
    const testCount = (tests || []).filter(t => t.subjectId === subject.id).length;
    const pyqCount = (pyqPapers || []).filter(p => p.subjectId === subject.id).length;
    const topicCount = (importantTopics || []).filter(t => t.subjectId === subject.id).length;
    
    const parts = [];
    if (chapterCount > 0) parts.push(`${chapterCount} chapters`);
    if (materialCount > 0) parts.push(`${materialCount} study materials`);
    if (testCount > 0) parts.push(`${testCount} tests`);
    if (pyqCount > 0) parts.push(`${pyqCount} previous papers`);
    if (topicCount > 0) parts.push(`${topicCount} important topics`);
    
    if (parts.length > 0) {
      setDeleteWarning(
        `WARNING: The subject "${subject.name}" currently contains ${parts.join(", ")}. Deleting it will leave these resources unlinked. Are you sure you want to proceed?`
      );
    } else {
      setDeleteWarning(`Are you sure you want to delete the subject "${subject.name}"?`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const subjectToDelete = subjects.find(s => s.id === deleteId);
      await deleteSubject(deleteId);

      // Clean up storage assets if present
      if (subjectToDelete) {
        if (subjectToDelete.logo_url || subjectToDelete.logoUrl) {
          deleteSubjectAsset(subjectToDelete.logo_url || subjectToDelete.logoUrl);
        }
        if (subjectToDelete.banner_url || subjectToDelete.bannerUrl) {
          deleteSubjectAsset(subjectToDelete.banner_url || subjectToDelete.bannerUrl);
        }
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
    try {
      await updateSubject(subject.id, {
        active: !subject.active
      });
      showToast(`Subject status updated.`, "success");
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
          <p className="text-xs text-slate-400 mt-1">Manage subjects that represent learning pathways.</p>
        </div>
        <Button onClick={openAddModal} icon={Plus} className="shadow-lg shadow-primary/10">
          Add Subject
        </Button>
      </div>

      {/* Search & Filter Header controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search subjects..."
        />
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Subjects</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
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
            Try adjusting your search criteria or create a new Subject to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => {
            const logo = subject.logo_url || subject.logoUrl;
            const banner = subject.banner_url || subject.bannerUrl;

            return (
              <div
                key={subject.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Optional Top Banner Preview Strip */}
                {banner ? (
                  <div className="h-20 w-full overflow-hidden bg-slate-100 relative shrink-0">
                    <img
                      src={banner}
                      alt={`${subject.name} banner`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-2 w-full bg-slate-100 shrink-0" />
                )}
                
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    {/* Subject Logo or Neutral Fallback */}
                    {logo ? (
                      <img
                        src={logo}
                        alt={`${subject.name} logo`}
                        className="h-14 w-14 rounded-2xl object-cover border border-slate-100 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <BookOpen className="h-7 w-7 text-slate-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <button
                      onClick={() => toggleSubjectActive(subject)}
                      className="cursor-pointer"
                    >
                      {subject.active !== false ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                          <Eye className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-xs font-bold rounded-full">
                          <EyeOff className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 mt-4 leading-snug">{subject.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Display Order: {subject.displayOrder || 1}</p>
                  <p className="text-sm text-slate-500 mt-3 leading-relaxed line-clamp-3">{subject.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="bg-slate-50/50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(subject)}
                    icon={Edit2}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTrigger(subject)}
                    icon={Trash2}
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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
        title={editSubject ? "Edit Subject Details" : "Create New Subject"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subject Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Biology"
              required
              disabled={formLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white disabled:opacity-60"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a summary of this subject's materials."
              rows={3}
              required
              disabled={formLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white resize-none disabled:opacity-60"
            />
          </div>

          {/* Grid: Display Order & Status toggle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                min={1}
                required
                disabled={formLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white disabled:opacity-60"
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
                    disabled={formLoading}
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

          {/* Subject Logo Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>Subject Logo</span>
              <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, WEBP (Max 5MB)</span>
            </label>
            
            {logoPreview ? (
              <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                <img
                  src={logoPreview}
                  alt="Subject logo preview"
                  className="h-16 w-16 object-cover rounded-xl border border-slate-200 bg-white shadow-xs"
                />
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer shadow-xs transition-all flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5 text-slate-500" /> Replace Logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleLogoSelect}
                      disabled={formLoading}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    disabled={formLoading}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove Logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-center group">
                <ImageIcon className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors mb-1" />
                <span className="text-xs font-semibold text-slate-600 group-hover:text-primary">Click to upload Subject Logo</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleLogoSelect}
                  disabled={formLoading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Subject Banner Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>Subject Banner</span>
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
                <span className="text-xs font-semibold text-slate-600 group-hover:text-primary">Click to upload Subject Banner</span>
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

          {/* Uploading progress indicator */}
          {uploading && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-primary text-xs font-semibold">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>{uploadProgress || "Uploading assets..."}</span>
            </div>
          )}

          {/* Form Actions footer */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 shrink-0">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={formLoading || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={formLoading || uploading} disabled={formLoading || uploading}>
              {editSubject ? "Save Changes" : "Create Subject"}
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
