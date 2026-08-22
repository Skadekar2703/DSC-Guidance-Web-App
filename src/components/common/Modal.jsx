import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Reusable modal overlay component with backdrop blur and escape-key handling.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative bg-white w-full rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300 transform scale-100 ${sizeStyles[size]}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Title bar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable contents Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 text-slate-600">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
