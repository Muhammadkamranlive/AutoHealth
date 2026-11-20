import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { getAssignedFormsForUser } from "@/lib/forms/resolve";
import { parseFormSchema, type FormResponses } from "@/lib/forms/types";
import { createClient } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner-shell";
import { DynamicFormRenderer } from "@/components/dynamic-form/dynamic-form-renderer";

export default async function PartnerTaskFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const tasks = await getAssignedFormsForUser(supabase, user.id, user.role);
  const task = tasks.find((t) => t.template.id === formId);
  if (!task) notFound();

  return (
    <PartnerShell user={user}>
      <DynamicFormRenderer
        formId={formId}
        title={task.template.title}
        description={task.template.description}
        schema={parseFormSchema(task.template.schema)}
        initialResponses={(task.submission?.responses ?? {}) as FormResponses}
        initialCompletion={task.completionPercent}
      />
    </PartnerShell>
  );
}
