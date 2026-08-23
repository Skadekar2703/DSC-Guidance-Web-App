import React, { useState } from "react";
import { SUBJECT_ICON_REGISTRY } from "../../config/subjectIconRegistry";
import { Check, Search } from "lucide-react";

export const SubjectIconPicker = ({ value, onChange, disabled = false }) => {
  const [search, setSearch] = useState("");

  const filteredIcons = SUBJECT_ICON_REGISTRY.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.key.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Subject Symbol <span className="text-red-500">*</span>
        </label>
        <span className="text-[11px] font-semibold text-slate-400">Select a native symbol</span>
      </div>

      {/* Filter search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter symbols (e.g. Telugu, Biology, Leaf, Flask, Brain, Math)..."
          disabled={disabled}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 text-slate-700 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-60"
        />
      </div>

      {/* Icon Grid */}
      <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/30 shadow-inner">
        {filteredIcons.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No matching symbols found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredIcons.map((item) => {
              const IconComp = item.icon;
              const isSelected =
                value === item.key ||
                (!value && item.key === "book");

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => !disabled && onChange(item.key)}
                  disabled={disabled}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-xs ring-2 ring-primary/20 font-bold"
                      : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-slate-50"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <IconComp className={`h-6 w-6 mb-1.5 shrink-0 ${isSelected ? "text-primary" : "text-slate-600"}`} />
                  <span className="text-[11px] leading-tight line-clamp-1 w-full font-medium">{item.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">{item.key}</span>

                  {/* Selected checkmark indicator */}
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-primary text-white rounded-full flex items-center justify-center shadow-xs">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectIconPicker;
