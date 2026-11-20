import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner-shell";

export default async function ProfilePage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const { data: partnerUser } = await supabase
    .from("partner_users")
    .select("partner_id")
    .eq("user_id", user.id)
    .single();

  let partner: {
    org_name: string;
    contact_email: string;
    contact_phone: string | null;
    payout_method: string | null;
  } | null = null;

  if (partnerUser) {
    const { data } = await supabase.from("partners").select("*").eq("id", partnerUser.partner_id).single();
    partner = data;
  }

  return (
    <PartnerShell user={user}>
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">Organization Profile</h1>
        <Card title={partner?.org_name ?? "Your Organization"}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Contact email</dt><dd>{partner?.contact_email ?? user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{partner?.contact_phone ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Payout method</dt><dd>{partner?.payout_method ?? "Not configured"}</dd></div>
          </dl>
        </Card>
      </div>
    </PartnerShell>
  );
}
