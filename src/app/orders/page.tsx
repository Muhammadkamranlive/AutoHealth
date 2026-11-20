import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";
import { Badge, Button, Card, EmptyState, orderStatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { PatientShell } from "@/components/patient-shell";
import { PatientPageHeader } from "@/components/patient/page-header";

export default async function OrdersPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).single();
  if (!patient) redirect("/dashboard");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false });

  const planIds = [...new Set(orders?.map((o) => o.treatment_plan_id) ?? [])];
  const { data: plans } = planIds.length
    ? await supabase.from("treatment_plans").select("id, medication").in("id", planIds)
    : { data: [] };
  const planMap = new Map(plans?.map((p) => [p.id, p.medication]) ?? []);

  return (
    <PatientShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PatientPageHeader title="Orders & Refills" description="Track medication orders and request refills" />
          <Link href="/orders/refill">
            <Button>Request refill</Button>
          </Link>
        </div>
        {!orders?.length ? (
          <EmptyState title="No orders yet" description="Your order history will appear here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{planMap.get(order.treatment_plan_id) ?? "—"}</TableCell>
                  <TableCell>{order.is_refill ? "Refill" : "New"}</TableCell>
                  <TableCell>
                    <Badge variant={orderStatusBadge(order.status)}>{order.status.replace("_", " ")}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PatientShell>
  );
}
