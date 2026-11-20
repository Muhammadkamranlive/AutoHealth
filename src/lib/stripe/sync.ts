import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Database, SubscriptionStatus } from "@/lib/db";

type ServiceClient = SupabaseClient<Database>;

function mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "trialing":
      return "trialing";
    default:
      return "incomplete";
  }
}

export async function findPatientIdByStripeCustomer(
  supabase: ServiceClient,
  customerId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("patient_id")
    .eq("stripe_customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.patient_id ?? null;
}

export async function syncSubscription(
  supabase: ServiceClient,
  subscription: Stripe.Subscription,
  patientId: string
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const firstItem = subscription.items.data[0];
  const periodStart = firstItem?.current_period_start ?? subscription.billing_cycle_anchor;
  const periodEnd = firstItem?.current_period_end ?? subscription.billing_cycle_anchor;

  const row = {
    patient_id: patientId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    billing_plan_id: subscription.metadata?.billing_plan_id ?? null,
    status: mapSubscriptionStatus(subscription.status),
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("subscriptions").upsert(row, {
    onConflict: "stripe_subscription_id",
  });

  if (error) throw new Error(error.message);
}

export async function syncInvoice(
  supabase: ServiceClient,
  invoice: Stripe.Invoice,
  patientId: string
) {
  const row = {
    patient_id: patientId,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_due ?? 0,
    currency: invoice.currency ?? "usd",
    status: invoice.status ?? "open",
    paid_at: invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : null,
  };

  const { error } = await supabase.from("invoices").upsert(row, {
    onConflict: "stripe_invoice_id",
  });

  if (error) throw new Error(error.message);
}
