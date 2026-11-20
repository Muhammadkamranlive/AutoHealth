"use client";

import { useState, useCallback } from "react";
import {
  createField,
  type FormFieldDefinition,
  type FormFieldType,
  type FormSchema,
} from "@/lib/forms/types";
import type { ValidationPattern } from "@/lib/forms/validation";
import { cn } from "@/components/ui/lib/utils";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { DynamicFormPreview } from "@/components/dynamic-form/dynamic-form-preview";

const PALETTE_GROUPS: { label: string; items: { type: FormFieldType; label: string; icon: string }[] }[] = [
  {
    label: "Layout",
    items: [{ type: "section", label: "Section", icon: "§" }],
  },
  {
    label: "Basic",
    items: [
      { type: "text", label: "Text", icon: "Aa" },
      { type: "textarea", label: "Long text", icon: "¶" },
      { type: "number", label: "Number", icon: "#" },
      { type: "date", label: "Date", icon: "📅" },
    ],
  },
  {
    label: "Contact",
    items: [
      { type: "email", label: "Email", icon: "@" },
      { type: "phone", label: "Phone", icon: "☎" },
    ],
  },
  {
    label: "Choice",
    items: [
      { type: "select", label: "Dropdown", icon: "▾" },
      { type: "radio", label: "Radio", icon: "◉" },
      { type: "checkbox", label: "Checkbox", icon: "☑" },
    ],
  },
  {
    label: "Media",
    items: [{ type: "image", label: "Photo upload", icon: "🖼" }],
  },
];

