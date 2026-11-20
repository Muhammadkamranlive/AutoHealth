"use client";

import { cn } from "@/components/ui/lib/utils";
import { getRoleDisplayName } from "@/lib/auth";
import {
  getCategoryLabel,
  MARKET_FORM_TEMPLATES,
  type FormTemplateCategory,
  type MarketFormTemplate,
} from "@/lib/forms/templates";
import type { FormSchema } from "@/lib/forms/types";

const ACCENT_STYLES: Record<MarketFormTemplate["accent"], string> = {
  teal: "from-teal-500 to-teal-600",
  blue: "from-blue-500 to-indigo-600",
  violet: "from-violet-500 to-purple-600",
  amber: "from-amber-500 to-orange-600",
  rose: "from-rose-500 to-pink-600",
  emerald: "from-emerald-500 to-teal-600",
};

const CATEGORIES: FormTemplateCategory[] = [
  "provider",
  "clinical",
  "patient",
  "partner",
  "compliance",
];

type Props = {
  selectedId: string | null;
  onSelect: (template: MarketFormTemplate) => void;
  onBlank: () => void;
};

export function FormTemplateGallery({ selectedId, onSelect, onBlank }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-medical-950 dark:text-white">Start from a template</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Industry-standard healthcare forms — customize fields after selecting
          </p>
        </div>
        <button
          type="button"
          onClick={onBlank}
          className={cn(
            "rounded-xl border px-4 py-2.5 text-sm font-medium transition",
            selectedId === "blank"
              ? "border-medical-600 bg-medical-50 text-medical-800 dark:bg-medical-950 dark:text-medical-200"
              : "border-medical-200 text-slate-600 hover:border-medical-300 dark:border-slate-600 dark:text-slate-300"
          )}
        >
          Blank form
        </button>
      </div>

      {CATEGORIES.map((category) => {
        const templates = MARKET_FORM_TEMPLATES.filter((t) => t.category === category);
        if (templates.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              {getCategoryLabel(category)}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedId === template.id}
                  onSelect={() => onSelect(template)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: MarketFormTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  const gradient = ACCENT_STYLES[template.accent];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition",
        selected
          ? "border-medical-500 ring-2 ring-medical-500/25 shadow-lg"
          : "border-medical-100 bg-white hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
      )}
    >
      <div className={cn("h-2 bg-gradient-to-r", gradient)} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-medical-950 dark:text-white">{template.title}</h4>
          {selected && (
            <span className="shrink-0 rounded-full bg-medical-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              Selected
            </span>
          )}
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">
          {template.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {template.basedOn}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{template.fieldCount} fields</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">~{template.estimatedMinutes} min</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {template.targetRoles.map((role) => (
            <span
              key={role}
              className="rounded-md bg-medical-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-medical-700 dark:bg-medical-950/50 dark:text-medical-300"
            >
              {getRoleDisplayName(role)}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

/** Clone schema with fresh field IDs so each form instance is independent. */
export function cloneTemplateSchema(schema: FormSchema): FormSchema {
  return {
    fields: schema.fields.map((f) => ({
      ...f,
      id: crypto.randomUUID(),
      options: f.options ? [...f.options] : undefined,
      validation: f.validation ? { ...f.validation } : undefined,
    })),
  };
}
