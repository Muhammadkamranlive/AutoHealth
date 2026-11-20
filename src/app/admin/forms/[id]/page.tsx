import { notFound, redirect } from "next/navigation";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { FormEditorClient } from "./form-editor-client";

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "users:update");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const [{ data: form }, { data: assignments }, { data: staffUsers }] = await Promise.all([
    supabase.from("profile_form_templates").select("*").eq("id", id).single(),
    supabase.from("profile_form_assignments").select("*").eq("form_id", id),
    supabase.from("profiles").select("id, email, first_name, last_name, role").order("email"),
  ]);

  if (!form) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">{form.title}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Edit form layout and manage assignments</p>
      </div>
      <FormEditorClient formId={id} initial={form} assignments={assignments ?? []} staffUsers={staffUsers ?? []} />
    </div>
  );
}
