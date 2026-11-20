import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { getAssignedFormsForUser } from "@/lib/forms/resolve";
import type { Order, TreatmentPlan } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { PatientShell } from "@/components/patient-shell";
import { PatientDashboard } from "@/components/patient/patient-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const [profileTasks, { data: profileRow }] = await Promise.all([
    getAssignedFormsForUser(supabase, user.id, user.role),
    supabase.from("profiles").select("profile_completion_percent").eq("id", user.id).single(),
  ]);

  const profileCompletion = profileRow?.profile_completion_percent ?? 0;

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!patient) {
    return (
      <PatientShell user={user}>
        <PatientDashboard
          user={user}
          profileTasks={profileTasks}
          profileCompletion={profileCompletion}
          activePlan={null}
          latestOrder={null}
          unreadCount={0}
          setupPending
        />
      </PatientShell>
    );
  }

  const [{ data: activePlan }, { data: latestOrder }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("treatment_plans")
      .select("*")
      .eq("patient_id", patient.id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("orders")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("*, message_threads!inner(patient_id)", { count: "exact", head: true })
      .is("read_at", null)
      .neq("sender_id", user.id),
  ]);

  return (
    <PatientShell user={user}>
      <PatientDashboard
        user={user}
        profileTasks={profileTasks}
        profileCompletion={profileCompletion}
        activePlan={(activePlan as TreatmentPlan | null) ?? null}
        latestOrder={(latestOrder as Order | null) ?? null}
        unreadCount={unreadCount ?? 0}
      />
    </PatientShell>
  );
}
