"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/server";
import { checkRefillEligibility } from "@/lib/patient/refill-eligibility";
import { createClient } from "@/lib/supabase/server";

export async function requestRefill(treatmentPlanId: string) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user || user.role !== "patient") throw new Error("Unauthorized");

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!patient) throw new Error("Patient record not found");

  const [{ data: activePlan }, { data: orders }] = await Promise.all([
    supabase
      .from("treatment_plans")
      .select("id, start_date")
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

  if (!eligibility.eligible) throw new Error(eligibility.reason);
  if (!activePlan || activePlan.id !== treatmentPlanId) {
    throw new Error("Invalid treatment plan");
  }

  const { error } = await supabase.from("orders").insert({
    patient_id: patient.id,
    treatment_plan_id: treatmentPlanId,
    status: "pending_review",
    is_refill: true,
    denial_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    stripe_invoice_id: null,
    tracking_number: null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/orders");
  revalidatePath("/orders/refill");
  revalidatePath("/dashboard");
}
