import { cn } from "./utils";

/** Shared form control styles — use on Input, Select, Textarea for consistent UI. */
export const formLabelClass =
  "block text-sm font-medium text-slate-700 dark:text-slate-300";

export const formControlClass = cn(
  "block w-full min-h-11 rounded-xl border border-medical-200 bg-white px-3.5 py-2.5",
  "text-base text-slate-900 shadow-sm transition",
  "placeholder:text-slate-400",
  "focus:border-medical-500 focus:outline-none focus:ring-2 focus:ring-medical-500/20",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "sm:text-sm",
  "dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500",
  "dark:focus:border-medical-400 dark:focus:ring-medical-500/30"
);

export const formControlErrorClass = "border-red-500 focus:border-red-500 focus:ring-red-500/20";

export const formCardClass =
  "rounded-2xl border border-medical-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

export const formCardTitleClass =
  "font-semibold text-medical-900 dark:text-white";

export const formHintClass = "text-xs text-slate-500 dark:text-slate-400";

export const formErrorClass = "text-sm text-red-600 dark:text-red-400";

export const authFormCardClass =
  "rounded-2xl border border-medical-100 bg-white/90 p-6 shadow-xl shadow-medical-900/5 backdrop-blur-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900/90";
