import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { getAssignedFormsForUser } from "@/lib/forms/resolve";
import { parseFormSchema, type FormResponses } from "@/lib/forms/types";
import { createClient } from "@/lib/supabase/server";
import { DynamicFormRenderer } from "@/components/dynamic-form/dynamic-form-renderer";

export default async function AdminTaskFormPage({
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

  const schema = parseFormSchema(task.template.schema);
  const responses = (task.submission?.responses ?? {}) as FormResponses;

  return (
    <DynamicFormRenderer
      formId={formId}
      title={task.template.title}
      description={task.template.description}
      schema={schema}
      initialResponses={responses}
      initialCompletion={task.completionPercent}
    />
  );
}
