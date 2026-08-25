import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileText,
  FileClock,
  FileSpreadsheet,
  Layers,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronUp,
  Megaphone
} from "lucide-react";
import { signOutUser } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";

export const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const { adminRecord } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible menu state
  const [testsOpen, setTestsOpen] = useState(false);

  // Auto-expand "Tests" sub-menu if on a test route
  useEffect(() => {
    if (location.pathname.startsWith("/tests")) {
      setTestsOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/subjects", label: "Subjects", icon: BookOpen },
    { path: "/classes", label: "Classes", icon: GraduationCap },
    {
      label: "Tests",
      icon: FileSpreadsheet,
      isCollapsible: true,
      isOpen: testsOpen,
      setIsOpen: setTestsOpen,
      subItems: [
        { path: "/tests", label: "All Tests" },
        { path: "/tests?type=DAILY", label: "Daily Tests" },
        { path: "/tests?type=CHAPTER_WISE", label: "Chapter-wise Tests" },
        { path: "/tests?type=CLASS_WISE", label: "Class-wise Tests" },
        { path: "/tests?type=PRACTICE", label: "Practice Tests" },
      ]
    },
    { path: "/test-series", label: "Test Series", icon: Layers },
    { path: "/pyq", label: "Previous Papers", icon: FileClock },
    { path: "/materials", label: "Study Materials", icon: FileText },
    { path: "/announcements", label: "Announcements", icon: Megaphone },
    { path: "/resources", label: "Resources / Links", icon: FolderOpen },
    { path: "/users", label: "Users", icon: Users },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-primary-dark text-white select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-wider font-heading">DSC GUIDANCE</span>
          <span className="text-[10px] text-white/60 tracking-widest font-medium uppercase">BY NANDIKOLA</span>
        </div>
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {menuItems.map((item, idx) => {
          if (item.isCollapsible) {
            const isSubItemActive = item.subItems.some(sub => {
              const fullPath = sub.path;
              if (fullPath.includes("?")) {
                const [base, query] = fullPath.split("?");
                return location.pathname === base && location.search === `?${query}`;
              }
              return location.pathname === fullPath && !location.search;
            });

            return (
              <div key={idx} className="space-y-1">
                <button
                  onClick={() => item.setIsOpen(!item.isOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isSubItemActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                {item.isOpen && (
                  <div className="pl-6 space-y-1 transition-all">
                    {item.subItems.map((sub, sIdx) => (
                      <NavLink
                        key={sIdx}
                        to={sub.path}
                        onClick={isMobile ? toggleSidebar : undefined}
                        className={() => {
                          const fullPath = sub.path;
                          let isActive = false;
                          if (fullPath.includes("?")) {
                            const [base, query] = fullPath.split("?");
                            isActive = location.pathname === base && location.search === `?${query}`;
                          } else {
                            isActive = location.pathname === fullPath && !location.search;
                          }

                          return `flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? "bg-primary text-white shadow-md shadow-primary/20"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          }`;
                        }}
                      >
                        <span className="w-1 h-1 rounded-full bg-white/40 shrink-0" />
                        <span>{sub.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? toggleSidebar : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive && !location.search
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Admin Profile & Logout Footer */}
      <div className="p-4 border-t border-white/10 shrink-0 bg-black/10">
        <div className="flex items-center gap-3 px-2 py-2 mb-3">
          <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 border border-white/10">
            {adminRecord?.name ? adminRecord.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate leading-tight">{adminRecord?.name || "Admin"}</p>
            <p className="text-[10px] text-white/50 capitalize font-medium">
              {adminRecord?.role === "admin" ? "Administrator" : "Student"}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-300 hover:text-red-100 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className={`fixed inset-0 z-40 transition-all duration-300 ${isOpen ? "visible" : "invisible"}`}>
        {/* Mobile Backdrop */}
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={toggleSidebar}
        />
        {/* Drawer content */}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-primary-dark shadow-2xl transition-transform duration-300 transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </aside>
      </div>
    );
  }

  return (
    <aside className="w-64 bg-primary-dark shrink-0 hidden md:block h-screen sticky top-0 border-r border-white/5">
      {sidebarContent}
    </aside>
  );
};

export default Sidebar;
