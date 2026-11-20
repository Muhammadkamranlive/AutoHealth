"use server";

import type { SessionUser } from "@/lib/auth/roles";
import type { BillingPlan } from "@/lib/db";
import type { createClient } from "@/lib/supabase/server";
import { intervalDays } from "@/lib/billing/plans";
import { getOrCreateStripeCustomer } from "./record-payment";
import { getStripe } from "./server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type PaymentIntentResult =
  | { ok: true; clientSecret: string; amountCents: number; billingPlanId: string }
  | { ok: false; error: string };

export async function createPaymentIntentForBillingPlan(
  supabase: Supabase,
  user: SessionUser,
  patientId: string,
  billingPlan: BillingPlan,
  treatmentPlanId: string
): Promise<PaymentIntentResult> {
  if (user.role !== "patient") {
    return { ok: false, error: "Only patients can pay on this page." };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." };
  }

  const { data: treatment } = await supabase
    .from("treatment_plans")
    .select("id, patient_id, billing_plan_id, status")
    .eq("id", treatmentPlanId)
    .single();

  if (
    !treatment ||
    treatment.patient_id !== patientId ||
    treatment.status !== "active" ||
    treatment.billing_plan_id !== billingPlan.id
  ) {
    return { ok: false, error: "Treatment plan is not ready for payment." };
  }

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    const customerId = await getOrCreateStripeCustomer(stripe, {
      patientId,
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      existingCustomerId: existingSub?.stripe_customer_id,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: billingPlan.amount_cents,
      currency: billingPlan.currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        patient_id: patientId,
        user_id: user.id,
        billing_plan_id: billingPlan.id,
        treatment_plan_id: treatmentPlanId,
      },
      description: `${billingPlan.name} — ${billingPlan.interval}ly membership`,
    });

    if (!paymentIntent.client_secret) {
      return { ok: false, error: "Failed to initialize payment." };
    }

    return {
      ok: true,
      clientSecret: paymentIntent.client_secret,
      amountCents: billingPlan.amount_cents,
      billingPlanId: billingPlan.id,
    };
  } catch (err) {
    console.error("[createPaymentIntentForBillingPlan]", err);
    const message = err instanceof Error ? err.message : "Payment initialization failed";
    return { ok: false, error: message };
  }
}

export { intervalDays };
