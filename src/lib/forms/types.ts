import type { UserRole } from "@/lib/db";

export type ValidationPattern =
  | "email"
  | "phone"
  | "npi"
  | "dea"
  | "zip"
  | "url";

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: ValidationPattern;
  patternMessage?: string;
}

export type FormFieldType =
  | "section"
  | "text"
  | "email"
  | "phone"
  | "number"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "image";

export interface FormFieldDefinition {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: string[];
  width?: "full" | "half";
  validation?: FieldValidation;
}

export interface FormSchema {
  fields: FormFieldDefinition[];
}

export type FormResponses = Record<string, string | boolean | string[] | null>;

export interface ProfileFormTemplate {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  target_roles: UserRole[];
  schema: FormSchema;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormAssignment {
  id: string;
  form_id: string;
  assignment_type: "role" | "user";
  role: UserRole | null;
  user_id: string | null;
  created_at: string;
}

export interface ProfileFormSubmission {
  id: string;
  form_id: string;
  user_id: string;
  responses: FormResponses;
  status: "draft" | "submitted";
  completion_percent: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AssignedFormTask = {
  template: ProfileFormTemplate;
  submission: ProfileFormSubmission | null;
  completionPercent: number;
  isComplete: boolean;
};

export const FIELD_PALETTE: { type: FormFieldType; label: string; icon: string }[] = [
  { type: "section", label: "Section heading", icon: "§" },
  { type: "text", label: "Text", icon: "T" },
  { type: "email", label: "Email", icon: "@" },
  { type: "phone", label: "Phone", icon: "☎" },
  { type: "number", label: "Number", icon: "#" },
  { type: "textarea", label: "Long text", icon: "¶" },
  { type: "select", label: "Dropdown", icon: "▾" },
  { type: "radio", label: "Radio group", icon: "◉" },
  { type: "checkbox", label: "Checkbox", icon: "☑" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "image", label: "Photo upload", icon: "🖼" },
];

export function createField(type: FormFieldType): FormFieldDefinition {
  const id = crypto.randomUUID();
  const base: FormFieldDefinition = {
    id,
    type,
    label: defaultLabel(type),
    width: type === "section" ? "full" : "full",
    required: type !== "section" && type !== "checkbox",
  };
  if (type === "select" || type === "radio") {
    base.options = ["Option 1", "Option 2"];
  }
  if (type === "image") {
    base.helpText = "Upload a professional photo (JPG, PNG, max 5MB)";
  }
  return base;
}

function defaultLabel(type: FormFieldType): string {
  const map: Record<FormFieldType, string> = {
    section: "Section title",
    text: "Text field",
    email: "Email address",
    phone: "Phone number",
    number: "Number",
    textarea: "Description",
    select: "Select option",
    radio: "Choose one",
    checkbox: "I agree",
    date: "Date",
    image: "Profile photo",
  };
  return map[type];
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function parseFormSchema(raw: unknown): FormSchema {
  if (!raw || typeof raw !== "object") return { fields: [] };
  const obj = raw as { fields?: unknown };
  if (!Array.isArray(obj.fields)) return { fields: [] };
  return { fields: obj.fields as FormFieldDefinition[] };
}
