import React, { useState } from "react";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { updateSubscriptionPlan } from "../services/subscriptionService";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Crown, CheckCircle2, Edit2, ShieldCheck, IndianRupee, Zap, Sparkles } from "lucide-react";

export const Subscription = () => {
  const { showToast } = useToast();

  const { data: plans, loading, error } = useSupabaseCollection("subscriptionPlans", {
    sorting: [["created_at", "asc"]],
  });

  const plan = plans && plans.length > 0 ? plans[0] : null;

  // Price Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Convert DB price in paise to INR rupees (19900 -> 199)
  const currentPriceRupees = plan ? Math.round((plan.price || 19900) / 100) : 199;

  const openEditModal = () => {
    setNewPrice(currentPriceRupees.toString());
    setModalOpen(true);
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    const priceNum = parseFloat(newPrice);

    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Please enter a valid positive amount greater than ₹0.", "warning");
      return;
    }

    if (!plan?.id) {
      showToast("Subscription plan not found in database.", "danger");
      return;
    }

    setFormLoading(true);
    try {
      await updateSubscriptionPlan(plan.id, priceNum);
      showToast(`Subscription price updated to ₹${priceNum} successfully!`, "success");
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to update subscription price:", err);
      showToast(err.message || "Failed to update subscription price.", "danger");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            Subscription & Premium Plan Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure student Premium access plan pricing and features for the mobile application.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching subscription plan details..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-sm font-semibold">
          Error loading subscription plan: {error.message}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Plan Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-dark text-white rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Background Accent Decorative Elements */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" /> Single Plan Architecture
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" /> Status: {plan?.is_active !== false ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Title & Price Display */}
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
                  {plan?.name || "Premium Access"}
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-mono">
                    ₹{currentPriceRupees}
                  </span>
                  <span className="text-sm font-medium text-slate-300">
                    / One-time payment
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  No monthly or yearly subscriptions. Pay once for full unlocked student access.
                </p>
              </div>

              {/* Includes Features List */}
              <div className="space-y-3 border-t border-white/10 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Included Features & Benefits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                    <CheckCircle2 className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                    <span>Premium Tests</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                    <CheckCircle2 className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                    <span>Premium Study Materials / PDFs</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                    <CheckCircle2 className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                    <span>Premium Test Series</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                    <CheckCircle2 className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                    <span>Premium Previous Year Papers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Button Footer */}
            <div className="pt-8 border-t border-white/10 mt-8 flex justify-end">
              <Button
                onClick={openEditModal}
                icon={Edit2}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none shadow-lg shadow-amber-500/20"
              >
                Edit Price
              </Button>
            </div>
          </div>

          {/* Info Card Sidebar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">
                Mobile Synchronization
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed space-y-2">
                The Android app dynamically fetches this price record directly from Supabase upon checkout.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Price updates instantly for all new student purchases.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Amount stored in paise ({plan?.price || 19900}) for Razorpay gateway integration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Strict single plan configuration enforced.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[11px] font-bold uppercase text-slate-400">Database Record ID</div>
              <div className="text-xs font-mono text-slate-700 truncate mt-1">{plan?.id || "N/A"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Premium Access Price"
      >
        <form onSubmit={handlePriceSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Plan Price (INR ₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="h-4 w-4" />
              </div>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="199"
                min="1"
                step="1"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Enter amount in Rupees (e.g., 199 or 249). Will be stored as {newPrice ? Math.round(parseFloat(newPrice || 0) * 100) : 0} paise in Supabase.
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-800">
            <strong>Note:</strong> Pricing must be a valid positive amount. Free access is managed per individual test/material item.
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={formLoading} className="bg-amber-500 hover:bg-amber-600 border-none text-slate-950 font-bold">
              Save New Price
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subscription;
