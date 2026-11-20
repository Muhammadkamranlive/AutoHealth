"use client";

import { useTransition } from "react";
import type { BillingPlan } from "@/lib/db";
import { Button, FormActions, FormGrid, Input, Select, Textarea } from "@/components/ui";
import { upsertBillingPlan } from "./actions";

export function BillingPlanEditor({
  plan,
  onDone,
}: {
  plan?: BillingPlan;
  onDone?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await upsertBillingPlan(formData);
      onDone?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <FormGrid>
        <Input label="Plan name" name="name" defaultValue={plan?.name} required placeholder="TRT Monthly Care" />
        <Input
          label="Price (USD)"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={plan ? (plan.amount_cents / 100).toFixed(2) : ""}
          placeholder="199.00"
        />
        <Select label="Billing interval" name="interval" defaultValue={plan?.interval ?? "month"}>
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly</option>
          <option value="year">Yearly</option>
        </Select>
        <Input label="Sort order" name="sort_order" type="number" defaultValue={plan?.sort_order ?? 0} />
      </FormGrid>
      <Textarea
        label="Description (shown to patients)"
        name="description"
        rows={2}
        defaultValue={plan?.description ?? ""}
        placeholder="What this membership includes clinically..."
      />
      <Textarea
        label="Features (one per line)"
        name="features"
        rows={4}
        defaultValue={plan?.features.join("\n") ?? ""}
        placeholder={"Monthly medication supply\nPhysician order review\nCare team messaging"}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={plan?.is_active ?? true} />
        Active — visible when assigning to patients
      </label>
      <FormActions>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : plan ? "Update plan" : "Create plan"}
        </Button>
      </FormActions>
    </form>
  );
}
