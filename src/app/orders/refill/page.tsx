import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { PatientShell } from "@/components/patient-shell";
import { PatientPageHeader } from "@/components/patient/page-header";
import { checkRefillEligibility } from "@/lib/patient/refill-eligibility";
import { getSessionUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { RefillForm } from "./refill-form";

export default async function RefillPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).single();
  if (!patient) redirect("/dashboard");

  const [{ data: activePlan }, { data: orders }] = await Promise.all([
    supabase
      .from("treatment_plans")
      .select("id, medication, start_date")
      .eq("patient_id", patient.id)
      .eq("status", "active")
      .single(),
    supabase
      .from("orders")
      .select("status, is_refill, created_at, reviewed_at")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false }),
  ]);

  const eligibility = checkRefillEligibility(activePlan, orders ?? []);

  return (
    <PatientShell user={user}>
      <div className="mx-auto max-w-lg space-y-6">
        <PatientPageHeader title="Request Refill" description="Submit a refill request for your active treatment" />
        {activePlan ? (
          <Card title={activePlan.medication}>
            <RefillForm
              treatmentPlanId={activePlan.id}
              eligible={eligibility.eligible}
              ineligibleReason={eligibility.eligible ? undefined : eligibility.reason}
            />
          </Card>
        ) : (
          <Card>
            <p className="text-slate-600 dark:text-slate-400">
              You need an active treatment plan to request a refill.
            </p>
          </Card>
        )}
      </div>
    </PatientShell>
  );
}
