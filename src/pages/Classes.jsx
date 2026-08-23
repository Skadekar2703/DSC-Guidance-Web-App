import React, { useState, useEffect } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { addClass, updateClass, deleteClass } from "../services/classesService";
import { getClassSubjects, updateClassSubjects } from "../services/classSubjectsService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Plus, Edit2, Trash2, Eye, EyeOff, GraduationCap, Award, BookOpen } from "lucide-react";

export const Classes = () => {
  const { showToast } = useToast();
  
  // Realtime subscription to classes & subjects
  const { data: classes, loading: classesLoading } = useSupabaseCollection("classes", {
    sorting: [["display_order", "asc"]],
  });
  const { data: subjects, loading: subjectsLoading } = useSupabaseCollection("subjects", {
    sorting: [["display_order", "asc"]],
  });

  // Class-Subject Junction Map State { classId: [subjectObj, ...] }
  const [classSubjectsMap, setClassSubjectsMap] = useState({});
  const [mapLoading, setMapLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editClassItem, setEditClassItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  // Deletion State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchClassSubjectMappings = async () => {
    try {
      const data = await getClassSubjects();
      const map = {};
      data.forEach((row) => {
        if (!map[row.class_id]) {
          map[row.class_id] = [];
        }
        if (row.subjects) {
          map[row.class_id].push(row.subjects);
        }
      });
      setClassSubjectsMap(map);
    } catch (err) {
      console.error("Error loading class subject mappings:", err);
    } finally {
      setMapLoading(false);
    }
  };

  useEffect(() => {
    fetchClassSubjectMappings();
  }, [classes]);

  // Filters calculation
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch = cls.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && cls.active === true) || 
      (statusFilter === "inactive" && cls.active === false);
    return matchesSearch && matchesStatus;
  });

  const openAddModal = () => {
    setEditClassItem(null);
    setName("");
    setDisplayOrder(classes.length + 1);
    setActive(true);
    setSelectedSubjectIds([]);
    setModalOpen(true);
  };

  const openEditModal = (cls) => {
    setEditClassItem(cls);
    setName(cls.name || "");
    setDisplayOrder(cls.displayOrder || 1);
    setActive(cls.active !== false);
    
    // Pre-populate assigned subjects
    const assignedSubs = classSubjectsMap[cls.id] || [];
    setSelectedSubjectIds(assignedSubs.map((s) => s.id));
    setModalOpen(true);
  };

  const handleSubjectCheckboxToggle = (subId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Class name is required.", "warning");
      return;
    }

    setFormLoading(true);
    const classData = {
      name: name.trim(),
      displayOrder: Number(displayOrder),
      active: Boolean(active),
    };

    try {
      let classId = editClassItem?.id;

      if (editClassItem) {
        await updateClass(editClassItem.id, classData);
      } else {
        const newClass = await addClass(classData);
        classId = newClass?.id;
      }

      if (classId) {
        try {
          await updateClassSubjects(classId, selectedSubjectIds);
        } catch (subErr) {
          console.warn("Could not save class-subject mapping:", subErr.message);
          showToast(subErr.message || "Class saved! Run migration SQL to persist subject assignments.", "warning");
          setModalOpen(false);
          fetchClassSubjectMappings();
          return;
        }
      }

      showToast(`Class ${editClassItem ? "updated" : "created"} successfully.`, "success");
      setModalOpen(false);
      fetchClassSubjectMappings();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to save class details.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrigger = (cls) => {
    setDeleteId(cls.id);
    setDeleteName(cls.name);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteClass(deleteId);
      showToast(`Class "${deleteName}" deleted successfully.`, "success");
      setDeleteId(null);
      fetchClassSubjectMappings();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete class.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleClassActive = async (cls) => {
    try {
      await updateClass(cls.id, {
        active: !cls.active
      });
      showToast(`Class status updated.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle status.", "danger");
    }
  };

  const seedClasses = async () => {
    setFormLoading(true);
    try {
      const initialClasses = [
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
      ];
      
      const existingNames = classes.map(c => c.name);
      const toAdd = initialClasses.filter(name => !existingNames.includes(name));

      if (toAdd.length === 0) {
        showToast("Initial classes already seeded.", "info");
        return;
      }

      await Promise.all(
        toAdd.map((className, idx) => 
          addClass({
            name: className,
            displayOrder: classes.length + idx + 1,
            active: true
          })
        )
      );

      showToast(`Successfully seeded ${toAdd.length} classes.`, "success");
    } catch (err) {
      console.error("Seeding error:", err);
      showToast("Failed to seed classes.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const loading = classesLoading || subjectsLoading || mapLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Classes Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">Manage grade parameters and assign subject curriculums to each class tier.</p>
        </div>
        <div className="flex gap-2">
          {classes.length === 0 && (
            <Button onClick={seedClasses} variant="outline" disabled={formLoading}>
              Seed Class 1-10
            </Button>
          )}
          <Button onClick={openAddModal} icon={Plus} className="shadow-lg shadow-primary/10">
            Add Class
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search classes..."
        />

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
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

      {/* Classes Data Listing */}
      {loading ? (
        <LoadingSpinner message="Retrieving classes catalog and subject assignments..." />
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <GraduationCap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Classes Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Try seeding the default classes or creating a custom class tier.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Class Name</th>
                  <th className="px-6 py-3">Assigned Subjects</th>
                  <th className="px-6 py-3">Display Order</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredClasses.map((cls) => {
                  const assignedSubs = classSubjectsMap[cls.id] || [];

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                            <Award className="h-4.5 w-4.5" />
                          </div>
                          <span className="font-semibold text-slate-800">{cls.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {assignedSubs.length === 0 ? (
                          <span className="text-xs text-slate-400 font-medium italic">No subjects assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedSubs.map((sub) => (
                              <span
                                key={sub.id}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 text-xs font-bold rounded-lg"
                              >
                                <BookOpen className="h-3 w-3" /> {sub.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-500">
                        {cls.displayOrder || 1}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleClassActive(cls)}
                          className="cursor-pointer"
                        >
                          {cls.active !== false ? (
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
                            onClick={() => openEditModal(cls)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(cls)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editClassItem ? "Edit Class & Subjects" : "Create New Class"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Class Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Class Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 6"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
            />
          </div>

          {/* Grid displayOrder & active checkbox */}
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

          {/* Assign Subjects Section */}
          {/* Assigned Subjects (Class-based subjects only) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Assigned Subjects (Class-Based)</label>
            <p className="text-xs text-slate-400">Select class-based subjects applicable for this class tier (Independent subjects operate without classes):</p>
            {subjects.filter(s => s.subject_type !== "independent").length === 0 ? (
              <p className="text-xs text-slate-400 italic">No class-based subjects created yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-100">
                {subjects.filter(s => s.subject_type !== "independent").map((sub) => {
                  const isChecked = selectedSubjectIds.includes(sub.id);

                  return (
                    <label
                      key={sub.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isChecked ? "bg-white border border-primary/30 text-slate-800 shadow-2xs" : "text-slate-600 hover:bg-white/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSubjectCheckboxToggle(sub.id)}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="truncate">{sub.name}</span>
                    </label>
                  );
                })}
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
              {editClassItem ? "Save Class" : "Create Class"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Safety Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Class?"
        message={`Are you sure you want to delete class tier "${deleteName}"? Material links referencing this class tier will be unlinked.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Classes;
