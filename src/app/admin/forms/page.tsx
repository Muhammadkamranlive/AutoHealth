import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui";

export default async function FormsListPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "users:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const { data: forms } = await supabase
    .from("profile_form_templates")
    .select("id, title, slug, description, target_roles, is_active, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">Form Builder</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Industry templates or custom drag-and-drop forms with validation — assign to roles or users
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/forms/new"
            className="inline-flex min-h-11 items-center rounded-xl bg-medical-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-medical-700"
          >
            + Create form
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(forms ?? []).map((form) => (
          <Link
            key={form.id}
            href={`/admin/forms/${form.id}`}
            className="rounded-2xl border border-medical-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-medical-900 dark:text-white">{form.title}</h3>
              <Badge variant={form.is_active ? "success" : "warning"}>
                {form.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {form.description && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{form.description}</p>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Roles: {(form.target_roles as string[])?.join(", ") || "None"}
            </p>
          </Link>
        ))}
      </div>

      {!forms?.length && (
        <p className="rounded-2xl border border-dashed border-medical-200 p-12 text-center text-slate-500">
          No forms yet. Create your first physician or staff profile form.
        </p>
      )}
    </div>
  );
}
