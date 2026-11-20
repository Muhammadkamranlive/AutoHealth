/** Monthly care plan amount in cents (default $99). Override via env. */
export function getPlanAmountCents(): number {
  const raw = process.env.STRIPE_PLAN_AMOUNT_CENTS;
  const parsed = raw ? Number.parseInt(raw, 10) : 9900;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 9900;
}

export function formatPlanAmount(cents = getPlanAmountCents()): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Synthetic subscription id for DB rows backed by PaymentIntents (not Stripe Subscriptions). */
export function localSubscriptionId(customerId: string): string {
  return `local_${customerId}`;
}
