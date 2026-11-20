"use server";

import { revalidatePath } from "next/cache";
import type { DocumentType } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export async function registerDocumentUpload(
  storagePath: string,
  fileName: string,
  docType: DocumentType
) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user || user.role !== "patient") throw new Error("Unauthorized");

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!patient) throw new Error("Patient record not found");

  const { error } = await supabase.from("documents").insert({
    patient_id: patient.id,
    type: docType,
    storage_path: storagePath,
    file_name: fileName,
    uploaded_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/documents");
}

export async function getDocumentDownloadUrl(documentId: string) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) throw new Error("Unauthorized");

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, patient_id")
    .eq("id", documentId)
    .single();

  if (!doc) throw new Error("Document not found");

  const { data: signed, error } = await supabase.storage
    .from("patient-documents")
    .createSignedUrl(doc.storage_path, 3600);

  if (error || !signed?.signedUrl) throw new Error(error?.message ?? "Failed to create download link");

  return signed.signedUrl;
}
