"use client";

import { useState, useTransition, useCallback } from "react";
import type { FormResponses, FormSchema } from "@/lib/forms/types";
import { validateField, validateFormResponses, type FieldErrors } from "@/lib/forms/validation";
import { saveFormSubmission } from "@/app/admin/forms/actions";
import { cn } from "@/components/ui/lib/utils";
import { Button, FormActions, LoadingOverlay } from "@/components/ui";
import { DynamicFormField, groupFieldsBySection } from "./form-field-renderer";

type Props = {
  formId: string;
  title: string;
  description: string | null;
  schema: FormSchema;
  initialResponses?: FormResponses;
  initialCompletion?: number;
  readOnly?: boolean;
};

export function DynamicFormRenderer({
  formId,
  title,
  description,
  schema,
  initialResponses = {},
  initialCompletion = 0,
  readOnly = false,
}: Props) {
  const [responses, setResponses] = useState<FormResponses>(initialResponses);
  const [completion, setCompletion] = useState(initialCompletion);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const sections = groupFieldsBySection(schema.fields);

  const setValue = useCallback((id: string, value: string | boolean) => {
    setResponses((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleBlur = useCallback(
    (id: string) => {
      setTouched((prev) => new Set(prev).add(id));
      const field = schema.fields.find((f) => f.id === id);
      if (!field) return;
      const error = validateField(field, responses[id], { required: field.required !== false });
      setErrors((prev) => {
        const next = { ...prev };
        if (error) next[id] = error;
        else delete next[id];
        return next;
      });
    },
    [schema.fields, responses]
  );

  function handleSave(submit: boolean) {
    setMessage("");
    if (submit) {
      const validationErrors = validateFormResponses(schema, responses);
      setErrors(validationErrors);
      setTouched(new Set(schema.fields.filter((f) => f.type !== "section").map((f) => f.id)));
      if (Object.keys(validationErrors).length > 0) {
        setMessage("Please fix the highlighted fields before submitting.");
        return;
      }
    }

    startTransition(async () => {
      try {
        const result = await saveFormSubmission(formId, responses, submit);
        setCompletion(result.completionPercent);
        if (result.submitted) {
          setSubmitted(true);
          setMessage("");
        } else {
          setMessage(`Draft saved — ${result.completionPercent}% complete`);
        }
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl dark:bg-emerald-950">
          ✓
        </div>
        <h2 className="mt-6 text-2xl font-bold text-medical-950 dark:text-white">Profile submitted</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Your {title} has been saved. You can update it anytime from Profile Tasks.
        </p>
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay active={pending} message="saving" />
      <div className="mx-auto max-w-3xl space-y-8 pb-8">
        {/* Hero header */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-medical-700 via-medical-600 to-teal-600 p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-medical-100/90">Profile task</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-xl text-sm text-medical-100/90">{description}</p>}
          <div className="mt-6">
            <ProfileProgressBar percent={completion} variant="light" />
          </div>
        </div>

        {message && (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              message.includes("fix")
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            )}
          >
            {message}
          </div>
        )}

        {/* Section cards */}
        <div className="space-y-6">
          {sections.map((sectionFields, idx) => (
            <div
              key={sectionFields[0]?.id ?? idx}
              className="rounded-2xl border border-medical-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {sectionFields.map((field) => (
                  <DynamicFormField
                    key={field.id}
                    field={field}
                    value={responses[field.id]}
                    error={touched.has(field.id) ? errors[field.id] : undefined}
                    readOnly={readOnly}
                    onChange={setValue}
                    onBlur={handleBlur}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {!readOnly && (
          <FormActions className="sticky bottom-0 z-10 -mx-4 border-t border-medical-100 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <Button type="button" variant="secondary" onClick={() => handleSave(false)} disabled={pending}>
              Save draft
            </Button>
            <Button type="button" onClick={() => handleSave(true)} disabled={pending}>
              Submit profile
            </Button>
          </FormActions>
        )}
      </div>
    </>
  );
}

export function ProfileProgressBar({
  percent,
  variant = "default",
}: {
  percent: number;
  variant?: "default" | "light";
}) {
  const light = variant === "light";
  return (
    <div className={cn(!light && "rounded-2xl border border-medical-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900")}>
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-medium", light ? "text-medical-100" : "text-medical-900 dark:text-white")}>
          Profile completion
        </span>
        <span className={cn("font-bold tabular-nums", light ? "text-white" : "text-medical-600 dark:text-medical-400")}>
          {percent}%
        </span>
      </div>
      <div
        className={cn(
          "mt-2 h-2.5 overflow-hidden rounded-full",
          light ? "bg-white/25" : "bg-medical-100 dark:bg-slate-700"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            light ? "bg-white" : "bg-gradient-to-r from-medical-500 to-teal-500"
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}
