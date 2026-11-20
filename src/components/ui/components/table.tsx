import { cn } from "../lib/utils";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className={cn("min-w-full divide-y divide-slate-200", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-slate-50">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>;
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("hover:bg-slate-50", className)}>{children}</tr>;
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 text-sm text-slate-900", className)}>{children}</td>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
