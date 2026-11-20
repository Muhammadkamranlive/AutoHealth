import { cn } from "../lib/utils";
import type { TextareaHTMLAttributes } from "react";
import {
  formControlClass,
  formControlErrorClass,
  formErrorClass,
  formHintClass,
  formLabelClass,
} from "../lib/form-styles";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  labelClassName?: string;
}

export function Textarea({
  label,
  error,
  hint,
  className,
  labelClassName,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className={cn(formLabelClass, labelClassName)}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(formControlClass, "min-h-[88px] resize-y", error && formControlErrorClass, className)}
        {...props}
      />
      {hint && !error && <p className={formHintClass}>{hint}</p>}
      {error && <p className={formErrorClass}>{error}</p>}
    </div>
  );
}
