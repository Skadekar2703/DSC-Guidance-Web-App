import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createAdminUser, getAdminCount } from "../services/usersService";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Eye, EyeOff, Lock, Mail, User, GraduationCap, ShieldCheck, ArrowLeft } from "lucide-react";

export const CreateAdmin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAdmin } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);
  const [isFirstAdminMode, setIsFirstAdminMode] = useState(false);

  useEffect(() => {
    const checkBootstrapStatus = async () => {
      try {
        const count = await getAdminCount();
        if (count === 0) {
          setIsFirstAdminMode(true);
        } else {
          setIsFirstAdminMode(false);
        }
      } catch (err) {
        console.error("Error checking bootstrap status:", err);
      } finally {
        setCheckingBootstrap(false);
      }
    };

    checkBootstrapStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "warning");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters long.", "warning");
      return;
    }

    // Security check: Only allow if first admin bootstrap mode OR if logged in user is already an admin
    if (!isFirstAdminMode && !isAdmin) {
      showToast("Only an existing administrator can create another administrator.", "danger");
      return;
    }

    setLoading(true);

    try {
      await createAdminUser({
        email: email.trim().toLowerCase(),
        password: password,
        name: fullName.trim(),
        role: "admin",
        active: true,
      });

      showToast(
        isFirstAdminMode
          ? "Initial Admin account created successfully! You can now sign in."
          : "New Administrator account created successfully.",
        "success"
      );

      if (user && isAdmin) {
        navigate("/users", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("[CREATE_ADMIN] Failed:", error);
      let errMsg = error.message || "Failed to create administrator account.";
      if (error.message?.includes("User already registered") || error.message?.includes("already exists")) {
        errMsg = "An account with this email address already exists.";
      }
      showToast(errMsg, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
        {/* Branding Logo */}
        <div className="text-center mb-6 select-none">
          <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20 shrink-0">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">DSC GUIDANCE</h1>
          <p className="text-xs font-semibold text-slate-400 tracking-wider mt-0.5 uppercase">Admin Panel</p>
        </div>

        {/* Bootstrap Banner Notice */}
        {isFirstAdminMode && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl mb-6 flex items-center gap-3 text-xs font-semibold shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">First Administrator Setup</p>
              <p className="text-emerald-700/80 font-normal">No admin accounts found. Setup the primary administrator account.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="shrink-0 mb-2">
            <h2 className="text-xl font-bold text-slate-800 mb-0.5">Create Admin Account</h2>
            <p className="text-xs text-slate-400">Register administrative credentials</p>
          </div>

          {/* Full Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nandikola Admin"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dscguidance.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer shrink-0"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            loading={loading || checkingBootstrap}
            className="w-full font-bold py-3 mt-4"
          >
            Create Admin Account
          </Button>

          <div className="text-center pt-3 border-t border-slate-100 mt-4 shrink-0">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdmin;
