import { cn } from "../lib/utils";
import type { InputHTMLAttributes } from "react";
import {
  formControlClass,
  formControlErrorClass,
  formErrorClass,
  formHintClass,
  formLabelClass,
} from "../lib/form-styles";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  labelClassName?: string;
}

export function Input({ label, error, hint, className, labelClassName, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className={cn(formLabelClass, labelClassName)}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(formControlClass, error && formControlErrorClass, className)}
        {...props}
      />
      {hint && !error && <p className={formHintClass}>{hint}</p>}
      {error && <p className={formErrorClass}>{error}</p>}
    </div>
  );
}
