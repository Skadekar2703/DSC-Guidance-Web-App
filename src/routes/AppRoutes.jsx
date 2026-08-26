import React, { useState } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ConfigMissingBanner } from "../components/common/ConfigMissingBanner";
import { signOutUser } from "../services/authService";

// Page Components
import Login from "../pages/Login";
import CreateAdmin from "../pages/CreateAdmin";
import Dashboard from "../pages/Dashboard";
import Subjects from "../pages/Subjects";
import Classes from "../pages/Classes";
import Materials from "../pages/Materials";
import PYQ from "../pages/PYQ";
import Tests from "../pages/Tests";
import TestSeries from "../pages/TestSeries";
import Resources from "../pages/Resources";
import Users from "../pages/Users";
import Settings from "../pages/Settings";
import Announcements from "../pages/Announcements";
import Subscription from "../pages/Subscription";

/**
 * Nested Dashboard Layout wrapper enforcing strict admin role authorization.
 */
const AdminDashboardLayout = () => {
  const { user, loading, isAdmin, isAuthorized } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullPage message="Authenticating session..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but not an active Admin, sign out and reject access
  if (!isAuthorized || !isAdmin) {
    signOutUser();
    return <Navigate to="/login" replace />;
  }

  // Map path sub-routes to appropriate title headers
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "Dashboard Overview";
    if (path.includes("subjects")) return "Manage Subjects";
    if (path.includes("classes")) return "Manage Classes";
    if (path.includes("materials")) return "Study Notes & PDFs";
    if (path.includes("pyq")) return "Previous Year Papers";
    if (path.includes("tests")) return "Quizzes & Exam Links";
    if (path.includes("test-series")) return "Test Series Bundles";
    if (path.includes("resources")) return "Generic Resources";
    if (path.includes("subscription")) return "Subscription Settings";
    if (path.includes("users")) return "Admin Management Directory";
    if (path.includes("settings")) return "Application Settings";
    if (path.includes("announcements")) return "Announcements & Notices";
    return "DSC Guidance Admin";
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isMobile={false}
      />
      {/* Mobile Drawer Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isMobile={true}
      />
      
      {/* Page view content shell */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Navbar toggleSidebar={() => setSidebarOpen(true)} title={getPageTitle()} />
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const AppRoutes = () => {
  const { user, loading, isAdmin, isConfigured } = useAuth();

  if (!isConfigured) {
    return <ConfigMissingBanner />;
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Initializing application..." />;
  }

  return (
    <Routes>
      {/* Login Screen - redirect to dashboard if authenticated admin */}
      <Route
        path="/login"
        element={
          user && isAdmin ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />

      {/* Create Admin Account Page */}
      <Route path="/create-admin" element={<CreateAdmin />} />

      {/* Protected Admin Console Routes */}
      <Route element={<AdminDashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/study-materials" element={<Navigate to="/materials" replace />} />
        <Route path="/pyq" element={<PYQ />} />
        <Route path="/previous-papers" element={<Navigate to="/pyq" replace />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/tests/daily" element={<Navigate to="/tests?type=DAILY" replace />} />
        <Route path="/tests/chapter-wise" element={<Navigate to="/tests?type=CHAPTER_WISE" replace />} />
        <Route path="/tests/class-wise" element={<Navigate to="/tests?type=CLASS_WISE" replace />} />
        <Route path="/tests/practice" element={<Navigate to="/tests?type=PRACTICE" replace />} />
        <Route path="/test-series" element={<TestSeries />} />
        <Route path="/test%20series" element={<Navigate to="/test-series" replace />} />
        <Route path="/test series" element={<Navigate to="/test-series" replace />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/premium-plan" element={<Navigate to="/subscription" replace />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/announcements" element={<Announcements />} />
      </Route>

      {/* Wildcard Fallbacks */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
