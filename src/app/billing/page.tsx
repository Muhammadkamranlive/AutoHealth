import { redirect } from "next/navigation";
import { Badge, Card, EmptyState } from "@/components/ui";
import { BillingJourney } from "@/components/billing/billing-journey";
import { PlanCheckoutCard } from "@/components/billing/plan-checkout-card";
import { formatPlanPrice } from "@/lib/billing/plans";
import { resolvePatientBillingState } from "@/lib/billing/patient-state";
import { PatientShell } from "@/components/patient-shell";
import { PatientPageHeader } from "@/components/patient/page-header";
import { canAccessPatientPortal } from "@/lib/auth/roles";
import { createPaymentIntentForBillingPlan } from "@/lib/stripe/create-payment-intent";
import { isStripeConfigured } from "@/lib/stripe/server";
import { getSessionUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");
  if (!canAccessPatientPortal(user.role)) redirect("/login?error=patient_only");

  const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).single();
  if (!patient) redirect("/dashboard");

  const { data: activeTreatment } = await supabase
    .from("treatment_plans")
    .select("*")
    .eq("patient_id", patient.id)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let billingPlan = null;
  if (activeTreatment?.billing_plan_id) {
    const { data } = await supabase
      .from("billing_plans")
      .select("*")
      .eq("id", activeTreatment.billing_plan_id)
      .single();
    billingPlan = data;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const state = resolvePatientBillingState(activeTreatment, subscription, billingPlan);
  const stripeReady = isStripeConfigured();

  const paymentSetup =
    (state.step === "ready_to_pay" || state.step === "renew") && stripeReady
      ? await createPaymentIntentForBillingPlan(
          supabase,
          user,
          patient.id,
          state.plan,
          activeTreatment!.id
        )
      : null;

  return (
    <PatientShell user={user}>
      <div className="space-y-6">
        <PatientPageHeader
          title="Membership & billing"
          description="Pay only after your treatment plan is assigned by your physician"
        />

        <BillingJourney state={state} />

        {state.step === "intake" && (
          <Card title="No payment due yet">
            <p className="text-sm text-slate-600 dark:text-slate-400">{state.message}</p>
          </Card>
        )}

        {state.step === "awaiting_plan" && (
          <Card title={`Treatment: ${state.treatmentMedication}`}>
            <p className="text-sm text-slate-600 dark:text-slate-400">{state.message}</p>
          </Card>
        )}

        {state.step === "active" && state.plan && (
          <Card title="Active membership">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Plan</dt>
                <dd className="font-medium">{state.plan.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Price</dt>
                <dd>{formatPlanPrice(state.plan)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Paid through</dt>
                <dd>{new Date(state.paidThrough).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd><Badge variant="success">Active</Badge></dd>
              </div>
            </dl>
          </Card>
        )}

        {(state.step === "ready_to_pay" || state.step === "renew") && (
          <Card title={state.step === "renew" ? "Renew your membership" : "Activate your membership"}>
            {!stripeReady ? (
              <p className="text-sm text-slate-500">Payment processing is not configured.</p>
            ) : paymentSetup?.ok ? (
              <PlanCheckoutCard
                plan={state.plan}
                clientSecret={paymentSetup.clientSecret}
                amountCents={paymentSetup.amountCents}
                isRenewal={state.step === "renew"}
              />
            ) : (
              <p className="text-sm text-red-600">
                {paymentSetup && !paymentSetup.ok ? paymentSetup.error : "Could not load checkout."}
              </p>
            )}
          </Card>
        )}

        <Card title="Payment history">
          {!invoices?.length ? (
            <EmptyState title="No payments yet" description="Your receipts appear here after you activate membership." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span>{new Date(inv.created_at).toLocaleDateString()}</span>
                  <span className="font-medium">${(inv.amount_cents / 100).toFixed(2)}</span>
                  <Badge variant={inv.status === "paid" ? "success" : "warning"}>{inv.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PatientShell>
  );
}
