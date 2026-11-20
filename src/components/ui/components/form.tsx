import { cn } from "../lib/utils";
import type { HTMLAttributes } from "react";
import { formCardClass, formCardTitleClass } from "../lib/form-styles";

interface FormCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function FormCard({ title, description, className, children, ...props }: FormCardProps) {
  return (
    <div className={cn(formCardClass, className)} {...props}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className={formCardTitleClass}>{title}</h2>}
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function FormActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-3 pt-1", className)}
      {...props}
    />
  );
}

export function FormGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)} {...props} />
  );
}
