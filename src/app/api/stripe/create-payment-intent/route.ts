import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { createPaymentIntentForBillingPlan } from "@/lib/stripe/create-payment-intent";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    }

    if (user.role !== "patient") {
      return NextResponse.json({ error: "Billing is only available in the patient portal." }, { status: 403 });
    }

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: "Patient record not found." }, { status: 404 });
    }

    const { data: activeTreatment } = await supabase
      .from("treatment_plans")
      .select("id, billing_plan_id")
      .eq("patient_id", patient.id)
      .eq("status", "active")
      .maybeSingle();

    if (!activeTreatment?.billing_plan_id) {
      return NextResponse.json({ error: "No billing plan assigned to your treatment yet." }, { status: 400 });
    }

    const { data: billingPlan } = await supabase
      .from("billing_plans")
      .select("*")
      .eq("id", activeTreatment.billing_plan_id)
      .single();

    if (!billingPlan) {
      return NextResponse.json({ error: "Billing plan not found." }, { status: 404 });
    }

    const result = await createPaymentIntentForBillingPlan(
      supabase,
      user,
      patient.id,
      billingPlan,
      activeTreatment.id
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      amountCents: result.amountCents,
    });
  } catch (err) {
    console.error("[create-payment-intent]", err);
    const message = err instanceof Error ? err.message : "Payment initialization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
