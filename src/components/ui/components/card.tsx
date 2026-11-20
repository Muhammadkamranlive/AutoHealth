import { cn } from "../lib/utils";
import type { HTMLAttributes } from "react";
import { formCardClass, formCardTitleClass } from "../lib/form-styles";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function Card({ title, description, className, children, ...props }: CardProps) {
  return (
    <div className={cn(formCardClass, className)} {...props}>
      {(title || description) && (
        <div className="mb-4 border-b border-medical-100 pb-4 dark:border-slate-800">
          {title && <h3 className={formCardTitleClass}>{title}</h3>}
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
