import { redirect } from "next/navigation";
import { getSessionUser, requirePermission } from "@/lib/auth/server";
import type { Order, Patient, TreatmentPlan } from "@/lib/db";
import { EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { ReviewQueueFilters } from "@/components/admin/review-queue-filters";
import { ReviewQueueList } from "./review-queue-list";

interface ReviewQueuePageProps {
  searchParams: Promise<{ physician?: string; sort?: string }>;
}

export default async function ReviewQueuePage({ searchParams }: ReviewQueuePageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  try {
    await requirePermission(supabase, "orders:read");
  } catch {
    redirect("/admin?error=no_permission");
  }

  const { data: physicians } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "physician")
    .order("last_name");

  const physicianOptions =
    physicians?.map((p) => ({
      id: p.id,
      name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id.slice(0, 8),
    })) ?? [];

  const sortAsc = params.sort !== "newest";

  let orderQuery = supabase
    .from("orders")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at", { ascending: sortAsc });

  const { data: ordersRaw } = await orderQuery;

  if (!ordersRaw?.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-medical-950 dark:text-white">Review Queue</h1>
          <p className="text-slate-600 dark:text-slate-400">Orders awaiting physician approval</p>
        </div>
        <ReviewQueueFilters
          physicians={physicianOptions}
          defaultPhysician={params.physician}
          defaultSort={params.sort ?? "longest"}
        />
        <EmptyState title="Queue is empty" description="No orders are pending review." />
      </div>
    );
  }

  const patientIds = [...new Set(ordersRaw.map((o) => o.patient_id))];
  const planIds = [...new Set(ordersRaw.map((o) => o.treatment_plan_id))];

  const [{ data: patients }, { data: plans }] = await Promise.all([
    supabase.from("patients").select("id, user_id, assigned_physician_id").in("id", patientIds),
    supabase.from("treatment_plans").select("id, medication, physician_id").in("id", planIds),
  ]);

  let orders = ordersRaw as Order[];

  if (params.physician) {
    const patientMap = new Map(patients?.map((p) => [p.id, p]) ?? []);
    const planMap = new Map(plans?.map((p) => [p.id, p]) ?? []);
    orders = orders.filter((order) => {
      const patient = patientMap.get(order.patient_id);
      const plan = planMap.get(order.treatment_plan_id);
      return (
        patient?.assigned_physician_id === params.physician ||
        plan?.physician_id === params.physician
      );
    });
  }

  if (!orders.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-medical-950 dark:text-white">Review Queue</h1>
          <p className="text-slate-600 dark:text-slate-400">Orders awaiting physician approval</p>
        </div>
        <ReviewQueueFilters
          physicians={physicianOptions}
          defaultPhysician={params.physician}
          defaultSort={params.sort ?? "longest"}
        />
        <EmptyState title="No matching orders" description="Try clearing the physician filter." />
      </div>
    );
  }

  const userIds = patients?.map((p) => p.user_id) ?? [];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds)
    : { data: [] };

  const patientMap = new Map(patients?.map((p) => [p.id, p]) ?? []);
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  const planMap = new Map(plans?.map((p) => [p.id, p]) ?? []);

  const reviewerIds = [...new Set(orders.map((o) => o.reviewed_by).filter(Boolean))] as string[];
  const { data: reviewers } = reviewerIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", reviewerIds)
    : { data: [] };
  const reviewerMap = new Map(
    reviewers?.map((r) => [r.id, `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim()]) ?? []
  );

  const queueItems = orders.map((order) => {
    const patient = patientMap.get(order.patient_id) as Pick<Patient, "id" | "user_id" | "assigned_physician_id"> | undefined;
    const profile = patient ? profileMap.get(patient.user_id) : undefined;
    const plan = planMap.get(order.treatment_plan_id) as Pick<TreatmentPlan, "medication" | "physician_id"> | undefined;

    return {
      ...order,
      patient: patient ? { id: patient.id, profiles: profile ?? null } : null,
      treatment_plan: plan ?? null,
      reviewer_name: order.reviewed_by ? reviewerMap.get(order.reviewed_by) ?? null : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-medical-950 dark:text-white">Review Queue</h1>
        <p className="text-slate-600 dark:text-slate-400">
          {orders.length} order{orders.length !== 1 ? "s" : ""} awaiting approval
          {user.role === "care_team" && (
            <span className="ml-2 text-amber-600">(View only)</span>
          )}
        </p>
      </div>

      <ReviewQueueFilters
        physicians={physicianOptions}
        defaultPhysician={params.physician}
        defaultSort={params.sort ?? "longest"}
      />

      <ReviewQueueList orders={queueItems} user={user} />
    </div>
  );
}
