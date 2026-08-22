import React from "react";
import { Search, X } from "lucide-react";

/**
 * Reusable Search Bar input with single-click clear functionality.
 */
export const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  className = ""
}) => {
  return (
    <div className={`relative flex-1 max-w-md ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
