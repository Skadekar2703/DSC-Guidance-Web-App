import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getAppSettings,
  updateAppSettingField,
} from "../services/appSettingsService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
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
} from "lucide-react";

export const Settings = () => {
  const { adminRecord, user } = useAuth();
  const { showToast } = useToast();

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

  const fetchSettings = async () => {
    try {
      const data = await getAppSettings();
      setSettings(data);
    } catch (err) {
      console.error("Error loading app settings:", err);
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
      placeholder: "https://wa.me/919876543210",
      value: settings.whatsapp_url,
    },
    {
      key: "youtube_url",
      name: "YouTube Channel",
      icon: Video,
      iconColor: "text-red-600",
      placeholder: "https://youtube.com/@dscguidance",
      value: settings.youtube_url,
    },
    {
      key: "telegram_url",
      name: "Telegram Group",
      icon: Send,
      iconColor: "text-sky-500",
      placeholder: "https://t.me/dscguidance",
      value: settings.telegram_url,
    },
    {
      key: "share_url",
      name: "Share App Link",
      icon: Share2,
      iconColor: "text-indigo-600",
      placeholder: "https://play.google.com/store/apps/details?id=com.example.dscguidance",
      value: settings.share_url,
    },
    {
      key: "rate_url",
      name: "Rate App Link",
      icon: Star,
      iconColor: "text-amber-500",
      placeholder: "https://play.google.com/store/apps/details?id=com.example.dscguidance",
      value: settings.rate_url,
    },
    {
      key: "contact_email",
      name: "Contact Email",
      icon: Mail,
      iconColor: "text-violet-600",
      placeholder: "support@dscguidance.com",
      value: settings.contact_email,
      isEmail: true,
    },
  ];

  const currentSelectedItem = LINK_OPTIONS.find((i) => i.key === selectedFieldKey) || LINK_OPTIONS[0];

  const openAddModal = () => {
    // Default to first unset link, or whatsapp_url if all are set
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
      showToast(`${item.name} updated successfully in Supabase (row id='1').`, "success");
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
      showToast(`${clearName} has been disabled in Supabase.`, "success");
      setClearKey(null);
      fetchSettings();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to disable link.", "danger");
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl select-none">
      {/* Page Description */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Application Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Manage user profile settings and dynamic student support links in Supabase `public.app_settings` (row id = '1').</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6 flex flex-col">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4 shrink-0">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-heading">User Profile</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Details of your logged in session</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Display Name</span>
              <span className="text-sm font-semibold text-slate-800">{adminRecord?.name || "Access Account"}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
              <span className="text-sm font-semibold text-slate-800">{user?.email || "n/a"}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Role</span>
              <span className="text-sm font-semibold text-slate-800 capitalize flex items-center gap-1.5 mt-0.5">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                {adminRecord?.role === "admin" ? "Administrator" : "Student"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Access Status</span>
              <span className="mt-1 px-2.5 py-0.5 w-fit bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                Active & Authorized
              </span>
            </div>
          </div>
        </div>

        {/* Application Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6 flex flex-col">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4 shrink-0">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-heading">Application Information</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Publishing registry and build parameters</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform Title</span>
              <span className="text-sm font-semibold text-slate-800">DSC GUIDANCE</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tagline</span>
              <span className="text-sm font-semibold text-slate-800 italic">LEARN • PRACTICE • SUCCEED</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Publisher</span>
              <span className="text-sm font-semibold text-slate-800">BY NANDIKOLA</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supabase Settings Table</span>
              <span className="text-sm font-mono font-semibold text-slate-800">public.app_settings (row id = '1')</span>
            </div>
          </div>
        </div>
      </div>

      {/* Social & Contact Links Section (Stored in public.app_settings) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6 shrink-0">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 font-heading">Social & Contact Links</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Configure live support URLs and contact details stored in Supabase `public.app_settings` (row id = '1').</p>
            </div>
          </div>

          <Button onClick={openAddModal} icon={Plus} size="sm">
            Add Link
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner message="Retrieving application settings from Supabase..." />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {LINK_OPTIONS.map((item) => {
              const IconComp = item.icon;
              const isSet = Boolean(item.value && item.value.trim().length > 0);

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-white rounded-xl shadow-2xs border border-slate-100 shrink-0">
                      <IconComp className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                      {isSet ? (
                        <a
                          href={item.isEmail ? `mailto:${item.value}` : item.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline font-mono truncate block max-w-md"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not configured</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
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

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 shrink-0">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Save to Supabase
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
        message={`Are you sure you want to clear and disable ${clearName}? The field in Supabase (row id='1') will be set to empty and students will no longer see this contact option.`}
        loading={clearLoading}
      />
    </div>
  );
};

export default Settings;
