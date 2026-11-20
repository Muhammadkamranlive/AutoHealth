import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { Badge, EmptyState, referralStatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner-shell";

export default async function ReferralsPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const { data: referrals } = await supabase
    .from("partner_referrals")
    .select("id, referred_name, referred_email, status, enrolled_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <PartnerShell user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="text-sm text-slate-500">Status only — no clinical details shown.</p>
        {!referrals?.length ? (
          <EmptyState title="No referrals yet" description="Refer your first client to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Referred</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((ref) => (
                <TableRow key={ref.id}>
                  <TableCell>{ref.referred_name}</TableCell>
                  <TableCell>{ref.referred_email}</TableCell>
                  <TableCell><Badge variant={referralStatusBadge(ref.status)}>{ref.status}</Badge></TableCell>
                  <TableCell>{new Date(ref.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PartnerShell>
  );
}
