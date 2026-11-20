import type { FormFieldDefinition, FormResponses, FormSchema } from "./types";

function isFilled(field: FormFieldDefinition, value: unknown): boolean {
  if (field.type === "section") return true;

  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return field.type === "checkbox" ? value : false;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

/** Required fillable fields only (excludes sections). */
export function getFillableFields(schema: FormSchema): FormFieldDefinition[] {
  return schema.fields.filter((f) => f.type !== "section");
}

export function getRequiredFields(schema: FormSchema): FormFieldDefinition[] {
  return getFillableFields(schema).filter((f) => f.required !== false);
}

export function calculateCompletionPercent(
  schema: FormSchema,
  responses: FormResponses
): number {
  const required = getRequiredFields(schema);
  if (required.length === 0) {
    const all = getFillableFields(schema);
    if (all.length === 0) return 100;
    const filled = all.filter((f) => isFilled(f, responses[f.id])).length;
    return Math.round((filled / all.length) * 100);
  }

  const filled = required.filter((f) => isFilled(f, responses[f.id])).length;
  return Math.round((filled / required.length) * 100);
}

export function isFormComplete(schema: FormSchema, responses: FormResponses): boolean {
  return calculateCompletionPercent(schema, responses) === 100;
}

export function aggregateProfileCompletion(tasks: { completionPercent: number }[]): number {
  if (tasks.length === 0) return 0;
  const sum = tasks.reduce((s, t) => s + t.completionPercent, 0);
  return Math.round(sum / tasks.length);
}
