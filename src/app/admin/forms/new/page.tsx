import { redirect } from "next/navigation";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { NewFormClient } from "./form-new-client";

export default async function NewFormPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "users:create");
  } catch {
    redirect("/admin?error=no_permission");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">Create profile form</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Pick a template, then add fields by tapping the palette — or drag them onto the canvas.
        </p>
      </div>
      <NewFormClient />
    </div>
  );
}
