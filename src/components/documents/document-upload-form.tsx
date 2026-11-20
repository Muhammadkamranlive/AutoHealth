"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DocumentType } from "@/lib/db";
import { Button, LoadingOverlay, Select } from "@/components/ui";
import { registerDocumentUpload } from "@/app/documents/actions";
import { validateDocumentFile } from "@/lib/documents/constants";
import { createClient } from "@/lib/supabase/client";

export function DocumentUploadForm() {
  const router = useRouter();
  const [docType, setDocType] = useState<DocumentType>("lab_result");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleUpload(file: File) {
    setError("");
    const validationError = validateDocumentFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Not signed in");

        const { data: patient } = await supabase
          .from("patients")
          .select("id")
          .eq("user_id", userData.user.id)
          .single();

        if (!patient) throw new Error("Patient record not found");

        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${userData.user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("patient-documents")
          .upload(path, file, { upsert: false, contentType: file.type });

        if (uploadError) throw uploadError;

        await registerDocumentUpload(path, file.name, docType);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <LoadingOverlay active={isPending} message="uploading" />
      <Select
        label="Document type"
        value={docType}
        onChange={(e) => setDocType(e.target.value as DocumentType)}
        disabled={isPending}
      >
        <option value="lab_result">Lab result</option>
        <option value="id">ID</option>
        <option value="other">Other</option>
      </Select>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-medical-200 bg-medical-50/50 px-6 py-10 text-center transition hover:border-medical-400 dark:border-slate-700 dark:bg-slate-800/50">
        <span className="text-sm font-medium text-medical-700 dark:text-medical-300">
          {isPending ? "Uploading…" : "Drop a file or click to browse"}
        </span>
        <span className="mt-1 text-xs text-slate-500">PDF, JPEG, PNG, WebP · max 10 MB</span>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          disabled={isPending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
