import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Calendar, Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

/**
 * Top Navbar component with title, calendar, notification controls, and admin profile card.
 */
export const Navbar = ({ toggleSidebar, title = "Admin Panel" }) => {
  const { adminRecord } = useAuth();
  const navigate = useNavigate();

  const getFormattedDate = () => {
    const options = { weekday: "long", year: "numeric", month: "short", day: "numeric" };
    return new Date().toLocaleDateString("en-US", options);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Toggle Button for mobile drawer */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer shrink-0"
          aria-label="Toggle Navigation Sidebar"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight font-heading truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        {/* Current Date Widget */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Calendar className="h-4 w-4" />
          <span>{getFormattedDate()}</span>
        </div>

        {/* Notifications Alarm icon -> Navigates to /announcements */}
        <button 
          onClick={() => navigate("/announcements")}
          className="relative p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100/70 transition-all cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="View Announcements"
          title="Announcements & Notices"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
        </button>

        <div className="h-8 w-px bg-slate-100 hidden sm:block" />

        {/* Profile Card -> Navigates to /settings */}
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-3 select-none p-1.5 -mr-1.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Open Account Settings"
          title="Admin Settings & Profile"
        >
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-bold text-slate-700 leading-tight">{adminRecord?.name || "Admin User"}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {adminRecord?.role === "admin" ? "Administrator" : "Student"}
            </span>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shrink-0 hover:bg-primary hover:text-white transition-colors">
            {adminRecord?.name ? adminRecord.name.charAt(0).toUpperCase() : "A"}
          </div>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
