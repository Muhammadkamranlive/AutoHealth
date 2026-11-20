import { redirect } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { formatPlanPrice } from "@/lib/billing/plans";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { BillingPlanEditor } from "./billing-plan-editor";

export default async function BillingPlansPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "billing:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const { data: plans } = await supabase
    .from("billing_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-medical-950 dark:text-white">Billing plans</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Define what patients pay after treatment is assigned. Link a plan when creating a treatment protocol.
        </p>
      </div>

      <Card title="Create membership plan">
        <BillingPlanEditor />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {(plans ?? []).map((plan) => (
          <Card key={plan.id} title={plan.name}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xl font-bold text-medical-700 dark:text-medical-300">
                {formatPlanPrice(plan)}
              </span>
              <Badge variant={plan.is_active ? "success" : "warning"}>
                {plan.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {plan.description && <p className="mb-3 text-sm text-slate-600">{plan.description}</p>}
            {plan.features.length > 0 && (
              <ul className="mb-4 list-inside list-disc text-sm text-slate-500">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
            <BillingPlanEditor plan={plan} />
          </Card>
        ))}
      </div>
    </div>
  );
}
