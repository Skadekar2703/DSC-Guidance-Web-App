import React, { useState } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { createAdminUser, updateUserProfile, deleteUserProfile, isLastActiveAdmin } from "../services/usersService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchBar } from "../components/common/SearchBar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { Plus, Edit2, Trash2, Eye, EyeOff, ShieldCheck, UserCheck } from "lucide-react";

export const Users = () => {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  // Load all registered profiles
  const { data: users, loading } = useSupabaseCollection("profiles", {
    sorting: [["created_at", "desc"]],
  });

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null); // null if adding
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin"); // Default to admin for web app management
  const [active, setActive] = useState(true);

  // Deletion State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter users to display (only show admin accounts or search results)
  const filteredUsers = users.filter((user) => {
    const search = searchQuery.toLowerCase();
    return (
      (user.full_name || user.name || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search) ||
      (user.role || "").toLowerCase().includes(search)
    );
  });

  const openAddModal = () => {
    setEditUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("admin");
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setName(user.full_name || user.name || "");
    setEmail(user.email || "");
    setPassword("");
    setRole(user.role || "admin");
    setActive(user.is_active !== false && user.active !== false);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast("Name and Email are required.", "warning");
      return;
    }

    if (!editUser && !password.trim()) {
      showToast("Password is required when creating a new administrator account.", "warning");
      return;
    }

    if (!isAdmin) {
      showToast("Only an existing administrator can create or update administrator accounts.", "danger");
      return;
    }

    setFormLoading(true);

    try {
      if (editUser) {
        await updateUserProfile(editUser.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role,
          active: Boolean(active),
        });
        showToast("Administrator profile updated successfully.", "success");
      } else {
        await createAdminUser({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          name: name.trim(),
          role: "admin",
          active: true,
        });
        showToast("New administrator account created successfully.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to save user account.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrigger = async (user) => {
    const isLast = await isLastActiveAdmin(user.id);
    if (isLast) {
      showToast("Action blocked: Cannot delete the last remaining administrator account.", "danger");
      return;
    }
    setDeleteId(user.id);
    setDeleteName(user.full_name || user.name || user.email);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    if (!isAdmin) {
      showToast("Only administrators can delete user records.", "danger");
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteUserProfile(deleteId);
      showToast(`Administrator account "${deleteName}" removed successfully.`, "success");
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to delete user record.", "danger");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleUserActive = async (user) => {
    if (!isAdmin) {
      showToast("Only administrators can modify account status.", "danger");
      return;
    }

    const currentActive = user.is_active !== false && user.active !== false;
    const targetActive = !currentActive;

    if (!targetActive) {
      const isLast = await isLastActiveAdmin(user.id);
      if (isLast) {
        showToast("Action blocked: Cannot deactivate the last remaining administrator account.", "danger");
        return;
      }
    }

    try {
      await updateUserProfile(user.id, {
        active: targetActive,
      });
      showToast(`Account status updated to ${targetActive ? "Active" : "Suspended"}.`, "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to toggle account status.", "danger");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Admin Management Directory</h1>
          <p className="text-xs text-slate-400 mt-1">Manage system administrators and role authorizations.</p>
        </div>
        {isAdmin && (
          <Button onClick={openAddModal} icon={Plus} className="shadow-lg shadow-primary/10">
            Create Admin Account
          </Button>
        )}
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search administrators by name, email, or role..."
        />
      </div>

      {/* Users table list */}
      {loading ? (
        <LoadingSpinner message="Retrieving administrator directory..." />
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 max-w-lg mx-auto">
          <UserCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Admin Accounts Found</h3>
          <p className="text-xs text-slate-400 mt-1 px-4">
            Click "Create Admin Account" to authorize a new administrator.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Administrator Profile</th>
                  <th className="px-6 py-3">Profile ID</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredUsers.map((user) => {
                  const userName = user.full_name || user.name || "Admin User";
                  const isActive = user.is_active !== false && user.active !== false;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors animate-fade-in">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{userName}</div>
                            <div className="text-xs text-slate-400 font-semibold mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 max-w-xs truncate">
                        {user.id}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === "admin" ? (
                          <span className="flex items-center gap-1.5 w-fit px-2.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 text-xs font-extrabold rounded-lg">
                            <ShieldCheck className="h-3.5 w-3.5" /> Administrator
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 w-fit px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-extrabold rounded-lg capitalize">
                            {user.role || "student"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUserActive(user)}
                          disabled={!isAdmin}
                          className={isAdmin ? "cursor-pointer" : "cursor-default"}
                        >
                          {isActive ? (
                            <span className="flex items-center gap-1 w-fit px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                              <Eye className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 w-fit px-2.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-xs font-bold rounded-full">
                              <EyeOff className="h-3 w-3" /> Suspended
                            </span>
                          )}
                        </button>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Admin Profile"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrigger(user)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Admin Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
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
        title={editUser ? "Edit Admin Credentials" : "Create New Admin Account"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nandikola Admin"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dscguidance.com"
              required
              disabled={editUser !== null}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-800 bg-white disabled:bg-slate-100"
            />
          </div>

          {/* Password Field (for new admin) */}
          {!editUser && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-800 bg-white"
              />
            </div>
          )}

          {/* Role and Status Grid */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
              >
                <option value="admin">Admin (Full System Control)</option>
                <option value="student">Student (Standard User)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Account Status</label>
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
                    {active ? "Active" : "Suspended"}
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
              {editUser ? "Save Changes" : "Create Admin Account"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Safety Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Revoke Admin Privileges?"
        message={`Are you sure you want to remove administrator "${deleteName}"? This removes their profile record from the admin system.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Users;
