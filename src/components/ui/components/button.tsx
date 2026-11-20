import { cn } from "../lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-medical-600 text-white hover:bg-medical-700 focus:ring-medical-500",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-teal-500",
  ghost: "text-slate-700 hover:bg-slate-100 focus:ring-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-11 px-4 py-2.5 text-sm sm:text-base",
  lg: "min-h-12 px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
