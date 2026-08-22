import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getAppSettings,
  updateAppSettingField,
} from "../services/appSettingsService";
import { signOutUser, resetPassword } from "../services/authService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Info,
  Plus,
  Edit2,
  Share2,
  MessageSquare,
  Video,
  Send,
  Star,
  Mail,
  Eye,
  EyeOff,
  Link2,
  LogOut,
  Key,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const Settings = () => {
  const { adminRecord, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    id: "1",
    whatsapp_url: "",
    youtube_url: "",
    telegram_url: "",
    share_url: "",
    rate_url: "",
    contact_email: "",
  });
  const [loading, setLoading] = useState(true);

  // Edit/Add Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFieldKey, setSelectedFieldKey] = useState("whatsapp_url");
  const [inputValue, setInputValue] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Disable/Clear dialog state
  const [clearKey, setClearKey] = useState(null);
  const [clearName, setClearName] = useState("");
  const [clearLoading, setClearLoading] = useState(false);

  // Password Reset loading
  const [pwResetLoading, setPwResetLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await getAppSettings();
      setSettings(data);
    } catch (err) {
      console.error("Error loading application settings:", err);
      showToast("Could not retrieve application settings.", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const LINK_OPTIONS = [
    {
      key: "whatsapp_url",
      name: "WhatsApp Community",
      icon: MessageSquare,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      placeholder: "https://wa.me/919876543210",
      value: settings.whatsapp_url,
    },
    {
      key: "youtube_url",
      name: "YouTube Channel",
      icon: Video,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      placeholder: "https://youtube.com/@dscguidance",
      value: settings.youtube_url,
    },
    {
      key: "telegram_url",
      name: "Telegram Group",
      icon: Send,
      iconColor: "text-sky-500",
      bgColor: "bg-sky-50",
      placeholder: "https://t.me/dscguidance",
      value: settings.telegram_url,
    },
    {
      key: "share_url",
      name: "Share App Link",
      icon: Share2,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      placeholder: "https://play.google.com/store/apps/details?id=com.example.dscguidance",
      value: settings.share_url,
    },
    {
      key: "rate_url",
      name: "Rate App Link",
      icon: Star,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50",
      placeholder: "https://play.google.com/store/apps/details?id=com.example.dscguidance",
      value: settings.rate_url,
    },
    {
      key: "contact_email",
      name: "Contact Email",
      icon: Mail,
      iconColor: "text-violet-600",
      bgColor: "bg-violet-50",
      placeholder: "support@dscguidance.com",
      value: settings.contact_email,
      isEmail: true,
    },
  ];

  const currentSelectedItem = LINK_OPTIONS.find((i) => i.key === selectedFieldKey) || LINK_OPTIONS[0];

  const openAddModal = () => {
    const firstUnset = LINK_OPTIONS.find((i) => !i.value || !i.value.trim());
    const targetKey = firstUnset ? firstUnset.key : "whatsapp_url";
    setSelectedFieldKey(targetKey);
    const item = LINK_OPTIONS.find((i) => i.key === targetKey);
    setInputValue(item?.value || "");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedFieldKey(item.key);
    setInputValue(item.value || "");
    setModalOpen(true);
  };

  const handleFieldSelectChange = (e) => {
    const key = e.target.value;
    setSelectedFieldKey(key);
    const item = LINK_OPTIONS.find((i) => i.key === key);
    setInputValue(item?.value || "");
  };

  const handleSaveSetting = async (e) => {
    e.preventDefault();
    const item = currentSelectedItem;
    const val = inputValue.trim();

    if (val) {
      if (item.isEmail) {
        if (!val.includes("@") || !val.includes(".")) {
          showToast("Please enter a valid email address.", "warning");
          return;
        }
      } else {
        if (!val.startsWith("http://") && !val.startsWith("https://")) {
          showToast("Please enter a valid URL starting with http:// or https://", "warning");
          return;
        }
      }
    }

    setFormLoading(true);
    try {
      await updateAppSettingField(item.key, val);
      showToast(`${item.name} updated successfully.`, "success");
      setModalOpen(false);
      fetchSettings();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to update setting.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDisableTrigger = (item) => {
    setClearKey(item.key);
    setClearName(item.name);
  };

  const handleDisableConfirm = async () => {
    if (!clearKey) return;
    setClearLoading(true);
    try {
      await updateAppSettingField(clearKey, "");
      showToast(`${clearName} disabled successfully.`, "success");
      setClearKey(null);
      fetchSettings();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to disable link.", "danger");
    } finally {
      setClearLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const userEmail = user?.email || adminRecord?.email;
    if (!userEmail) {
      showToast("Unable to identify registered email address.", "warning");
      return;
    }
    setPwResetLoading(true);
    try {
      await resetPassword(userEmail);
      showToast(`Password reset link dispatched to ${userEmail}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Could not send password reset link.", "danger");
    } finally {
      setPwResetLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      showToast("Failed to sign out.", "danger");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-0 sm:px-2 w-full overflow-hidden">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight font-heading">Application Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage administrator profile, application branding parameters, and student contact options.</p>
      </div>

      {/* Grid Section: Profile & App Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Profile Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800 font-heading truncate">Admin Profile</h3>
                <p className="text-xs text-slate-400">Authenticated administrator details</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
                <span className="font-semibold text-slate-800 break-words">{adminRecord?.name || "Administrator"}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                <span className="font-semibold text-slate-800 break-all">{user?.email || adminRecord?.email || "N/A"}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Role</span>
                <span className="font-semibold text-slate-800 capitalize flex items-center gap-1.5 mt-0.5">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  {adminRecord?.role === "admin" ? "Administrator" : "Staff"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Status</span>
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Active & Authorized
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Application Information Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800 font-heading truncate">Application Information</h3>
                <p className="text-xs text-slate-400">Platform release and branding details</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Application Name</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  DSC GUIDANCE
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Publisher</span>
                <span className="font-semibold text-slate-800">BY NANDIKOLA</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tagline</span>
                <span className="font-semibold text-slate-700 italic">LEARN • PRACTICE • SUCCEED</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Version</span>
                <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  v1.0.0 (Production)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social & Contact Links Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-heading">Social & Contact Links</h3>
              <p className="text-xs text-slate-400">Configure student support URLs and social community links.</p>
            </div>
          </div>

          <Button onClick={openAddModal} icon={Plus} size="sm" className="w-full sm:w-auto shrink-0">
            Add Link
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner message="Retrieving configuration..." />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {LINK_OPTIONS.map((item) => {
              const IconComp = item.icon;
              const isSet = Boolean(item.value && item.value.trim().length > 0);

              return (
                <div
                  key={item.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border border-slate-100 shrink-0 ${item.bgColor}`}>
                      <IconComp className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                      {isSet ? (
                        <a
                          href={item.isEmail ? `mailto:${item.value}` : item.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline font-mono truncate block max-w-full sm:max-w-md break-all"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not configured</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                    {isSet ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                        <Eye className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold rounded-full">
                        <EyeOff className="h-3 w-3" /> Disabled
                      </span>
                    )}

                    <button
                      onClick={() => openEditModal(item)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>

                    {isSet && (
                      <button
                        onClick={() => handleDisableTrigger(item)}
                        className="px-2.5 py-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
                        title="Disable Link"
                      >
                        Disable
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Account Security & Actions Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-heading">Account & Security</h3>
            <p className="text-xs text-slate-400">Security actions and session management</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div>
            <h4 className="text-sm font-bold text-slate-700">Password & Security</h4>
            <p className="text-xs text-slate-400">Dispatch a secure password reset link to your registered email.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePasswordReset}
            loading={pwResetLoading}
            className="w-full sm:w-auto shrink-0"
          >
            Reset Password
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <h4 className="text-sm font-bold text-slate-700">Sign Out</h4>
            <p className="text-xs text-slate-400">End your current administrator session on this device.</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shrink-0"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Edit / Add Link Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Configure ${currentSelectedItem.name}`}
        size="md"
      >
        <form onSubmit={handleSaveSetting} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Platform / Link Type</label>
            <select
              value={selectedFieldKey}
              onChange={handleFieldSelectChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none bg-white text-slate-800 font-medium"
            >
              {LINK_OPTIONS.map((i) => (
                <option key={i.key} value={i.key}>
                  {i.name} {i.value ? "(Active)" : "(Unset)"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {currentSelectedItem.isEmail ? "Email Address" : "Destination URL"}
            </label>
            <div className="relative">
              {currentSelectedItem.isEmail ? (
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0" />
              )}
              <input
                type={currentSelectedItem.isEmail ? "email" : "url"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentSelectedItem.placeholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-slate-800 bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Leave empty to disable this option for students.</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-slate-100 pt-4 shrink-0">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formLoading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" loading={formLoading} className="w-full sm:w-auto">
              Save Link Setting
            </Button>
          </div>
        </form>
      </Modal>

      {/* Disable Confirm Dialog */}
      <ConfirmDialog
        isOpen={clearKey !== null}
        onClose={() => setClearKey(null)}
        onConfirm={handleDisableConfirm}
        title={`Disable ${clearName}?`}
        message={`Are you sure you want to disable ${clearName}? Students will no longer see this contact option until re-configured.`}
        loading={clearLoading}
      />
    </div>
  );
};

export default Settings;
