import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { useAuth } from "../hooks/useAuth";
import {
  BookOpen,
  FileText,
  FileClock,
  FileSpreadsheet,
  FolderOpen,
  Plus,
  TrendingUp,
  File,
  Eye,
  EyeOff
} from "lucide-react";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export const Dashboard = () => {
  const { adminRecord } = useAuth();
  const [counts, setCounts] = useState({
    subjects: 0,
    tests: 0,
    pdfs: 0,
    pyqPapers: 0,
    activeResources: 0,
    disabledResources: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch collections in real time for recent activity
  const { data: subjects, loading: loadingSubjects } = useSupabaseCollection("subjects", {
    sorting: [["created_at", "desc"]],
  });
  const { data: tests, loading: loadingTests } = useSupabaseCollection("tests", {
    sorting: [["created_at", "desc"]],
  });
  const { data: pyqPapers, loading: loadingPyqs } = useSupabaseCollection("pyqPapers", {
    sorting: [["created_at", "desc"]],
  });
  const { data: materials, loading: loadingMaterials } = useSupabaseCollection("materials", {
    sorting: [["created_at", "desc"]],
  });

  const subjectMap = subjects.reduce((acc, sub) => {
    acc[sub.id] = sub.name;
    return acc;
  }, {});

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const getCount = async (table, filterCol = null, filterVal = null) => {
          let q = supabase.from(table).select("*", { count: "exact", head: true });
          if (filterCol !== null && filterVal !== null) {
            q = q.eq(filterCol, filterVal);
          }
          const { count, error } = await q;
          if (error) return 0;
          return count || 0;
        };

        const [
          subjCount,
          testCount,
          pyqCount,
          matCount,
          activeResCount,
          disabledResCount,
          impTopicsCount,
          genScienceCount
        ] = await Promise.all([
          getCount("subjects"),
          getCount("tests"),
          getCount("previous_year_questions"),
          getCount("materials"),
          getCount("resources", "is_published", true),
          getCount("resources", "is_published", false),
          getCount("important_topics"),
          getCount("general_science"),
        ]);

        setCounts({
          subjects: subjCount,
          tests: testCount,
          pdfs: matCount + pyqCount + impTopicsCount + genScienceCount,
          pyqPapers: pyqCount,
          activeResources: activeResCount,
          disabledResources: disabledResCount,
        });
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [materials, pyqPapers, tests, subjects]); // Re-calculate when collections update

  // Merge and sort recent activities
  const getRecentActivities = () => {
    const combined = [
      ...subjects.slice(0, 5).map(item => ({
        id: item.id,
        title: item.name,
        displayType: "Subject",
        subjectId: item.id,
        createdAt: item.createdAt,
        status: item.active !== false,
      })),
      ...tests.slice(0, 5).map(item => ({
        id: item.id,
        title: item.title,
        displayType: "Test",
        subjectId: item.subjectId,
        createdAt: item.createdAt,
        status: item.published !== false,
      })),
      ...pyqPapers.slice(0, 5).map(item => ({
        id: item.id,
        title: item.title,
        displayType: "Previous Paper",
        subjectId: item.subjectId,
        createdAt: item.createdAt,
        status: item.published !== false,
      })),
      ...materials.slice(0, 5).map(item => ({
        id: item.id,
        title: item.title,
        displayType: "PDF/Material",
        subjectId: item.subjectId,
        createdAt: item.createdAt,
        status: item.published !== false,
      })),
    ];

    combined.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return combined.slice(0, 8);
  };

  const recentItems = getRecentActivities();
  const loadingRecent = loadingSubjects || loadingTests || loadingPyqs || loadingMaterials;

  const statsCards = [
    { label: "Total Subjects", count: counts.subjects, icon: BookOpen, color: "bg-violet-500" },
    { label: "Total Tests", count: counts.tests, icon: FileSpreadsheet, color: "bg-sky-500" },
    { label: "Total PDFs", count: counts.pdfs, icon: FileText, color: "bg-emerald-500" },
    { label: "Previous Papers", count: counts.pyqPapers, icon: FileClock, color: "bg-amber-500" },
    { label: "Active Resources", count: counts.activeResources, icon: FolderOpen, color: "bg-indigo-500" },
    { label: "Disabled Resources", count: counts.disabledResources, icon: FolderOpen, color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary-dark to-primary p-6 md:p-8 rounded-2xl text-white shadow-xl shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Welcome back, {adminRecord?.name || "Tutor"}!
          </h1>
          <p className="text-sm text-white/80 mt-1">
            Manage course content that students see in the Android app in near real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-xs shrink-0">
          <TrendingUp className="h-4 w-4 shrink-0 animate-pulse text-green-300" />
          <span>Realtime Sync Active</span>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="shrink-0">
        <h2 className="text-lg font-bold text-slate-800 mb-4 font-heading">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/subjects"
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary/30 rounded-xl transition-all shadow-xs group cursor-pointer"
          >
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Add Subject</span>
          </Link>
          <Link
            to="/materials"
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary/30 rounded-xl transition-all shadow-xs group cursor-pointer"
          >
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shrink-0 group-hover:bg-success group-hover:text-white transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Add PDF</span>
          </Link>
          <Link
            to="/pyq"
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary/30 rounded-xl transition-all shadow-xs group cursor-pointer"
          >
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shrink-0 group-hover:bg-warning group-hover:text-white transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Add PYQ</span>
          </Link>
          <Link
            to="/tests"
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary/30 rounded-xl transition-all shadow-xs group cursor-pointer"
          >
            <div className="p-2.5 bg-sky-100 text-sky-600 rounded-xl shrink-0 group-hover:bg-info group-hover:text-white transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Add Test</span>
          </Link>
        </div>
      </div>

      {/* Statistics Metric Widgets */}
      {loadingStats ? (
        <LoadingSpinner message="Calculating database statistics..." />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 shrink-0">
          {statsCards.map((card, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col items-start hover:shadow-md transition-all"
            >
              <div className={`p-2.5 rounded-xl text-white ${card.color} shrink-0 mb-3`}>
                <card.icon className="h-5 w-5" />
              </div>
              <span className="text-2xl font-extrabold text-slate-800 leading-none">{card.count}</span>
              <span className="text-xs font-semibold text-slate-400 mt-1.5">{card.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden shrink-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-heading">Recently Added</h3>
            <p className="text-xs text-slate-400 mt-0.5">Unified feed of recently created content</p>
          </div>
        </div>

        {loadingRecent ? (
          <LoadingSpinner message="Fetching updates..." />
        ) : recentItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 font-semibold">
            No items have been uploaded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Content Title</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {recentItems.map((item) => (
                  <tr key={`${item.displayType}-${item.id}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">
                      <div className="flex items-center gap-2 max-w-xs md:max-w-md truncate">
                        <File className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 uppercase">
                        {item.displayType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-primary">
                      {item.displayType === "Subject" ? "Self" : (subjectMap[item.subjectId] || "General")}
                    </td>
                    <td className="px-6 py-3.5">
                      {item.status ? (
                        <span className="flex items-center gap-1 w-fit px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                          <Eye className="h-3.5 w-3.5 shrink-0" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 w-fit px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-xs font-bold rounded-full">
                          <EyeOff className="h-3.5 w-3.5 shrink-0" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400 font-semibold">
                      {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
