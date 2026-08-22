import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Reusable Loading Spinner for inline loads and full-page overlays.
 */
export const LoadingSpinner = ({ fullPage = false, message = "Loading..." }) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-50/70 backdrop-blur-xs z-[9999] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-primary animate-spin shrink-0" />
        <p className="text-sm font-medium text-slate-600 animate-pulse">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-2 shrink-0">
      <Loader2 className="h-8 w-8 text-primary animate-spin shrink-0" />
      {message && <p className="text-xs text-slate-500 font-medium">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
