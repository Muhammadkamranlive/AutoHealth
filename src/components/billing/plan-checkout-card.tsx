"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import type { BillingPlan } from "@/lib/db";
import { formatPlanPrice } from "@/lib/billing/plans";
import { Button, LoadingOverlay } from "@/components/ui";
import { getStripeJs } from "@/lib/stripe/client";

const stripePromise = getStripeJs();

function CheckoutInner({
  plan,
  amountCents,
  isRenewal,
}: {
  plan: BillingPlan;
  amountCents: number;
  isRenewal?: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError("");
    startTransition(async () => {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message ?? "Payment failed");
        return;
      }

      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        setError("Payment was not completed. Please try again.");
        return;
      }

      const res = await fetch("/api/stripe/complete-payment", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Payment succeeded but could not be saved.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <LoadingOverlay active={isPending} message="processing payment" />

      <div className="rounded-xl bg-medical-50/80 p-4 dark:bg-slate-800/50">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</p>
        <p className="mt-1 text-2xl font-bold text-medical-700 dark:text-medical-300">
          {formatPlanPrice(plan)}
        </p>
        {plan.description && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>
        )}
        {plan.features.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {plan.features.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-medical-600">✓</span>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Card details</p>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
          <PaymentElement
            options={{
              layout: "tabs",
              wallets: { applePay: "never", googlePay: "never" },
            }}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={!stripe || !elements || isPending} className="w-full">
        {isPending
          ? "Processing…"
          : isRenewal
            ? `Renew membership — ${formatPlanPrice({ ...plan, amount_cents: amountCents })}`
            : `Activate membership — ${formatPlanPrice({ ...plan, amount_cents: amountCents })}`}
      </Button>
      <p className="text-center text-xs text-slate-400">
        Secure payment powered by Stripe. You stay on this page — no redirect.
      </p>
    </form>
  );
}

export function PlanCheckoutCard({
  plan,
  clientSecret,
  amountCents,
  isRenewal,
}: {
  plan: BillingPlan;
  clientSecret: string;
  amountCents: number;
  isRenewal?: boolean;
}) {
  if (!stripePromise) {
    return <p className="text-sm text-red-600">Stripe is not configured.</p>;
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: { colorPrimary: "#0d9488", borderRadius: "8px" },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutInner plan={plan} amountCents={amountCents} isRenewal={isRenewal} />
    </Elements>
  );
}
