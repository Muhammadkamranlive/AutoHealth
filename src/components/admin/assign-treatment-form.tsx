"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BillingPlan } from "@/lib/db";
import { Button, FormActions, Input, Select, Textarea } from "@/components/ui";
import { assignTreatmentPlan } from "@/app/admin/billing-plans/actions";

export function AssignTreatmentForm({
  patientId,
  billingPlans,
}: {
  patientId: string;
  billingPlans: BillingPlan[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await assignTreatmentPlan(patientId, formData);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to assign treatment");
      }
    });
  }

  if (!billingPlans.length) {
    return (
      <p className="text-sm text-amber-700">
        Create billing plans first under Admin → Billing Plans, then assign treatment here.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
      <p className="text-sm text-slate-600">
        Assign clinical treatment and membership pricing. Patient can pay only after this step.
      </p>
      <Input label="Medication / program" name="medication" required placeholder="e.g. Testosterone Cypionate" />
      <Select label="Membership plan (what patient pays)" name="billing_plan_id" required defaultValue="">
        <option value="" disabled>
          Select plan…
        </option>
        {billingPlans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — ${(p.amount_cents / 100).toFixed(2)}/{p.interval}
          </option>
        ))}
      </Select>
      <Textarea label="Protocol notes (optional)" name="protocol" rows={2} placeholder="Dosing, labs schedule…" />
      <FormActions>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Assigning…" : "Assign treatment + billing plan"}
        </Button>
      </FormActions>
    </form>
  );
}
