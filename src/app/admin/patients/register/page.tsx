import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, requirePermission, getEffectivePermissions } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { RegisterPatientForm } from "./register-patient-form";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/auth/errors";

export default async function RegisterPatientPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const permissions = await getEffectivePermissions(supabase, user);
  const canCreate = permissions.includes("patients:create");

  try {
    await requirePermission(supabase, "patients:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const { data: physicians } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "physician")
    .order("last_name");

  const physicianOptions =
    physicians?.map((p) => ({
      id: p.id,
      name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id.slice(0, 8),
    })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/patients" className="text-sm font-medium text-medical-600 hover:text-medical-700">
          ← Back to patients
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">
          Register patient
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Create a patient portal account and clinical record in one step
        </p>
      </div>

      {!canCreate && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          You don&apos;t have permission to register patients. {PERMISSION_DENIED_MESSAGE}
        </p>
      )}

      <RegisterPatientForm physicians={physicianOptions} canCreate={canCreate} />
    </div>
  );
}
