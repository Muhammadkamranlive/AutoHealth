"use server";

import { revalidatePath } from "next/cache";
import type { BillingInterval } from "@/lib/db";
import { requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export async function upsertBillingPlan(formData: FormData) {
  const supabase = await createClient();
  await requirePermission(supabase, "billing:create");

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const amountDollars = Number.parseFloat(String(formData.get("amount") ?? "0"));
  const interval = String(formData.get("interval") ?? "month") as BillingInterval;
  const featuresRaw = String(formData.get("features") ?? "");
  const isActive = formData.get("is_active") === "on" || formData.get("is_active") === "true";
  const sortOrder = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10);

  if (!name) throw new Error("Plan name is required");
  if (!Number.isFinite(amountDollars) || amountDollars <= 0) throw new Error("Valid price is required");

  const features = featuresRaw
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  const row = {
    name,
    description,
    amount_cents: Math.round(amountDollars * 100),
    currency: "usd",
    interval,
    features,
    is_active: isActive,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  };

  if (id) {
    const { error } = await supabase.from("billing_plans").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("billing_plans").insert(row);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/billing-plans");
}

export async function deleteBillingPlan(planId: string) {
  const supabase = await createClient();
  await requirePermission(supabase, "billing:delete");

  const { error } = await supabase.from("billing_plans").delete().eq("id", planId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/billing-plans");
}

export async function assignTreatmentPlan(
  patientId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const user = await requirePermission(supabase, "patients:update");

  const medication = String(formData.get("medication") ?? "").trim();
  const billingPlanId = String(formData.get("billing_plan_id") ?? "").trim();
  const protocol = String(formData.get("protocol") ?? "").trim() || null;

  if (!medication) throw new Error("Medication / program name is required");
  if (!billingPlanId) throw new Error("Select a billing plan for this treatment");

  const { error } = await supabase.from("treatment_plans").insert({
    patient_id: patientId,
    physician_id: user.id,
    medication,
    protocol,
    status: "active",
    billing_plan_id: billingPlanId,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/patients/${patientId}`);
  revalidatePath("/admin/patients");
}

export async function linkBillingPlanToTreatment(
  treatmentPlanId: string,
  billingPlanId: string,
  patientId: string
) {
  const supabase = await createClient();
  await requirePermission(supabase, "patients:update");

  const { error } = await supabase
    .from("treatment_plans")
    .update({ billing_plan_id: billingPlanId })
    .eq("id", treatmentPlanId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/patients/${patientId}`);
}
