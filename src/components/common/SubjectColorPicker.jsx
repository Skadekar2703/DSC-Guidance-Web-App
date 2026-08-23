import React from "react";
import { Check } from "lucide-react";

export const PRESET_COLORS = [
  { name: "Soft Lavender", hex: "#EDE7F6" },
  { name: "Soft Mint", hex: "#E8F5E9" },
  { name: "Soft Sky", hex: "#E3F2FD" },
  { name: "Soft Amber", hex: "#FFF3E0" },
  { name: "Soft Pink", hex: "#FCE4EC" },
  { name: "Soft Cyan", hex: "#E0F7FA" },
  { name: "Soft Violet", hex: "#F3E5F5" },
  { name: "Soft Yellow", hex: "#FFF8E1" },
  { name: "DSC Purple", hex: "#5B2FD6" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Emerald Green", hex: "#16A34A" },
  { name: "Amber Orange", hex: "#D97706" },
];

export const SubjectColorPicker = ({ value = "#EDE7F6", onChange, disabled = false }) => {
  const normalizedValue = value ? (value.startsWith("#") ? value.toUpperCase() : `#${value.toUpperCase()}`) : "#EDE7F6";

  const handleHexChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith("#")) val = `#${val}`;
    onChange(val);
  };

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Subject Background Color <span className="text-red-500">*</span>
        </label>
        <span className="text-[11px] font-semibold text-slate-400">Select preset or enter HEX</span>
      </div>

      {/* Preset Swatches Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-6 md:grid-cols-12 gap-2 p-3 bg-slate-50/50 border border-slate-200 rounded-xl">
        {PRESET_COLORS.map((c) => {
          const isSelected = normalizedValue === c.hex.toUpperCase();
          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => !disabled && onChange(c.hex)}
              disabled={disabled}
              title={`${c.name} (${c.hex})`}
              style={{ backgroundColor: c.hex }}
              className={`h-9 w-full rounded-xl flex items-center justify-center transition-all cursor-pointer relative shadow-xs hover:scale-105 border border-slate-900/10 ${
                isSelected
                  ? "ring-2 ring-offset-2 ring-slate-800 scale-105 font-bold"
                  : "opacity-90 hover:opacity-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSelected && <Check className="h-4 w-4 text-slate-800 stroke-[3]" />}
            </button>
          );
        })}
      </div>

      {/* Custom HEX Input & Color Picker */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={normalizedValue}
            onChange={handleHexChange}
            placeholder="#EDE7F6"
            maxLength={7}
            disabled={disabled}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-white focus:outline-none focus:border-primary disabled:opacity-60 uppercase"
          />
        </div>

        <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-white">
          <input
            type="color"
            value={normalizedValue.length === 7 ? normalizedValue : "#EDE7F6"}
            onChange={(e) => !disabled && onChange(e.target.value.toUpperCase())}
            disabled={disabled}
            className="h-8 w-10 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden disabled:opacity-50"
            title="Choose custom color"
          />
          <span className="text-xs font-semibold text-slate-600 pr-2">Custom</span>
        </div>
      </div>
    </div>
  );
};

export default SubjectColorPicker;
