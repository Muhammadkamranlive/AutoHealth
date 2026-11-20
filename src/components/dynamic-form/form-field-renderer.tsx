import Image from "next/image";
import { useEffect, useState } from "react";
import type { FormFieldDefinition, FormResponses } from "@/lib/forms/types";
import { cn } from "@/components/ui/lib/utils";
import { Input, Select, Textarea } from "@/components/ui";
import { formHintClass } from "@/components/ui/lib/form-styles";
import { createClient } from "@/lib/supabase/client";

type Props = {
  field: FormFieldDefinition;
  value: unknown;
  error?: string;
  readOnly?: boolean;
  onChange: (id: string, value: string | boolean) => void;
  onBlur?: (id: string) => void;
};

export function DynamicFormField({ field, value, error, readOnly, onChange, onBlur }: Props) {
  if (field.type === "section") {
    return (
      <div className="col-span-full pt-2">
        <div className="flex items-center gap-3 border-b border-medical-100 pb-3 dark:border-slate-700">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-medical-600/10 text-sm font-bold text-medical-700 dark:bg-medical-500/20 dark:text-medical-300">
            §
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-medical-950 dark:text-white">
              {field.label}
            </h2>
            {field.helpText && <p className="text-sm text-slate-500 dark:text-slate-400">{field.helpText}</p>}
          </div>
        </div>
      </div>
    );
  }

  const wrap = field.width === "half" ? "col-span-full sm:col-span-1" : "col-span-full sm:col-span-2";

  if (field.type === "image") {
    return (
      <div className={wrap}>
        <ImageUploadField
          field={field}
          value={typeof value === "string" ? value : ""}
          error={error}
          readOnly={readOnly}
          onChange={(v) => onChange(field.id, v)}
          onBlur={() => onBlur?.(field.id)}
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className={wrap}>
        <Textarea
          label={field.label}
          placeholder={field.placeholder}
          hint={field.helpText}
          error={error}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
          onBlur={() => onBlur?.(field.id)}
          required={field.required !== false}
          disabled={readOnly}
          rows={4}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className={wrap}>
        <Select
          label={field.label}
          hint={field.helpText}
          error={error}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
          onBlur={() => onBlur?.(field.id)}
          required={field.required !== false}
          disabled={readOnly}
        >
          <option value="">Select an option…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <div className={cn(wrap, "space-y-3")}>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {field.label}
          {field.required !== false && <span className="text-red-500"> *</span>}
        </p>
        <div className="space-y-2">
          {(field.options ?? []).map((o) => (
            <label
              key={o}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition",
                value === o
                  ? "border-medical-500 bg-medical-50 ring-1 ring-medical-500/20 dark:border-medical-500 dark:bg-medical-950/40"
                  : "border-medical-100 hover:border-medical-200 dark:border-slate-700 dark:hover:border-slate-600",
                error && "border-red-400"
              )}
            >
              <input
                type="radio"
                name={field.id}
                checked={value === o}
                disabled={readOnly}
                onChange={() => onChange(field.id, o)}
                onBlur={() => onBlur?.(field.id)}
                className="h-4 w-4 text-medical-600"
              />
              <span className="text-slate-700 dark:text-slate-200">{o}</span>
            </label>
          ))}
        </div>
        {field.helpText && !error && <p className={formHintClass}>{field.helpText}</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className={wrap}>
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 text-sm transition",
            Boolean(value)
              ? "border-medical-500 bg-medical-50/80 dark:border-medical-500 dark:bg-medical-950/30"
              : "border-medical-100 dark:border-slate-700",
            error && "border-red-400"
          )}
        >
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-medical-300 text-medical-600"
            checked={Boolean(value)}
            disabled={readOnly}
            onChange={(e) => onChange(field.id, e.target.checked)}
            onBlur={() => onBlur?.(field.id)}
          />
          <span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{field.label}</span>
            {field.helpText && (
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{field.helpText}</span>
            )}
          </span>
        </label>
        {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  const inputType =
    field.type === "email" ? "email"
    : field.type === "phone" ? "tel"
    : field.type === "number" ? "number"
    : field.type === "date" ? "date"
    : "text";

  return (
    <div className={wrap}>
      <Input
        label={field.label}
        type={inputType}
        placeholder={field.placeholder}
        hint={field.helpText}
        error={error}
        value={String(value ?? "")}
        onChange={(e) => onChange(field.id, e.target.value)}
        onBlur={() => onBlur?.(field.id)}
        required={field.required !== false}
        disabled={readOnly}
      />
    </div>
  );
}

function ImageUploadField({
  field,
  value,
  error,
  readOnly,
  onChange,
  onBlur,
}: {
  field: FormFieldDefinition;
  value: string;
  error?: string;
  readOnly?: boolean;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreviewUrl("");
      return;
    }
    if (value.startsWith("http")) {
      setPreviewUrl(value);
      return;
    }
    const supabase = createClient();
    supabase.storage
      .from("profile-forms")
      .createSignedUrl(value, 3600)
      .then(({ data }) => setPreviewUrl(data?.signedUrl ?? ""));
  }, [value]);

  async function uploadFile(file: File) {
    if (readOnly) return;
    setUploading(true);
    setUploadError("");
    try {
      if (!file.type.startsWith("image/")) throw new Error("Please upload an image file");
      if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${field.id}-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("profile-forms").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (uploadErr) throw uploadErr;

      onChange(path);
      onBlur?.();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {field.label}
        {field.required !== false && <span className="text-red-500"> *</span>}
      </p>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) uploadFile(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 transition",
          dragOver
            ? "border-medical-500 bg-medical-50 dark:bg-medical-950/30"
            : error
              ? "border-red-300 bg-red-50/30 dark:border-red-800"
              : "border-medical-200 bg-gradient-to-b from-medical-50/80 to-white hover:border-medical-400 dark:border-slate-600 dark:from-slate-800/50 dark:to-slate-900",
          readOnly && "pointer-events-none opacity-60"
        )}
      >
        {previewUrl ? (
          <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-4 border-white shadow-xl ring-1 ring-medical-100 dark:ring-slate-700">
            <Image src={previewUrl} alt="Upload preview" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-medical-600 text-2xl text-white shadow-lg">
              📷
            </div>
            <p className="mt-4 text-sm font-semibold text-medical-800 dark:text-medical-200">
              {uploading ? "Uploading…" : "Drop image here or click to browse"}
            </p>
            <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP · Max 5MB</p>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading || readOnly}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />
      </label>
      {field.helpText && !error && !uploadError && <p className={formHintClass}>{field.helpText}</p>}
      {(error || uploadError) && (
        <p className="text-sm text-red-600 dark:text-red-400">{error ?? uploadError}</p>
      )}
    </div>
  );
}

/** Group fields into sections for stepped layout. */
export function groupFieldsBySection(fields: FormFieldDefinition[]): FormFieldDefinition[][] {
  const groups: FormFieldDefinition[][] = [];
  let current: FormFieldDefinition[] = [];

  for (const field of fields) {
    if (field.type === "section" && current.length > 0) {
      groups.push(current);
      current = [field];
    } else {
      current.push(field);
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

export type { FormResponses };
