import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Reusable Button component matching DSC Guidance brand.
 */
export const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  loading = false,
  className = "",
  icon: Icon = null,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 focus:ring-primary/50",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-200",
    success: "bg-success text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-success/20 focus:ring-success/50",
    danger: "bg-danger text-white hover:bg-red-600 hover:shadow-lg hover:shadow-danger/20 focus:ring-danger/50",
    warning: "bg-warning text-white hover:bg-amber-600 hover:shadow-lg hover:shadow-warning/20 focus:ring-warning/50",
    outline: "border border-slate-200 text-slate-600 hover:bg-slate-50 focus:ring-slate-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
