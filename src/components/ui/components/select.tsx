import { cn } from "../lib/utils";
import type { SelectHTMLAttributes } from "react";
import {
  formControlClass,
  formControlErrorClass,
  formErrorClass,
  formHintClass,
  formLabelClass,
} from "../lib/form-styles";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  labelClassName?: string;
}

export function Select({
  label,
  error,
  hint,
  className,
  labelClassName,
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className={cn(formLabelClass, labelClassName)}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(formControlClass, error && formControlErrorClass, className)}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p className={formHintClass}>{hint}</p>}
      {error && <p className={formErrorClass}>{error}</p>}
    </div>
  );
}
