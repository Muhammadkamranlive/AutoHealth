import type { FormFieldDefinition, FormFieldType, FormResponses, FormSchema, FieldValidation, ValidationPattern } from "./types";

export type { FieldValidation, ValidationPattern };

export type FieldErrors = Record<string, string>;

const PATTERNS: Record<ValidationPattern, { regex: RegExp; message: string }> = {
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Enter a valid email address",
  },
  phone: {
    regex: /^(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/,
    message: "Enter a valid US phone number",
  },
  npi: {
    regex: /^\d{10}$/,
    message: "NPI must be exactly 10 digits",
  },
  dea: {
    regex: /^[A-Z]{2}\d{7}$/i,
    message: "DEA number format: 2 letters + 7 digits (e.g. AB1234567)",
  },
  zip: {
    regex: /^\d{5}(-\d{4})?$/,
    message: "Enter a valid ZIP code",
  },
  url: {
    regex: /^https?:\/\/.+/i,
    message: "Enter a valid URL starting with http:// or https://",
  },
};

const TYPE_DEFAULTS: Partial<Record<FormFieldType, ValidationPattern>> = {
  email: "email",
  phone: "phone",
};

function stringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function isEmpty(field: FormFieldDefinition, value: unknown): boolean {
  if (field.type === "checkbox") return value !== true;
  if (field.type === "image") return !stringValue(value);
  return stringValue(value).length === 0;
}

/** Validate a single field; returns error message or null. */
export function validateField(
  field: FormFieldDefinition,
  value: unknown,
  options?: { required?: boolean }
): string | null {
  if (field.type === "section") return null;

  const required = options?.required ?? field.required !== false;
  const empty = isEmpty(field, value);

  if (required && empty) {
    if (field.type === "checkbox") return "You must accept this to continue";
    if (field.type === "image") return "Please upload a photo";
    return `${field.label} is required`;
  }

  if (empty) return null;

  const text = stringValue(value);
  const rules = field.validation ?? {};
  const patternKey = rules.pattern ?? TYPE_DEFAULTS[field.type];

  if (field.type === "number" || rules.min !== undefined || rules.max !== undefined) {
    const num = Number(text);
    if (Number.isNaN(num)) return `${field.label} must be a number`;
    if (rules.min !== undefined && num < rules.min) {
      return `${field.label} must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && num > rules.max) {
      return `${field.label} must be at most ${rules.max}`;
    }
  }

  if (rules.minLength !== undefined && text.length < rules.minLength) {
    return `${field.label} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength !== undefined && text.length > rules.maxLength) {
    return `${field.label} must be at most ${rules.maxLength} characters`;
  }

  if (patternKey && text) {
    const preset = PATTERNS[patternKey as ValidationPattern];
    if (preset && !preset.regex.test(text)) {
      return rules.patternMessage ?? preset.message;
    }
  }

  if (field.type === "date" && text) {
    const parsed = Date.parse(text);
    if (Number.isNaN(parsed)) return "Enter a valid date";
  }

  if ((field.type === "select" || field.type === "radio") && field.options?.length) {
    if (!field.options.includes(text)) return "Select a valid option";
  }

  return null;
}

/** Validate all fillable fields (use on submit). */
export function validateFormResponses(
  schema: FormSchema,
  responses: FormResponses,
  options?: { fieldIds?: string[] }
): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of schema.fields) {
    if (field.type === "section") continue;
    if (options?.fieldIds && !options.fieldIds.includes(field.id)) continue;

    const error = validateField(field, responses[field.id], {
      required: field.required !== false,
    });
    if (error) errors[field.id] = error;
  }

  return errors;
}

export function hasValidationErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function firstValidationError(errors: FieldErrors): string | null {
  const keys = Object.keys(errors);
  return keys.length ? errors[keys[0]] : null;
}
