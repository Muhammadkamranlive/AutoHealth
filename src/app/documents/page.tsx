import { redirect } from "next/navigation";
import { Card, EmptyState } from "@/components/ui";
import { DocumentListItem } from "@/components/documents/document-list-item";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { PatientShell } from "@/components/patient-shell";
import { PatientPageHeader } from "@/components/patient/page-header";
import { getSessionUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).single();
  if (!patient) redirect("/dashboard");

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false });

  return (
    <PatientShell user={user}>
      <div className="space-y-6">
        <PatientPageHeader title="Documents" description="Lab results and files for your care team" />

        <Card title="Upload document">
          <DocumentUploadForm />
        </Card>

        {!documents?.length ? (
          <EmptyState title="No documents" description="Upload lab results or other files here." />
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {documents.map((doc) => (
              <DocumentListItem
                key={doc.id}
                id={doc.id}
                fileName={doc.file_name}
                type={doc.type}
                createdAt={doc.created_at}
              />
            ))}
          </ul>
        )}
      </div>
    </PatientShell>
  );
}
