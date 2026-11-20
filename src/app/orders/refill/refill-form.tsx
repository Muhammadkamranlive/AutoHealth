"use client";

import { useState, useTransition } from "react";
import { Button, LoadingOverlay } from "@/components/ui";
import { requestRefill } from "@/app/orders/refill/actions";

export function RefillForm({
  treatmentPlanId,
  eligible,
  ineligibleReason,
}: {
  treatmentPlanId: string;
  eligible: boolean;
  ineligibleReason?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      try {
        await requestRefill(treatmentPlanId);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit refill");
      }
    });
  }

  if (success) {
    return (
      <div className="space-y-2">
        <p className="text-green-600">Refill request submitted! Your physician will review it shortly.</p>
        <Button variant="secondary" onClick={() => (window.location.href = "/orders")}>
          View orders
        </Button>
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay active={isPending} message="saving" />
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Submit a refill request for your physician to review. You will be notified once it is approved.
        </p>
        {!eligible && ineligibleReason && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {ineligibleReason}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={handleSubmit} disabled={isPending || !eligible}>
          Submit refill request
        </Button>
      </div>
    </>
  );
}
