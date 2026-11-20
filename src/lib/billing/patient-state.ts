import type { BillingPlan, Subscription, TreatmentPlan } from "@/lib/db";
import type { PatientBillingState } from "./plans";
import { subscriptionIsCurrent } from "@/lib/stripe/record-payment";

export function resolvePatientBillingState(
  activeTreatment: (TreatmentPlan & { billing_plan?: BillingPlan | null }) | null,
  subscription: Subscription | null,
  billingPlan: BillingPlan | null
): PatientBillingState {
  if (!activeTreatment) {
    return {
      step: "intake",
      message:
        "Payment starts after your physician assigns a treatment plan. Complete intake and your care team will reach out.",
    };
  }

  if (!activeTreatment.billing_plan_id || !billingPlan) {
    return {
      step: "awaiting_plan",
      treatmentMedication: activeTreatment.medication,
      message:
        "Your treatment is approved. Your care team is linking your membership plan — you'll be notified when payment is ready.",
    };
  }

  const isActive =
    subscription?.status === "active" &&
    subscription.billing_plan_id === billingPlan.id &&
    subscriptionIsCurrent(subscription.current_period_end);

  if (isActive && subscription) {
    return {
      step: "active",
      plan: billingPlan,
      paidThrough: subscription.current_period_end,
    };
  }

  if (subscription && subscription.billing_plan_id === billingPlan.id) {
    return {
      step: "renew",
      plan: billingPlan,
      paidThrough: subscription.current_period_end,
    };
  }

  return {
    step: "ready_to_pay",
    treatmentPlanId: activeTreatment.id,
    plan: billingPlan,
  };
}
