import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

const ToastContext = createContext({
  showToast: (message, type) => {}
});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically dismiss toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Absolute container bottom-right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 md:px-0">
        {toasts.map((toast) => {
          let styles = "bg-white border-slate-200 text-slate-800 shadow-xl";
          let icon = <Info className="h-5 w-5 text-blue-500 shrink-0" />;

          if (toast.type === "success") {
            styles = "bg-emerald-50 border-emerald-200 text-emerald-950 shadow-md";
            icon = <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />;
          } else if (toast.type === "danger" || toast.type === "error") {
            styles = "bg-red-50 border-red-200 text-red-950 shadow-md";
            icon = <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />;
          } else if (toast.type === "warning") {
            styles = "bg-amber-50 border-amber-200 text-amber-950 shadow-md";
            icon = <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start justify-between p-4 rounded-xl border pointer-events-auto transition-all duration-300 animate-slide-in ${styles}`}
            >
              <div className="flex items-start gap-3">
                {icon}
                <span className="text-sm font-medium leading-5">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 hover:opacity-75 transition-opacity text-slate-400 hover:text-slate-600 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
