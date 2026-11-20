import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { getAssignedFormsForUser } from "@/lib/forms/resolve";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner-shell";
import { ProfileTasksCard } from "@/components/profile-tasks/profile-tasks";

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const [profileTasks, { data: profileRow }] = await Promise.all([
    getAssignedFormsForUser(supabase, user.id, user.role),
    supabase.from("profiles").select("profile_completion_percent").eq("id", user.id).single(),
  ]);

  const { count: referralCount } = await supabase
    .from("partner_referrals")
    .select("*", { count: "exact", head: true });

  const { count: activeCount } = await supabase
    .from("partner_referrals")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { data: pendingPayout } = await supabase
    .from("partner_payouts")
    .select("amount_cents")
    .eq("status", "pending")
    .limit(1)
    .single();

  return (
    <PartnerShell user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Partner Dashboard</h1>

        {profileTasks.length > 0 && (
          <ProfileTasksCard
            tasks={profileTasks}
            tasksHref="/partner/tasks"
            overallPercent={profileRow?.profile_completion_percent ?? 0}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/partner/referrals"><Card title="Total Referrals"><p className="text-3xl font-bold">{referralCount ?? 0}</p></Card></Link>
          <Card title="Active Clients"><p className="text-3xl font-bold text-green-600">{activeCount ?? 0}</p></Card>
          <Link href="/partner/payouts"><Card title="Pending Payout"><p className="text-3xl font-bold">${((pendingPayout?.amount_cents ?? 0) / 100).toFixed(2)}</p></Card></Link>
        </div>
      </div>
    </PartnerShell>
  );
}
