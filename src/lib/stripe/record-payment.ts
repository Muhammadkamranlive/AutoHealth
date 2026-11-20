import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, BillingInterval } from "@/lib/db";
import { intervalDays } from "@/lib/billing/plans";
import { localSubscriptionId } from "./constants";

type ServiceClient = SupabaseClient<Database>;

export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  opts: {
    patientId: string;
    email: string;
    name: string;
    existingCustomerId?: string | null;
  }
): Promise<string> {
  if (opts.existingCustomerId) return opts.existingCustomerId;

  const customer = await stripe.customers.create({
    email: opts.email,
    name: opts.name,
    metadata: { patient_id: opts.patientId },
  });

  return customer.id;
}

/** Persist a succeeded PaymentIntent as invoice + active subscription (no webhook). */
export async function recordSuccessfulPayment(
  supabase: ServiceClient,
  paymentIntent: Stripe.PaymentIntent,
  patientId: string,
  billingPlanId?: string | null,
  interval: BillingInterval = "month"
) {
  if (paymentIntent.status !== "succeeded") {
    throw new Error("Payment has not succeeded");
  }

  const customerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id;

  if (!customerId) {
    throw new Error("Missing Stripe customer on payment");
  }

  const planId = billingPlanId ?? paymentIntent.metadata.billing_plan_id ?? null;

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + intervalDays(interval));

  const amountCents = paymentIntent.amount_received || paymentIntent.amount || 0;

  const { error: subError } = await supabase.from("subscriptions").upsert(
    {
      patient_id: patientId,
      stripe_subscription_id: localSubscriptionId(customerId),
      stripe_customer_id: customerId,
      billing_plan_id: planId,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      updated_at: now.toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (subError) throw new Error(subError.message);

  const { error: invError } = await supabase.from("invoices").upsert(
    {
      patient_id: patientId,
      stripe_invoice_id: paymentIntent.id,
      amount_cents: amountCents,
      currency: paymentIntent.currency ?? "usd",
      status: "paid",
      paid_at: now.toISOString(),
    },
    { onConflict: "stripe_invoice_id" }
  );

  if (invError) throw new Error(invError.message);
}

export function subscriptionIsCurrent(periodEnd: string): boolean {
  return new Date(periodEnd).getTime() > Date.now();
}
