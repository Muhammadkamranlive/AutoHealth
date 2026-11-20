import type { BillingPlan, BillingInterval } from "@/lib/db";

export type PatientBillingState =
  | { step: "intake"; message: string }
  | { step: "awaiting_plan"; treatmentMedication: string; message: string }
  | { step: "ready_to_pay"; treatmentPlanId: string; plan: BillingPlan }
  | { step: "active"; plan: BillingPlan | null; paidThrough: string }
  | { step: "renew"; plan: BillingPlan; paidThrough: string | null };

export function formatBillingInterval(interval: BillingInterval): string {
  switch (interval) {
    case "month":
      return "month";
    case "quarter":
      return "quarter";
    case "year":
      return "year";
  }
}

export function formatPlanPrice(plan: Pick<BillingPlan, "amount_cents" | "interval">): string {
  const amount = (plan.amount_cents / 100).toFixed(2);
  return `$${amount}/${formatBillingInterval(plan.interval)}`;
}

export function intervalDays(interval: BillingInterval): number {
  switch (interval) {
    case "month":
      return 30;
    case "quarter":
      return 90;
    case "year":
      return 365;
  }
}

export const BILLING_JOURNEY_STEPS = [
  { id: 1, label: "Intake & profile", detail: "Complete forms and meet your care team" },
  { id: 2, label: "Treatment assigned", detail: "Physician approves your clinical protocol" },
  { id: 3, label: "Activate membership", detail: "Pay for medication + ongoing care" },
  { id: 4, label: "Orders & refills", detail: "Request refills as your plan allows" },
] as const;
