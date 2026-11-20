"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ALL_ROLES, getRoleDisplayName } from "@/lib/auth";
import type { UserRole } from "@/lib/db";
import { createFormTemplate } from "../actions";
import { FormBuilder } from "@/components/form-builder/form-builder";
import { FormTemplateGallery, cloneTemplateSchema } from "@/components/form-builder/template-gallery";
import type { MarketFormTemplate } from "@/lib/forms/templates";
import { Button, FormActions, FormCard, Input, LoadingOverlay, Textarea } from "@/components/ui";
import type { FormSchema } from "@/lib/forms/types";

const STAFF_ROLES = ALL_ROLES.filter((r) =>
  ["physician", "care_team", "patient", "partner", "partner_staff"].includes(r)
);

export function NewFormClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<"template" | "build">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetRoles, setTargetRoles] = useState<UserRole[]>(["physician"]);
  const [schema, setSchema] = useState<FormSchema>({ fields: [] });
  const [error, setError] = useState("");

  function applyTemplate(template: MarketFormTemplate) {
    setSelectedTemplateId(template.id);
    setTitle(template.title);
    setDescription(template.description);
    setTargetRoles([...template.targetRoles]);
    setSchema(cloneTemplateSchema(template.schema));
    setStep("build");
  }

  function startBlank() {
    setSelectedTemplateId("blank");
    setTitle("");
    setDescription("");
    setTargetRoles(["physician"]);
    setSchema({ fields: [] });
    setStep("build");
  }

  function toggleRole(role: UserRole) {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function handleCreate() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (schema.fields.length === 0) {
      setError("Add at least one field to the form");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const id = await createFormTemplate({ title, description, targetRoles, schema });
        router.push(`/admin/forms/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create form");
      }
    });
  }

  if (step === "template") {
    return (
      <div className="space-y-6">
        <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider">
          <li className="rounded-full bg-medical-600 px-3 py-1.5 text-white">1. Template</li>
          <li className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-500 dark:bg-slate-800">2. Build</li>
        </ol>
        <FormTemplateGallery
          selectedId={selectedTemplateId}
          onSelect={applyTemplate}
          onBlank={startBlank}
        />
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay active={pending} message="saving" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider">
            <li className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-500 dark:bg-slate-800">1. Template</li>
            <li className="rounded-full bg-medical-600 px-3 py-1.5 text-white">2. Build</li>
          </ol>
          <button
            type="button"
            onClick={() => setStep("template")}
            className="text-sm font-medium text-medical-600 hover:text-medical-700 dark:text-medical-400"
          >
            ← Change template
          </button>
          {selectedTemplateId && selectedTemplateId !== "blank" && (
            <span className="rounded-full bg-medical-100 px-3 py-1 text-xs font-semibold text-medical-700 dark:bg-medical-950 dark:text-medical-300">
              From template
            </span>
          )}
        </div>

        <FormCard title="Form details">
          <div className="mt-4 space-y-4">
            <Input
              label="Form title"
              placeholder="e.g. Physician Profile Form"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              hint="Shown to users as task instructions"
            />
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Target roles</p>
              <div className="flex flex-wrap gap-2">
                {STAFF_ROLES.map((role) => (
                  <label
                    key={role}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      targetRoles.includes(role)
                        ? "border-medical-500 bg-medical-50 dark:border-medical-500 dark:bg-medical-950/40"
                        : "border-medical-100 dark:border-slate-700"
                    }`}
                  >
                    <input type="checkbox" checked={targetRoles.includes(role)} onChange={() => toggleRole(role)} />
                    {getRoleDisplayName(role)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </FormCard>

        <FormBuilder initialSchema={schema} onChange={setSchema} />

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <FormActions>
          <Button type="button" onClick={handleCreate} disabled={pending} className="min-h-11">
            Create form
          </Button>
        </FormActions>
      </div>
    </>
  );
}
