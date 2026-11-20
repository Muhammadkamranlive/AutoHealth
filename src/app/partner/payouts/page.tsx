import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { Badge, Card, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { PartnerShell } from "@/components/partner-shell";

export default async function PayoutsPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const { data: payouts } = await supabase
    .from("partner_payouts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <PartnerShell user={user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payouts</h1>
        {!payouts?.length ? (
          <EmptyState title="No payouts yet" description="Payout history will appear here once referrals are active." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.period_start).toLocaleDateString()} – {new Date(p.period_end).toLocaleDateString()}</TableCell>
                  <TableCell>${(p.amount_cents / 100).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={p.status === "paid" ? "success" : "warning"}>{p.status}</Badge></TableCell>
                  <TableCell>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PartnerShell>
  );
}
