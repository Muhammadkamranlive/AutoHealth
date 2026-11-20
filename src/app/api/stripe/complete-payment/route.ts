import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { recordSuccessfulPayment } from "@/lib/stripe/record-payment";
import { getStripe } from "@/lib/stripe/server";
import { createSupabaseServiceClient } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    }

    if (user.role !== "patient") {
      return NextResponse.json({ error: "Billing is only available for patient accounts." }, { status: 403 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    let paymentIntentId: string;
    try {
      const body = (await request.json()) as { paymentIntentId?: string };
      paymentIntentId = body.paymentIntentId ?? "";
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!paymentIntentId) {
      return NextResponse.json({ error: "paymentIntentId is required" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.user_id !== user.id) {
      return NextResponse.json({ error: "Payment does not belong to this account" }, { status: 403 });
    }

    const patientId = paymentIntent.metadata.patient_id;
    if (!patientId) {
      return NextResponse.json({ error: "Invalid payment metadata" }, { status: 400 });
    }

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const billingPlanId = paymentIntent.metadata.billing_plan_id ?? null;
    let interval: "month" | "quarter" | "year" = "month";

    if (billingPlanId) {
      const { data: plan } = await supabase
        .from("billing_plans")
        .select("interval")
        .eq("id", billingPlanId)
        .maybeSingle();
      if (plan?.interval) interval = plan.interval;
    }

    const admin = createSupabaseServiceClient();
    await recordSuccessfulPayment(admin, paymentIntent, patientId, billingPlanId, interval);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[complete-payment]", err);
    const message = err instanceof Error ? err.message : "Could not save payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
