import { describe, it, expect } from "vitest";
import { validateField, validateFormResponses } from "./validation";
import type { FormFieldDefinition, FormSchema } from "./types";

describe("validateField", () => {
  it("requires text fields when marked required", () => {
    const field: FormFieldDefinition = { id: "n", type: "text", label: "Name", required: true };
    expect(validateField(field, "")).toMatch(/required/i);
    expect(validateField(field, "Jane")).toBeNull();
  });

  it("validates NPI pattern", () => {
    const field: FormFieldDefinition = {
      id: "npi",
      type: "text",
      label: "NPI",
      validation: { pattern: "npi" },
    };
    expect(validateField(field, "123")).toMatch(/10 digits/i);
    expect(validateField(field, "1234567890")).toBeNull();
  });

  it("validates email", () => {
    const field: FormFieldDefinition = { id: "e", type: "email", label: "Email" };
    expect(validateField(field, "bad")).toMatch(/valid email/i);
    expect(validateField(field, "a@b.co")).toBeNull();
  });

  it("requires checkbox acceptance", () => {
    const field: FormFieldDefinition = { id: "c", type: "checkbox", label: "I agree", required: true };
    expect(validateField(field, false)).toMatch(/accept/i);
    expect(validateField(field, true)).toBeNull();
  });
});

describe("validateFormResponses", () => {
  it("returns errors for all invalid required fields", () => {
    const schema: FormSchema = {
      fields: [
        { id: "a", type: "text", label: "A", required: true },
        { id: "b", type: "email", label: "B", required: true },
      ],
    };
    const errors = validateFormResponses(schema, { a: "", b: "x" });
    expect(Object.keys(errors)).toHaveLength(2);
  });
});
