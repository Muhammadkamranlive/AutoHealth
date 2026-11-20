"use client";

import type { FormSchema } from "@/lib/forms/types";
import { DynamicFormField } from "./form-field-renderer";

/** Read-only preview of form layout in builder. */
export function DynamicFormPreview({ schema }: { schema: FormSchema }) {
  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-medical-100 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="bg-gradient-to-r from-medical-600 to-teal-600 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-medical-100">Live preview</p>
        <p className="text-sm text-white/90">This is how users will see the form</p>
      </div>
      <div className="space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {schema.fields.map((field) => (
            <DynamicFormField
              key={field.id}
              field={field}
              value={field.type === "checkbox" ? false : ""}
              readOnly
              onChange={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
