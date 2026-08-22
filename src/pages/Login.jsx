import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmail, resetPassword, signOutUser, getAdminRecord } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { Eye, EyeOff, Lock, Mail, GraduationCap } from "lucide-react";

/**
 * Admin Login Page with password reset capability and role authorization checks.
 */
export const Login = () => {
  const navigate = useNavigate();
  const { authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (authError) {
      showToast(authError, "danger");
      clearAuthError();
    }
  }, [authError, clearAuthError, showToast]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter both email and password.", "warning");
      return;
    }

    setLoading(true);
    try {
      console.log("[AUTH] Supabase login started for:", email);
      const result = await signInWithEmail(email.trim().toLowerCase(), password);
      const user = result.user;

      if (!user) {
        throw new Error("Invalid email or password.");
      }
      
      console.log("[AUTH] Supabase auth successful, fetching profile for UID:", user.id);
      const record = await getAdminRecord(user.id);
      
      // If user is authenticated in Supabase but NOT registered/authorized as an active admin
      if (!record || record.role !== "admin" || record.active !== true) {
        console.log("[AUTH] User is not an authorized active admin. Redirecting to admin registration flow.");
        showToast("Account authenticated, but admin registration is required.", "info");
        navigate("/create-admin", {
          state: {
            email: user.email,
            userId: user.id,
            isUnregistered: true,
          },
        });
        setLoading(false);
        return;
      }

      console.log("[AUTH] Admin authorized successfully");
      showToast("Welcome back!", "success");
      
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("[AUTH] Login failed:", error);
      let errMsg = "Invalid email or password.";
      
      if (
        error.message?.includes("Invalid login credentials") ||
        error.code === "invalid_credentials" ||
        error.message?.includes("invalid_grant")
      ) {
        errMsg = "Invalid email or password.";
      } else if (error.message?.includes("Email not confirmed")) {
        errMsg = "Please verify your email address before signing in.";
      } else if (error.message?.includes("session_expired") || error.message?.includes("JWT expired")) {
        errMsg = "Your session has expired. Please sign in again.";
      }

      showToast(errMsg, "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      showToast("Please specify your registered email.", "warning");
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(resetEmail.trim().toLowerCase());
      showToast("Password reset link has been dispatched to your inbox.", "success");
      setForgotMode(false);
      setResetEmail("");
    } catch (error) {
      console.error("Reset email failure:", error);
      showToast("Could not send password reset email. Please verify your email.", "danger");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
        {/* Logo Branding Header */}
        <div className="text-center mb-8 select-none">
          <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20 shrink-0">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">DSC GUIDANCE</h1>
          <p className="text-xs font-semibold text-slate-400 tracking-wider mt-0.5 uppercase">Admin Panel</p>
        </div>

        {!forgotMode ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="shrink-0">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Sign In</h2>
              <p className="text-xs text-slate-400">Enter your credentials to access the admin panel</p>
            </div>

            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setForgotMode(true);
                  }}
                  className="text-xs font-bold text-primary hover:text-primary-dark cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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

            <Button type="submit" loading={loading} className="w-full font-bold py-3 mt-2">
              Sign In
            </Button>

            {/* Create Admin Account Option */}
            <div className="pt-4 border-t border-slate-100 text-center shrink-0">
              <p className="text-xs text-slate-500 mb-1 font-medium">Don't have an admin account?</p>
              <Link
                to="/create-admin"
                className="text-xs font-bold text-primary hover:text-primary-dark cursor-pointer transition-colors inline-block"
              >
                Create Admin Account
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="shrink-0">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Reset Password</h2>
              <p className="text-xs text-slate-400">Enter your registered email to receive password reset link</p>
            </div>

            {/* Reset Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 shrink-0" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@dscguidance.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 shrink-0">
              <Button type="submit" loading={resetLoading} className="w-full font-bold py-3">
                Send Reset Link
              </Button>
              <Button
                variant="secondary"
                onClick={() => setForgotMode(false)}
                className="w-full font-bold py-3"
              >
                Back to Login
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