const PATTERN_OPTIONS: { value: ValidationPattern | ""; label: string }[] = [
  { value: "", label: "None" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone (US)" },
  { value: "npi", label: "NPI (10 digits)" },
  { value: "dea", label: "DEA number" },
  { value: "zip", label: "ZIP code" },
  { value: "url", label: "URL" },
];

type Props = {
  initialSchema: FormSchema;
  onChange: (schema: FormSchema) => void;
};

export function FormBuilder({ initialSchema, onChange }: Props) {
  const [fields, setFields] = useState<FormFieldDefinition[]>(initialSchema.fields);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);

  const selected = fields.find((f) => f.id === selectedId) ?? null;

  const emit = useCallback(
    (next: FormFieldDefinition[]) => {
      setFields(next);
      onChange({ fields: next });
    },
    [onChange]
  );

  function addField(type: FormFieldType, atIndex?: number) {
    const field = createField(type);
    const next = [...fields];
    if (atIndex !== undefined) next.splice(atIndex, 0, field);
    else next.push(field);
    emit(next);
    setSelectedId(field.id);
  }

  function updateField(id: string, patch: Partial<FormFieldDefinition>) {
    emit(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    emit(fields.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function moveField(from: number, to: number) {
    if (from === to) return;
    const next = [...fields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    emit(next);
  }

  function handleCanvasDrop(e: React.DragEvent, index?: number) {
    e.preventDefault();
    const type = e.dataTransfer.getData("field-type") as FormFieldType;
    const fromIndex = e.dataTransfer.getData("field-index");
    if (fromIndex !== "") {
      moveField(Number(fromIndex), index ?? fields.length);
    } else if (type) {
      addField(type, index);
    }
    setDragIndex(null);
  }

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-medical-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="font-semibold text-medical-900 dark:text-white">Live preview</h3>
            <p className="text-xs text-slate-500">Responsive layout · same UI users will see</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setPreview(false)}>
            ← Back to builder
          </Button>
        </div>
        <DynamicFormPreview schema={{ fields }} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-medical-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50">
      <div className="grid min-h-[520px] lg:grid-cols-[220px_1fr_280px]">
        {/* Palette */}
        <div className="border-b border-medical-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:border-b-0 lg:border-r">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Components</p>
          <div className="space-y-5">
            {PALETTE_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold text-slate-500">{group.label}</p>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("field-type", item.type);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-transparent bg-medical-50/80 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:border-medical-200 hover:bg-white hover:shadow-sm active:cursor-grabbing dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                      onClick={() => addField(item.type)}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-medical-600 to-teal-600 text-[11px] font-bold text-white shadow-sm">
                        {item.icon}
                      </span>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex flex-col border-b border-medical-100 p-4 dark:border-slate-800 lg:border-b-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-medical-900 dark:text-white">Form canvas</p>
              <p className="text-xs text-slate-500">{fields.length} field{fields.length !== 1 ? "s" : ""}</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setPreview(true)}>
              Preview
            </Button>
          </div>

          <div
            className="min-h-[400px] flex-1 rounded-2xl border-2 border-dashed border-medical-200/80 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-900/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleCanvasDrop(e)}
          >
            {fields.length === 0 ? (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-xl text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-medical-100 text-2xl dark:bg-slate-800">
                  ↓
                </div>
                <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                  Tap a component or drag it here
                </p>
                <p className="mt-1 text-xs text-slate-400">Or pick a market template above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("field-index", String(index));
                      e.dataTransfer.effectAllowed = "move";
                      setDragIndex(index);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleCanvasDrop(e, index);
                    }}
                    onClick={() => setSelectedId(field.id)}
                    className={cn(
                      "group cursor-grab rounded-xl border bg-white p-3.5 shadow-sm transition active:cursor-grabbing dark:bg-slate-800",
                      selectedId === field.id
                        ? "border-medical-500 ring-2 ring-medical-500/20"
                        : "border-medical-100 hover:border-medical-300 dark:border-slate-700",
                      dragIndex === index && "opacity-40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="cursor-grab text-slate-300 group-hover:text-slate-400">⋮⋮</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-medical-500">
                          {field.type}
                          {field.validation?.pattern && ` · ${field.validation.pattern}`}
                        </span>
                        <p className="truncate font-medium text-slate-800 dark:text-white">
                          {field.label}
                          {field.required !== false && field.type !== "section" && (
                            <span className="text-red-500"> *</span>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-red-950/30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Properties */}
        <div className="bg-white p-4 dark:bg-slate-900 lg:border-l lg:border-medical-100 dark:lg:border-slate-800">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Properties</p>
          {!selected ? (
            <div className="rounded-xl border border-dashed border-medical-200 p-6 text-center dark:border-slate-700">
              <p className="text-sm text-slate-500">Select a field to edit label, validation, and layout</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Label"
                value={selected.label}
                onChange={(e) => updateField(selected.id, { label: e.target.value })}
              />
              {selected.type !== "section" && (
                <>
                  <Input
                    label="Placeholder"
                    value={selected.placeholder ?? ""}
                    onChange={(e) => updateField(selected.id, { placeholder: e.target.value })}
                  />
                  <Textarea
                    label="Help text"
                    value={selected.helpText ?? ""}
                    onChange={(e) => updateField(selected.id, { helpText: e.target.value })}
                    rows={2}
                  />
                  <Select
                    label="Width"
                    value={selected.width ?? "full"}
                    onChange={(e) =>
                      updateField(selected.id, { width: e.target.value as "full" | "half" })
                    }
                  >
                    <option value="full">Full width</option>
                    <option value="half">Half width (2-column)</option>
                  </Select>
                  <label className="flex items-center gap-2 rounded-xl border border-medical-100 px-3 py-2.5 text-sm dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={selected.required !== false}
                      onChange={(e) => updateField(selected.id, { required: e.target.checked })}
                    />
                    Required field
                  </label>

                  {(selected.type === "text" || selected.type === "email" || selected.type === "phone" || selected.type === "number" || selected.type === "textarea") && (
                    <div className="rounded-xl border border-medical-100 p-3 dark:border-slate-700">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-medical-600">Validation</p>
                      <div className="space-y-3">
                        <Select
                          label="Format rule"
                          value={selected.validation?.pattern ?? ""}
                          onChange={(e) => {
                            const pattern = e.target.value as ValidationPattern | "";
                            updateField(selected.id, {
                              validation: {
                                ...selected.validation,
                                pattern: pattern || undefined,
                              },
                            });
                          }}
                        >
                          {PATTERN_OPTIONS.map((o) => (
                            <option key={o.value || "none"} value={o.value}>{o.label}</option>
                          ))}
                        </Select>
                        {(selected.type === "text" || selected.type === "textarea") && (
                          <>
                            <Input
                              label="Min length"
                              type="number"
                              min={0}
                              value={selected.validation?.minLength ?? ""}
                              onChange={(e) =>
                                updateField(selected.id, {
                                  validation: {
                                    ...selected.validation,
                                    minLength: e.target.value ? Number(e.target.value) : undefined,
                                  },
                                })
                              }
                            />
                            <Input
                              label="Max length"
                              type="number"
                              min={1}
                              value={selected.validation?.maxLength ?? ""}
                              onChange={(e) =>
                                updateField(selected.id, {
                                  validation: {
                                    ...selected.validation,
                                    maxLength: e.target.value ? Number(e.target.value) : undefined,
                                  },
                                })
                              }
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              {(selected.type === "select" || selected.type === "radio") && (
                <Textarea
                  label="Options (one per line)"
                  value={(selected.options ?? []).join("\n")}
                  onChange={(e) =>
                    updateField(selected.id, {
                      options: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  rows={4}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
